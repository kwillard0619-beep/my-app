"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import CustomerDrawer from "./CustomerDrawer";
import AppSidebar from "./AppSidebar";
import type { Customer } from "../types/customer";

import {
  createCategoryColorMap,
  getCategoryStyle,
} from "./categoryColors";

type FilterField =
  | "grantor"
  | "maximum_grant"
  | "deadline"
  | "anticipated_deadline"
  | "category"
  | "limited_opportunity"
  | "fellowship_opportunity";

type FilterOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "before"
  | "after";

type AdvancedFilter = {
  id: number;
  connector: "AND" | "OR";
  field: FilterField;
  operator: FilterOperator;
  values: string[];
};

type SortField =
  | "grantor"
  | "maximum_grant"
  | "deadline"
  | "anticipated_deadline";

type SortDirection = "asc" | "desc";

type SortRule = {
  id: number;
  field: SortField;
  direction: SortDirection;
};

const SORT_FIELD_LABELS: Record<SortField, string> = {
  grantor: "Grantor",
  maximum_grant: "Maximum Grant",
  deadline: "Deadline",
  anticipated_deadline: "Anticipated Deadline",
};

const DEADLINE_ACCENTS = [
  "#C86F78",
  "#6F8292",
  "#D29B52",
  "#B65F70",
  "#7E8A96",
  "#D47D5F",
  "#A86F79",
  "#B28A4B",
];

const MAXIMUM_GRANT_RANGES = [
  {
    label: "Under $50,000",
    min: 0,
    max: 50000,
  },
  {
    label: "$50,000 – $99,999",
    min: 50000,
    max: 100000,
  },
  {
    label: "$100,000 – $249,999",
    min: 100000,
    max: 250000,
  },
  {
    label: "$250,000 – $499,999",
    min: 250000,
    max: 500000,
  },
  {
    label: "$500,000 – $999,999",
    min: 500000,
    max: 1000000,
  },
  {
    label: "$1,000,000+",
    min: 1000000,
    max: null,
  },
] as const;

export default function CustomerTable({
  customers,
  activeCount,
  mode = "active",
}: {
  customers: Customer[];
  activeCount: number;
  mode?: "active" | "favorites";
}) {
  const router = useRouter();
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);
  const [favoritesReady, setFavoritesReady] =
    useState(false);
  const [favoriteIds, setFavoriteIds] =
    useState<Set<string>>(
      () =>
        mode === "favorites"
          ? new Set(
              customers.map((customer) =>
                String(customer.id)
              )
            )
          : new Set()
    );
  const [favoritePendingIds, setFavoritePendingIds] =
    useState<Set<string>>(() => new Set());
  const [favoriteView, setFavoriteView] =
    useState<"active" | "archived">("active");

  const favoriteActiveCount = useMemo(
    () =>
      customers.filter(
        (customer) =>
          String(customer.Category)
            .trim()
            .toLowerCase() === "active"
      ).length,
    [customers]
  );

  const favoriteArchivedCount = useMemo(
    () =>
      customers.filter(
        (customer) =>
          String(customer.Category)
            .trim()
            .toLowerCase() === "archived"
      ).length,
    [customers]
  );

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setCurrentUserId(null);
        setFavoriteIds(new Set());
        setFavoritesReady(true);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("favorites")
        .select("opportunity_id")
        .eq("user_id", user.id);

      if (!active) return;

      if (error) {
        console.error("Error loading favorites:", error);
        setFavoriteIds(new Set());
      } else {
        setFavoriteIds(
          new Set(
            (data ?? []).map((favorite) =>
              String(favorite.opportunity_id)
            )
          )
        );
      }

      setFavoritesReady(true);
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [supabase]);

  const toggleFavorite = async (
    opportunityId: Customer["id"]
  ) => {
    const id = String(opportunityId);

    if (!favoritesReady) return;

    if (!currentUserId) {
      router.push("/login?next=/");
      return;
    }

    if (favoritePendingIds.has(id)) return;

    const wasFavorite = favoriteIds.has(id);

    setFavoritePendingIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    setFavoriteIds((current) => {
      const next = new Set(current);

      if (wasFavorite) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

    const { error } = wasFavorite
      ? await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("opportunity_id", opportunityId)
      : await supabase.from("favorites").insert({
          user_id: currentUserId,
          opportunity_id: opportunityId,
        });

    if (error) {
      console.error("Error updating favorite:", error);
      setFavoriteIds((current) => {
        const next = new Set(current);

        if (wasFavorite) {
          next.add(id);
        } else {
          next.delete(id);
        }

        return next;
      });
    }

    setFavoritePendingIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  // --------------------------------------------------
  // Selected Customer / Realtime Drawer
  // --------------------------------------------------

    // --------------------------------------------------
  // Selected Customer / Realtime Drawer
  // --------------------------------------------------

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);

  const rowRefs = useRef<
    Record<string, HTMLTableRowElement | null>
  >({});

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }

    return (
      customers.find(
        (customer) =>
          String(customer.id) ===
          String(selectedCustomerId)
      ) ?? null
    );
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomerId) {
      return;
    }

    const selectedRow =
      rowRefs.current[
        String(selectedCustomerId)
      ];

    if (selectedRow) {
      selectedRow.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectedCustomerId]);

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // --------------------------------------------------
  // Stackable Sort State
  // --------------------------------------------------

  const [sortRules, setSortRules] = useState<SortRule[]>([
    {
      id: 1,
      field: "deadline",
      direction: "asc",
    },
    {
      id: 2,
      field: "anticipated_deadline",
      direction: "asc",
    },
    {
      id: 3,
      field: "maximum_grant",
      direction: "desc",
    },
  ]);

  const [nextSortId, setNextSortId] = useState(4);

  const [draggedSortId, setDraggedSortId] =
    useState<number | null>(null);

  const [dragOverSortId, setDragOverSortId] =
    useState<number | null>(null);

  // --------------------------------------------------
  // Sort Dropdown State
  // --------------------------------------------------

  const [showSortOptions, setShowSortOptions] =
    useState(false);

  const sortDropdownRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Quick Filter State
  // --------------------------------------------------

  const [showQuickFilters, setShowQuickFilters] =
    useState(false);

  const quickFilterButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const quickFilterPopoverRef =
    useRef<HTMLDivElement | null>(null);

  const [quickGrantors, setQuickGrantors] =
    useState<string[]>([]);

  const [quickMaximumGrants, setQuickMaximumGrants] =
    useState<string[]>([]);

  const [quickDeadline, setQuickDeadline] =
    useState("all");

  const [quickMonths, setQuickMonths] =
    useState<string[]>([]);

  const [quickCategories, setQuickCategories] =
    useState<string[]>([]);

  // --------------------------------------------------
  // Advanced Filter State
  // --------------------------------------------------

  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState(false);

  const advancedFilterButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const advancedFilterPopoverRef =
    useRef<HTMLDivElement | null>(null);

  const [advancedFilters, setAdvancedFilters] =
    useState<AdvancedFilter[]>([]);

  const [nextFilterId, setNextFilterId] =
    useState(1);

  // --------------------------------------------------
  // Advanced Dropdown State
  // --------------------------------------------------

  const [openAdvancedDropdownId, setOpenAdvancedDropdownId] =
    useState<number | null>(null);

  const advancedDropdownRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Close Dropdowns When Clicking Outside
  // --------------------------------------------------

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      const target = event.target as Node;

      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(target)
      ) {
        setShowSortOptions(false);
      }

      if (
        advancedDropdownRef.current &&
        !advancedDropdownRef.current.contains(target)
      ) {
        setOpenAdvancedDropdownId(null);
      }

      if (
        showQuickFilters &&
        quickFilterPopoverRef.current &&
        !quickFilterPopoverRef.current.contains(
          target
        ) &&
        !quickFilterButtonRef.current?.contains(
          target
        )
      ) {
        setShowQuickFilters(false);
      }

      if (
        showAdvancedFilters &&
        advancedFilterPopoverRef.current &&
        !advancedFilterPopoverRef.current.contains(
          target
        ) &&
        !advancedFilterButtonRef.current?.contains(
          target
        )
      ) {
        setShowAdvancedFilters(false);
        setOpenAdvancedDropdownId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [
    showQuickFilters,
    showAdvancedFilters,
  ]);

  // --------------------------------------------------
  // Dynamic Filter Options
  // --------------------------------------------------

  const availableCategories = useMemo(() => {
    const categories = customers.flatMap(
      (customer) =>
        Array.isArray(customer.rfp_categories)
          ? customer.rfp_categories
          : []
    );

    return Array.from(
      new Set(
        categories
          .filter(Boolean)
          .map((category) =>
            String(category).trim()
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [customers]);

  // --------------------------------------------------
  // Shared Category Color Map
  // --------------------------------------------------

  const categoryColorMap = useMemo(() => {
    return createCategoryColorMap(
      availableCategories
    );
  }, [availableCategories]);

  const availableGrantors = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .map((customer) =>
            String(
              customer.grantor ?? ""
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [customers]);

  const parseMaximumGrant = (
    value:
      | string
      | number
      | null
      | undefined
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const numericValue = Number(
      String(value)
        .replace(/[$,]/g, "")
        .replace(/[^\d.-]/g, "")
    );

    return Number.isNaN(numericValue)
      ? 0
      : numericValue;
  };

  const matchesMaximumGrantRange = (
    value:
      | string
      | number
      | null
      | undefined,
    rangeLabel: string
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return false;
    }

    const amount =
      parseMaximumGrant(value);
    const range =
      MAXIMUM_GRANT_RANGES.find(
        (candidate) =>
          candidate.label ===
          rangeLabel
      );

    if (!range) {
      return false;
    }

    return (
      amount >= range.min &&
      (range.max === null ||
        amount < range.max)
    );
  };

  const availableMaximumGrants = useMemo(() => {
    return MAXIMUM_GRANT_RANGES.filter(
      (range) =>
        customers.some((customer) =>
          matchesMaximumGrantRange(
            customer.maximum_grant,
            range.label
          )
        )
    ).map((range) => range.label);
  }, [customers]);

  const availableMonths = useMemo(() => {
    const months = customers
      .map((customer) =>
        String(
          customer.anticipated_deadline ??
            ""
        ).trim()
      )
      .filter(Boolean);

    const monthOrder = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
      "rolling",
    ];

    return Array.from(
      new Set(months)
    ).sort((a, b) => {
      const aIndex =
        monthOrder.indexOf(
          a.toLowerCase()
        );

      const bIndex =
        monthOrder.indexOf(
          b.toLowerCase()
        );

      if (
        aIndex === -1 &&
        bIndex === -1
      ) {
        return a.localeCompare(b);
      }

      if (aIndex === -1) {
        return 1;
      }

      if (bIndex === -1) {
        return -1;
      }

      return aIndex - bIndex;
    });
  }, [customers]);

  // --------------------------------------------------
  // Available Deadlines
  // --------------------------------------------------

  const availableDeadlines = useMemo(
    (): string[] => {
      return Array.from(
        new Set(
          customers
            .map((customer) =>
              customer.deadline
                ? String(
                    customer.deadline
                  ).trim()
                : ""
            )
            .filter(
              (
                deadline
              ): deadline is string =>
                Boolean(deadline)
            )
        )
      ).sort();
    },
    [customers]
  );

  const availableLimitedOpportunities =
    useMemo(() => {
      return Array.from(
        new Set(
          customers
            .map((customer) =>
              String(
                customer.limited_opportunity ??
                  ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [customers]);

  const availableFellowshipOpportunities =
    useMemo(() => {
      return Array.from(
        new Set(
          customers
            .map((customer) =>
              String(
                customer.fellowship_opportunity ??
                  ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [customers]);

  // --------------------------------------------------
  // Helper Functions
  // --------------------------------------------------

  const toggleArrayValue = (
    value: string,
    currentValues: string[],
    setter: React.Dispatch<
      React.SetStateAction<string[]>
    >
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter(
            (item) => item !== value
          )
        : [...current, value]
    );
  };

  const getDeadlineDays = (
    deadline: string | null
  ) => {
    if (!deadline) {
      return null;
    }

    const deadlineDate = new Date(
      `${deadline}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    return Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );
  };

  const matchesQuickDeadline = (
    deadline: string | null
  ) => {
    if (
      quickDeadline === "all"
    ) {
      return true;
    }

    if (
      quickDeadline ===
      "no-deadline"
    ) {
      return !deadline;
    }

    if (!deadline) {
      return false;
    }

    const daysUntil =
      getDeadlineDays(deadline);

    if (
      daysUntil === null ||
      daysUntil < 0
    ) {
      return false;
    }

    if (
      quickDeadline === "30"
    ) {
      return daysUntil <= 30;
    }

    if (
      quickDeadline === "60"
    ) {
      return daysUntil <= 60;
    }

    if (
      quickDeadline === "90"
    ) {
      return daysUntil <= 90;
    }

    return true;
  };

  // --------------------------------------------------
  // Clear Quick Filters
  // --------------------------------------------------

  const clearQuickFilters = () => {
    setQuickGrantors([]);
    setQuickMaximumGrants([]);
    setQuickDeadline("all");
    setQuickMonths([]);
    setQuickCategories([]);
  };

  // --------------------------------------------------
  // Clear Advanced Filters
  // --------------------------------------------------

  const clearAdvancedFilters = () => {
    setAdvancedFilters([]);
    setOpenAdvancedDropdownId(null);
  };

  // --------------------------------------------------
  // Advanced Filter Matching
  // --------------------------------------------------

  const getFilterValues = (
    customer: Customer,
    field: FilterField
  ): string[] => {
    switch (field) {
      case "grantor":
        return customer.grantor
          ? [String(customer.grantor)]
          : [];

      case "maximum_grant":
        return customer.maximum_grant
          ? [
              String(
                customer.maximum_grant
              ),
            ]
          : [];

      case "deadline":
        return customer.deadline
          ? [String(customer.deadline)]
          : [];

      case "anticipated_deadline":
        return customer.anticipated_deadline
          ? [
              String(
                customer.anticipated_deadline
              ),
            ]
          : [];

      case "category":
        return Array.isArray(
          customer.rfp_categories
        )
          ? customer.rfp_categories.map(
              (value) => String(value)
            )
          : [];

      case "limited_opportunity":
        return customer.limited_opportunity
          ? [
              String(
                customer.limited_opportunity
              ),
            ]
          : [];

      case "fellowship_opportunity":
        return customer.fellowship_opportunity
          ? [
              String(
                customer.fellowship_opportunity
              ),
            ]
          : [];

      default:
        return [];
    }
  };

  const getAdvancedOperators = (
    field: FilterField
  ): FilterOperator[] => {
    if (
      field === "grantor" ||
      field === "category"
    ) {
      return [
        "is",
        "is_not",
        "contains",
        "not_contains",
      ];
    }

    if (field === "deadline") {
      return [
        "is",
        "is_not",
        "before",
        "after",
      ];
    }

    return ["is", "is_not"];
  };

  const getOperatorLabel = (
    operator: FilterOperator,
    field: FilterField
  ) => {
    if (
      field === "maximum_grant" &&
      operator === "is"
    ) {
      return "is within";
    }

    if (
      field === "maximum_grant" &&
      operator === "is_not"
    ) {
      return "is not within";
    }

    const labels: Record<
      FilterOperator,
      string
    > = {
      is: "is",
      is_not: "is not",
      contains: "contains",
      not_contains: "does not contain",
      before: "is before",
      after: "is after",
    };

    return labels[operator];
  };

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    if (
      filter.values.length === 0
    ) {
      return true;
    }

    if (
      filter.field ===
      "maximum_grant"
    ) {
      const hasRangeMatch =
        filter.values.some(
          (rangeLabel) =>
            matchesMaximumGrantRange(
              customer.maximum_grant,
              rangeLabel
            )
        );

      return filter.operator ===
        "is_not"
        ? !hasRangeMatch
        : hasRangeMatch;
    }

    const customerValues =
      getFilterValues(
        customer,
        filter.field
      ).map((value) =>
        String(value)
          .trim()
          .toLowerCase()
      );

    const selectedValues =
      filter.values.map((value) =>
        String(value)
          .trim()
          .toLowerCase()
      );

    const hasMatch =
      selectedValues.some(
        (selectedValue) =>
          customerValues.includes(
            selectedValue
          )
      );

    if (
      filter.operator === "contains" ||
      filter.operator ===
        "not_contains"
    ) {
      const containsMatch =
        selectedValues.some(
          (selectedValue) =>
            customerValues.some(
              (customerValue) =>
                customerValue.includes(
                  selectedValue
                )
            )
        );

      return filter.operator ===
        "not_contains"
        ? !containsMatch
        : containsMatch;
    }

    if (
      (filter.operator === "before" ||
        filter.operator === "after") &&
      filter.field === "deadline"
    ) {
      const customerDeadline =
        customer.deadline
          ? new Date(
              `${customer.deadline}T00:00:00`
            ).getTime()
          : null;

      if (customerDeadline === null) {
        return false;
      }

      return filter.values.some(
        (value) => {
          const comparisonDeadline =
            new Date(
              `${value}T00:00:00`
            ).getTime();

          return filter.operator ===
            "before"
            ? customerDeadline <
                comparisonDeadline
            : customerDeadline >
                comparisonDeadline;
        }
      );
    }

    if (
      filter.operator ===
      "is_not"
    ) {
      return !hasMatch;
    }

    return hasMatch;
  };

  // --------------------------------------------------
  // Sorting Helpers
  // --------------------------------------------------

  const getAnticipatedMonthRank = (
    value:
      | string
      | null
      | undefined
  ) => {
    if (
      !value ||
      !value.trim()
    ) {
      return 999;
    }

    const normalized =
      value.trim().toLowerCase();

    const monthOrder: Record<
      string,
      number
    > = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
      rolling: 13,
    };

    return (
      monthOrder[normalized] ??
      14
    );
  };

  const compareDeadlines = (
    a:
      | string
      | null
      | undefined,
    b:
      | string
      | null
      | undefined,
    descending = false
  ) => {
    const aBlank =
      !a || !a.trim();

    const bBlank =
      !b || !b.trim();

    if (
      aBlank &&
      bBlank
    ) {
      return 0;
    }

    if (aBlank) {
      return 1;
    }

    if (bBlank) {
      return -1;
    }

    const aTime = new Date(
      `${a}T00:00:00`
    ).getTime();

    const bTime = new Date(
      `${b}T00:00:00`
    ).getTime();

    return descending
      ? bTime - aTime
      : aTime - bTime;
  };

  const compareAnticipatedDeadlines = (
    a:
      | string
      | null
      | undefined,
    b:
      | string
      | null
      | undefined,
    descending = false
  ) => {
    const aRank =
      getAnticipatedMonthRank(a);

    const bRank =
      getAnticipatedMonthRank(b);

    if (
      aRank !== bRank
    ) {
      return descending
        ? bRank - aRank
        : aRank - bRank;
    }

    const aBlank =
      !a || !a.trim();

    const bBlank =
      !b || !b.trim();

    if (
      aBlank &&
      bBlank
    ) {
      return 0;
    }

    if (aBlank) {
      return 1;
    }

    if (bBlank) {
      return -1;
    }

    return descending
      ? String(b).localeCompare(
          String(a)
        )
      : String(a).localeCompare(
          String(b)
        );
  };

  const compareMaximumGrants = (
    a:
      | string
      | null
      | undefined,
    b:
      | string
      | null
      | undefined,
    descending = true
  ) => {
    const aValue =
      parseMaximumGrant(a);

    const bValue =
      parseMaximumGrant(b);

    return descending
      ? bValue - aValue
      : aValue - bValue;
  };

  const compareGrantors = (
    a:
      | string
      | null
      | undefined,
    b:
      | string
      | null
      | undefined,
    descending = false
  ) => {
    const aBlank =
      !a || !a.trim();

    const bBlank =
      !b || !b.trim();

    if (
      aBlank &&
      bBlank
    ) {
      return 0;
    }

    if (aBlank) {
      return 1;
    }

    if (bBlank) {
      return -1;
    }

    return descending
      ? String(b).localeCompare(
          String(a)
        )
      : String(a).localeCompare(
          String(b)
        );
  };

  const compareBySortRule = (
    a: Customer,
    b: Customer,
    rule: SortRule
  ) => {
    const descending =
      rule.direction === "desc";

    switch (rule.field) {
      case "grantor":
        return compareGrantors(
          a.grantor,
          b.grantor,
          descending
        );

      case "maximum_grant":
        return compareMaximumGrants(
          a.maximum_grant,
          b.maximum_grant,
          descending
        );

      case "deadline":
        return compareDeadlines(
          a.deadline,
          b.deadline,
          descending
        );

      case "anticipated_deadline":
        return compareAnticipatedDeadlines(
          a.anticipated_deadline,
          b.anticipated_deadline,
          descending
        );

      default:
        return 0;
    }
  };

  // --------------------------------------------------
  // Filtered Customers
  // --------------------------------------------------

 const filteredCustomers = useMemo(() => {
  const desiredStatus =
    mode === "favorites"
      ? favoriteView
      : "active";

  let result = customers.filter(
    (customer) =>
      String(customer.Category)
        .trim()
        .toLowerCase() === desiredStatus
  );

  if (mode === "favorites") {
    result = result.filter((customer) =>
      favoriteIds.has(String(customer.id))
    );
  }

  // --------------------------------------------------
  // SEARCH
  // Only runs after the user presses Enter.
  // Supports partial and close/fuzzy matches.
  // --------------------------------------------------

  if (search.trim()) {
    const searchTerm = search
      .trim()
      .toLowerCase();

    // Calculate how many character changes are
    // needed to turn one word into another.
    const levenshteinDistance = (
      a: string,
      b: string
    ) => {
      const matrix = Array.from(
        { length: b.length + 1 },
        (_, i) => [i]
      );

      for (
        let j = 0;
        j <= a.length;
        j++
      ) {
        matrix[0][j] = j;
      }

      for (
        let i = 1;
        i <= b.length;
        i++
      ) {
        for (
          let j = 1;
          j <= a.length;
          j++
        ) {
          if (
            b[i - 1] ===
            a[j - 1]
          ) {
            matrix[i][j] =
              matrix[i - 1][j - 1];
          } else {
            matrix[i][j] =
              Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
          }
        }
      }

      return matrix[b.length][
        a.length
      ];
    };

    // Determines whether a search term is an
    // exact, partial, or close spelling match.
    const fuzzyMatch = (
      text: string,
      term: string
    ) => {
      const normalizedText =
        text.toLowerCase();

      // Exact or partial match
      if (
        normalizedText.includes(
          term
        )
      ) {
        return true;
      }

      // Break the text into individual words
      // so "racoon" can match "raccoon".
      const words =
        normalizedText.split(
          /[\s,.;:!?()[\]{}"'\/\\|_-]+/
        );

      return words.some(
        (word) => {
          if (!word) {
            return false;
          }

          const distance =
            levenshteinDistance(
              term,
              word
            );

          // Allow a small number of spelling
          // differences based on word length.
          const allowedDistance =
            term.length <= 4
              ? 1
              : term.length <= 8
                ? 2
                : 3;

          return (
            distance <=
            allowedDistance
          );
        }
      );
    };

    result = result.filter(
      (customer) => {
        const searchableFields = [
          customer.grantor,
          customer.opportunity_name,
          customer.maximum_grant,
          customer.deadline,
          customer.anticipated_deadline,
          customer.website_link,
          customer.abstract,
          customer.additional_information,
          customer.limited_opportunity,
          customer.fellowship_opportunity,
          ...(customer.rfp_categories ??
            []),
        ];

        return searchableFields.some(
          (value) =>
            fuzzyMatch(
              String(value ?? ""),
              searchTerm
            )
        );
      }
    );
  }

  // --------------------------------------------------
  // QUICK FILTERS
  // --------------------------------------------------

  if (
    quickGrantors.length > 0
  ) {
    result = result.filter(
      (customer) =>
        customer.grantor &&
        quickGrantors.includes(
          customer.grantor
        )
    );
  }

  if (
    quickMaximumGrants.length >
    0
  ) {
    result = result.filter(
      (customer) =>
        quickMaximumGrants.some(
          (rangeLabel) =>
            matchesMaximumGrantRange(
              customer.maximum_grant,
              rangeLabel
            )
        )
    );
  }

  if (
    quickDeadline !== "all"
  ) {
    result = result.filter(
      (customer) =>
        matchesQuickDeadline(
          customer.deadline
        )
    );
  }

  if (
    quickMonths.length > 0
  ) {
    result = result.filter(
      (customer) =>
        customer.anticipated_deadline &&
        quickMonths.some(
          (month) =>
            month.toLowerCase() ===
            customer.anticipated_deadline?.toLowerCase()
        )
    );
  }

  if (
    quickCategories.length > 0
  ) {
    result = result.filter(
      (customer) =>
        Array.isArray(
          customer.rfp_categories
        ) &&
        quickCategories.some(
          (selectedCategory) =>
            customer.rfp_categories?.some(
              (category) =>
                category
                  .trim()
                  .toLowerCase() ===
                selectedCategory
                  .trim()
                  .toLowerCase()
            )
        )
    );
  }

  // --------------------------------------------------
  // ADVANCED FILTERS
  // --------------------------------------------------

  if (
    advancedFilters.length > 0
  ) {
    const activeRules =
      advancedFilters.filter(
        (filter) =>
          filter.values.length > 0
      );

    if (activeRules.length > 0) {
      result = result.filter(
        (customer) => {
          let matches =
            matchesAdvancedFilter(
              customer,
              activeRules[0]
            );

          for (
            let index = 1;
            index < activeRules.length;
            index++
          ) {
            const rule =
              activeRules[index];
            const ruleMatches =
              matchesAdvancedFilter(
                customer,
                rule
              );

            matches =
              rule.connector === "OR"
                ? matches || ruleMatches
                : matches && ruleMatches;
          }

          return matches;
        }
      );
    }
  }

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  result.sort((a, b) => {
    for (const rule of sortRules) {
      const comparison =
        compareBySortRule(
          a,
          b,
          rule
        );

      if (
        comparison !== 0
      ) {
        return comparison;
      }
    }

    return 0;
  });

  return result;
}, [
  customers,
  search,
  sortRules,
  quickGrantors,
  quickMaximumGrants,
  quickDeadline,
  quickMonths,
  quickCategories,
  advancedFilters,
  mode,
  favoriteView,
  favoriteIds,
]);

  // --------------------------------------------------
  // CSV Export
  // Exports the currently visible, filtered, and sorted rows.
  // --------------------------------------------------

  const exportOpportunitiesToCsv = () => {
    const escapeCsvValue = (value: unknown) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const getDeadlineExportStatus = (
      deadline: string | null | undefined
    ) => {
      if (!deadline) {
        return "No deadline set";
      }

      const deadlineDate = new Date(
        `${deadline}T00:00:00`
      );
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const daysUntil = Math.ceil(
        (deadlineDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysUntil < 0) {
        const daysAgo = Math.abs(daysUntil);

        return `${daysAgo} ${
          daysAgo === 1 ? "day" : "days"
        } past deadline`;
      }

      if (daysUntil === 0) {
        return "Deadline is today";
      }

      return `${daysUntil} ${
        daysUntil === 1 ? "day" : "days"
      } remaining`;
    };

    const headers = [
      "Grantor",
      "Opportunity",
      "Maximum Grant",
      "Deadline",
      "Anticipated Deadline Month",
      "Categories",
      "Website",
      "Deadline Countdown",
      "Abstract",
      "Contact Name",
      "Contact Email",
      "Contact Organization",
      "Additional Information",
      "Limited Opportunity",
      "Fellowship Opportunity",
    ];

    const rows = filteredCustomers.map(
      (customer) => {
        const customerWithContact = customer as Customer & {
          contact_name?: string | null;
          contact_email?: string | null;
          contact_organization?: string | null;
        };

        return [
          customer.grantor,
          customer.opportunity_name,
          customer.maximum_grant,
          customer.deadline,
          customer.anticipated_deadline,
          customer.rfp_categories?.join("; ") ?? "",
          customer.website_link,
          getDeadlineExportStatus(customer.deadline),
          customer.abstract,
          customerWithContact.contact_name,
          customerWithContact.contact_email,
          customerWithContact.contact_organization,
          customer.additional_information,
          customer.limited_opportunity,
          customer.fellowship_opportunity,
        ];
      }
    );

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(escapeCsvValue).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const date = new Date()
      .toISOString()
      .slice(0, 10);

    downloadLink.href = downloadUrl;
    downloadLink.download =
      mode === "favorites"
        ? `${favoriteView}-favorite-opportunities-${date}.csv`
        : `active-opportunities-${date}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  // --------------------------------------------------
  // Conditional Quick Filter Options
  // Each facet is calculated from the selections made
  // in every other Quick Filter section.
  // --------------------------------------------------

  type QuickFilterFacet =
    | "grantor"
    | "maximum_grant"
    | "deadline"
    | "anticipated_deadline"
    | "category";

  const getQuickFacetCustomers = (
    excludedFacet: QuickFilterFacet
  ) => {
    return customers.filter((customer) => {
      if (customer.Category !== "active") {
        return false;
      }

      if (
        excludedFacet !== "grantor" &&
        quickGrantors.length > 0 &&
        (!customer.grantor ||
          !quickGrantors.includes(
            customer.grantor
          ))
      ) {
        return false;
      }

      if (
        excludedFacet !==
          "maximum_grant" &&
        quickMaximumGrants.length > 0 &&
        !quickMaximumGrants.some(
          (rangeLabel) =>
            matchesMaximumGrantRange(
              customer.maximum_grant,
              rangeLabel
            )
        )
      ) {
        return false;
      }

      if (
        excludedFacet !== "deadline" &&
        quickDeadline !== "all" &&
        !matchesQuickDeadline(
          customer.deadline
        )
      ) {
        return false;
      }

      if (
        excludedFacet !==
          "anticipated_deadline" &&
        quickMonths.length > 0 &&
        (!customer.anticipated_deadline ||
          !quickMonths.some(
            (month) =>
              month.toLowerCase() ===
              customer.anticipated_deadline?.toLowerCase()
          ))
      ) {
        return false;
      }

      if (
        excludedFacet !== "category" &&
        quickCategories.length > 0 &&
        (!Array.isArray(
          customer.rfp_categories
        ) ||
          !quickCategories.some(
            (selectedCategory) =>
              customer.rfp_categories?.some(
                (category) =>
                  category
                    .trim()
                    .toLowerCase() ===
                  selectedCategory
                    .trim()
                    .toLowerCase()
              )
          ))
      ) {
        return false;
      }

      return true;
    });
  };

  const grantorFacetCustomers =
    getQuickFacetCustomers("grantor");
  const maximumGrantFacetCustomers =
    getQuickFacetCustomers(
      "maximum_grant"
    );
  const monthFacetCustomers =
    getQuickFacetCustomers(
      "anticipated_deadline"
    );
  const categoryFacetCustomers =
    getQuickFacetCustomers("category");

  const pinSelectedFirst = (
    values: string[],
    selectedValues: string[]
  ) =>
    [...values].sort((a, b) => {
      const aSelected =
        selectedValues.includes(a);
      const bSelected =
        selectedValues.includes(b);

      if (aSelected !== bSelected) {
        return aSelected ? -1 : 1;
      }

      return a.localeCompare(b);
    });

  const conditionalGrantors =
    pinSelectedFirst(
      availableGrantors,
      quickGrantors
    );

  const conditionalMaximumGrantRanges =
    pinSelectedFirst(
      availableMaximumGrants,
      quickMaximumGrants
    );

  const conditionalMonths =
    pinSelectedFirst(
      availableMonths,
      quickMonths
    );

  const conditionalCategories =
    pinSelectedFirst(
      availableCategories,
      quickCategories
    );

  const getGrantorFacetCount = (
    grantor: string
  ) =>
    grantorFacetCustomers.filter(
      (customer) =>
        customer.grantor === grantor
    ).length;

  const getMaximumGrantFacetCount = (
    rangeLabel: string
  ) =>
    maximumGrantFacetCustomers.filter(
      (customer) =>
        matchesMaximumGrantRange(
          customer.maximum_grant,
          rangeLabel
        )
    ).length;

  const getMonthFacetCount = (
    month: string
  ) =>
    monthFacetCustomers.filter(
      (customer) =>
        customer.anticipated_deadline?.toLowerCase() ===
        month.toLowerCase()
    ).length;

  const getCategoryFacetCount = (
    category: string
  ) =>
    categoryFacetCustomers.filter(
      (customer) =>
        customer.rfp_categories?.some(
          (customerCategory) =>
            customerCategory
              .trim()
              .toLowerCase() ===
            category.trim().toLowerCase()
        )
    ).length;

  // --------------------------------------------------
  // Sort Functions
  // --------------------------------------------------

  const addSortRule = () => {
    const usedFields =
      sortRules.map(
        (rule) => rule.field
      );

    const availableField =
      (
        Object.keys(
          SORT_FIELD_LABELS
        ) as SortField[]
      ).find(
        (field) =>
          !usedFields.includes(field)
      );

    if (!availableField) {
      return;
    }

    setSortRules((current) => [
      ...current,
      {
        id: nextSortId,
        field: availableField,
        direction:
          availableField ===
          "maximum_grant"
            ? "desc"
            : "asc",
      },
    ]);

    setNextSortId(
      (current) =>
        current + 1
    );
  };

  const updateSortRule = (
    id: number,
    updates: Partial<SortRule>
  ) => {
    setSortRules((current) =>
      current.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              ...updates,
            }
          : rule
      )
    );
  };

  const removeSortRule = (
    id: number
  ) => {
    setSortRules((current) =>
      current.filter(
        (rule) =>
          rule.id !== id
      )
    );
  };

  // --------------------------------------------------
  // Drag and Drop Sort Functions
  // --------------------------------------------------

  const handleSortDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: number
  ) => {
    setDraggedSortId(id);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(id)
    );
  };

  const handleSortDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    id: number
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    if (
      draggedSortId !== null &&
      draggedSortId !== id
    ) {
      setDragOverSortId(id);
    }
  };

  const handleSortDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: number
  ) => {
    event.preventDefault();

    const sourceId =
      draggedSortId;

    if (
      sourceId === null ||
      sourceId === targetId
    ) {
      setDraggedSortId(null);
      setDragOverSortId(null);
      return;
    }

    setSortRules((current) => {
      const sourceIndex =
        current.findIndex(
          (rule) =>
            rule.id === sourceId
        );

      const targetIndex =
        current.findIndex(
          (rule) =>
            rule.id === targetId
        );

      if (
        sourceIndex === -1 ||
        targetIndex === -1
      ) {
        return current;
      }

      const reordered = [
        ...current,
      ];

      const [
        movedRule,
      ] = reordered.splice(
        sourceIndex,
        1
      );

      reordered.splice(
        targetIndex,
        0,
        movedRule
      );

      return reordered;
    });

    setDraggedSortId(null);
    setDragOverSortId(null);
  };

  const handleSortDragEnd = () => {
    setDraggedSortId(null);
    setDragOverSortId(null);
  };

  const resetSortRules = () => {
    setSortRules([
      {
        id: 1,
        field: "deadline",
        direction: "asc",
      },
      {
        id: 2,
        field: "anticipated_deadline",
        direction: "asc",
      },
      {
        id: 3,
        field: "maximum_grant",
        direction: "desc",
      },
    ]);

    setNextSortId(4);
  };

  const getSortDirectionLabel = (
    field: SortField,
    direction: SortDirection
  ) => {
    if (
      field === "grantor"
    ) {
      return direction === "asc"
        ? "A-Z"
        : "Z-A";
    }

    if (
      field === "maximum_grant"
    ) {
      return direction === "desc"
        ? "Highest to lowest"
        : "Lowest to highest";
    }

    return direction === "asc"
      ? "Earliest to latest"
      : "Latest to earliest";
  };

  // --------------------------------------------------
  // Deadline Styling
  // --------------------------------------------------

  const getDeadlineStyle = (
    deadline: string | null
  ) => {
    if (!deadline) {
      return {
        container:
          "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    const daysUntil =
      getDeadlineDays(deadline);

    if (
      daysUntil === null
    ) {
      return {
        container:
          "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    if (
      daysUntil < 0
    ) {
      return {
        container:
          "bg-slate-100 text-slate-600 border-slate-300",
      };
    }

    if (
      daysUntil === 0
    ) {
      return {
        container:
          "bg-red-100 text-red-800 border-red-300",
      };
    }

    if (
      daysUntil <= 30
    ) {
      return {
        container:
          "bg-amber-100 text-amber-800 border-amber-300",
      };
    }

    return {
      container:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  // --------------------------------------------------
  // Anticipated Deadline Month Colors
  // --------------------------------------------------

  const getMonthStyle = (
    month: string
  ) => {
    const normalizedMonth =
      month
        .trim()
        .toLowerCase();

    const monthColors: Record<
      string,
      string
    > = {
      january:
        "border-[#8EAEDF] bg-[#AFCBFF] text-[#171719]",
      february:
        "border-[#A797D2] bg-[#C7B8EA] text-[#171719]",
      march:
        "border-[#7CB8A7] bg-[#9FD4C5] text-[#171719]",
      april:
        "border-[#D5A632] bg-[#F2C14E] text-[#171719]",
      may:
        "border-[#D994B3] bg-[#F3B6D2] text-[#171719]",
      june:
        "border-[#8FAAB1] bg-[#AFC6CC] text-[#171719]",
      july:
        "border-[#C29F64] bg-[#E2C28D] text-[#171719]",
      august:
        "border-[#95A4CE] bg-[#B8C4E6] text-[#171719]",
      september:
        "border-[#A7BB70] bg-[#C8D992] text-[#171719]",
      october:
        "border-[#D58A55] bg-[#F0A76E] text-[#171719]",
      november:
        "border-[#9EA4A8] bg-[#BCC1C4] text-[#171719]",
      december:
        "border-[#BD9181] bg-[#D9B5A7] text-[#171719]",
      rolling:
        "border-[#73797D] bg-[#949A9E] text-[#111214]",
    };

    return (
      monthColors[
        normalizedMonth
      ] ||
      "border-[#9EA4A8] bg-[#BCC1C4] text-[#171719]"
    );
  };

  // --------------------------------------------------
  // Advanced Filter Functions
  // --------------------------------------------------

  const addAdvancedFilter = () => {
    clearQuickFilters();

    setAdvancedFilters(
      (current) => [
        ...current,
        {
          id: nextFilterId,
          connector: "AND",
          field: "category",
          operator: "is",
          values: [],
        },
      ]
    );

    setNextFilterId(
      (current) =>
        current + 1
    );
  };

  const updateAdvancedFilter = (
    id: number,
    updates: Partial<AdvancedFilter>
  ) => {
    setAdvancedFilters(
      (current) =>
        current.map(
          (filter) =>
            filter.id === id
              ? {
                  ...filter,
                  ...updates,
                }
              : filter
        )
    );
  };

  const removeAdvancedFilter = (
    id: number
  ) => {
    setAdvancedFilters(
      (current) =>
        current.filter(
          (filter) =>
            filter.id !== id
        )
    );

    setOpenAdvancedDropdownId(
      null
    );
  };

  const removeAdvancedFilterValue = (
    filterId: number,
    value: string
  ) => {
    setAdvancedFilters(
      (current) =>
        current.map(
          (filter) =>
            filter.id === filterId
              ? {
                  ...filter,
                  values:
                    filter.values.filter(
                      (item) =>
                        item !== value
                    ),
                }
              : filter
        )
    );
  };

  // --------------------------------------------------
  // Quick Filter Activation
  // --------------------------------------------------

  const activateQuickFilter = (
    callback: () => void
  ) => {
    if (
      advancedFilters.length > 0
    ) {
      clearAdvancedFilters();
    }

    callback();
  };

  const addMonthQuickFilter = (
    month: string
  ) => {
    activateQuickFilter(() => {
      setQuickMonths((current) =>
        current.includes(month)
          ? current
          : [...current, month]
      );
      setShowQuickFilters(true);
    });
  };

  const addCategoryQuickFilter = (
    category: string
  ) => {
    activateQuickFilter(() => {
      setQuickCategories((current) =>
        current.includes(category)
          ? current
          : [...current, category]
      );
      setShowQuickFilters(true);
    });
  };

  // --------------------------------------------------
  // Filter Panel Toggle Functions
  // --------------------------------------------------

  const toggleQuickFilters = () => {
    setShowAdvancedFilters(false);
    setOpenAdvancedDropdownId(null);
    setShowSortOptions(false);

    setShowQuickFilters(
      (current) => !current
    );
  };

  const toggleAdvancedFilters = () => {
    setShowQuickFilters(false);
    setShowSortOptions(false);

    setShowAdvancedFilters(
      (current) => !current
    );
  };

  // --------------------------------------------------
  // Clear All Filters
  // --------------------------------------------------

  const clearAllFilters = () => {
    clearQuickFilters();
    clearAdvancedFilters();
  };

  // --------------------------------------------------
  // Active Filter Counts
  // --------------------------------------------------

  const activeQuickFilterCount =
    quickGrantors.length +
    quickMaximumGrants.length +
    (quickDeadline !== "all"
      ? 1
      : 0) +
    quickMonths.length +
    quickCategories.length;

  const activeAdvancedFilterCount =
    advancedFilters.filter(
      (filter) =>
        filter.values.length > 0
    ).length;

  const totalActiveFilterCount =
    activeQuickFilterCount +
    activeAdvancedFilterCount;

  // --------------------------------------------------
  // Advanced Filter Options
  // --------------------------------------------------

  const getAdvancedFilterOptions = (
    field: FilterField
  ): string[] => {
    switch (field) {
      case "grantor":
        return availableGrantors;

      case "maximum_grant":
        return availableMaximumGrants;

      case "deadline":
        return availableDeadlines;

      case "anticipated_deadline":
        return availableMonths;

      case "category":
        return availableCategories;

      case "limited_opportunity":
        return availableLimitedOpportunities;

      case "fellowship_opportunity":
        return availableFellowshipOpportunities;

      default:
        return [];
    }
  };

  const formatDeadline = (
    deadline: string
  ) => {
    if (!deadline) {
      return "No specific deadline";
    }

    return new Date(
      `${deadline}T00:00:00`
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // --------------------------------------------------
  // Advanced Filter Dropdown Helper
  // --------------------------------------------------

  const getFieldLabel = (
    field: FilterField
  ) => {
    switch (field) {
      case "grantor":
        return "Grantor";

      case "maximum_grant":
        return "Maximum Grant";

      case "deadline":
        return "Deadline";

      case "anticipated_deadline":
        return "Anticipated Deadline";

      case "category":
        return "Categories";

      case "limited_opportunity":
        return "Limited Opportunity";

      case "fellowship_opportunity":
        return "Fellowship Opportunity";

      default:
        return "";
    }
  };

  // --------------------------------------------------
  // Funding Timeline
  // --------------------------------------------------

  const [calendarMonth, setCalendarMonth] = useState(
    () => {
      const today = new Date();
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    }
  );

  const deadlineCustomers = useMemo(
    () =>
      filteredCustomers
        .filter(
          (customer) =>
            Boolean(customer.deadline) &&
            !Number.isNaN(
              new Date(
                `${customer.deadline}T00:00:00`
              ).getTime()
            )
        )
        .sort(
          (first, second) =>
            new Date(
              `${first.deadline}T00:00:00`
            ).getTime() -
            new Date(
              `${second.deadline}T00:00:00`
            ).getTime()
        ),
    [filteredCustomers]
  );

  const deadlinesByDate = useMemo(() => {
    const grouped = new Map<string, Customer[]>();

    deadlineCustomers.forEach((customer) => {
      if (!customer.deadline) {
        return;
      }

      const existing =
        grouped.get(customer.deadline) ?? [];

      grouped.set(customer.deadline, [
        ...existing,
        customer,
      ]);
    });

    return grouped;
  }, [deadlineCustomers]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return deadlineCustomers
      .filter(
        (customer) =>
          new Date(
            `${customer.deadline}T00:00:00`
          ) >= today
      )
      .slice(0, 5);
  }, [deadlineCustomers]);

  const getDeadlineAccent = (
    customerId: Customer["id"]
  ) => {
    const displayedIndex =
      upcomingDeadlines.findIndex(
        (customer) =>
          String(customer.id) ===
          String(customerId)
      );

    if (displayedIndex >= 0) {
      return DEADLINE_ACCENTS[
        displayedIndex %
          DEADLINE_ACCENTS.length
      ];
    }

    return "#1F2024";
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(
      year,
      month,
      1
    ).getDay();
    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    return [
      ...Array.from(
        { length: firstWeekday },
        () => null
      ),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
      ),
    ];
  }, [calendarMonth]);

  const getCalendarDateKey = (day: number) =>
    [
      calendarMonth.getFullYear(),
      String(
        calendarMonth.getMonth() + 1
      ).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

  const moveCalendarMonth = (amount: number) => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1
        )
    );
  };

   // --------------------------------------------------
// Render
// --------------------------------------------------

return (
  <div className="min-h-screen bg-[#D4D5D6] text-[#2F3038]">
    <div className="mx-auto flex min-h-screen max-w-[1920px]">

      <AppSidebar
        activePath={
          mode === "favorites"
            ? "/favorites"
            : "/"
        }
      />

      <main className="min-w-0 flex-1 py-4 sm:py-6">
        <div className="mx-auto max-w-[1680px] px-3 sm:px-5 lg:px-6">

          <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/75 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                LG
              </span>
              <span className="font-bold">LG Listings</span>
            </div>
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-[#C8CBCC] bg-white px-3 py-2 text-[#565E64]"
            >
              ☰
            </button>
          </div>

      {/* ==================================================
          HEADER / SEARCH / FILTER AREA
      ================================================== */}

      <div className="relative overflow-visible rounded-[28px]">

        {/* ==================================================
            SOFT MULTI-STOP GRADIENT BACKGROUND
        ================================================== */}

        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#2F3038] via-[#3E454B] via-[35%] via-[#66717A] via-[55%] via-[#7A858E] via-[75%] to-[#C2A05A]" />

        {/* ==================================================
            LARGE SOFT BLEND OVERLAY
        ================================================== */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">

          <div className="absolute inset-y-0 left-[18%] w-[64%] bg-gradient-to-r from-[#3E454B]/20 via-[#6B8797]/30 to-[#C2A05A]/10 blur-[55px]" />

        </div>

        {/* ==================================================
            DUSTY BLUE SOFTENING
        ================================================== */}

        <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] overflow-hidden rounded-r-[28px]">

          <div className="absolute inset-0 bg-gradient-to-l from-[#C2A05A]/20 via-[#9FB9C9]/10 to-transparent blur-[35px]" />

        </div>

        {/* ==================================================
            LOGO BLEND AREA
            Softly integrates logo into gradient.
            No box / no backdrop blur / no hard edge.
        ================================================== */}

    {/* ==================================================
            LOGO
            Soft blended placement with no hard container edge
      ================================================== */}

          {/* ==================================================
                  LOGO
                  Soft color wash behind logo — no harsh edge
              ================================================== */}

              <div className="pointer-events-none absolute right-0 top-0 hidden h-[220px] w-[52%] overflow-hidden rounded-r-[28px] sm:block">

                {/* Soft color wash behind logo */}
                <div className="absolute inset-0 bg-gradient-to-l from-[#B8CBD5]/35 via-[#8FAEBD]/15 to-transparent blur-[18px]" />

                {/* Additional soft glow to blend the logo into the background */}
                <div className="absolute right-[-5%] top-1/2 h-[180px] w-[75%] -translate-y-1/2 rounded-full bg-[#E1DFDE]/10 blur-[45px]" />

                {/* Logo */}
                <img
                  src="/lg-listings-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute right-8 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-[0.20] mix-blend-multiply blur-[0.15px] xl:right-16 xl:h-36"
                />

              </div>
        {/* ==================================================
            BRANDING AREA
        ================================================== */}

        <div className="relative px-6 pb-7 pt-7 sm:px-8 sm:pt-8 lg:px-10 lg:pt-9">

          <div className="flex flex-col gap-7">

            {/* ==================================================
                TITLE / DESCRIPTION
            ================================================== */}

            <div className="min-w-0 pr-0 sm:pr-52">

              <div className="max-w-3xl">

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E1DFDE]">
                  {mode === "favorites"
                    ? "Your Funding Workspace"
                    : "Private Grant Funding"}
                </p>

                <h1 className="text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl lg:text-[2.65rem]">
                  {mode === "favorites"
                    ? "Favorite Opportunities"
                    : "Active RFP Opportunities"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E9E9E7] sm:text-base">
                  {mode === "favorites"
                    ? "Review saved opportunities, organize upcoming deadlines, and keep your funding priorities in one focused workspace."
                    : "Explore current funding opportunities and discover grants that align with your research, programs, and academic priorities."}
                </p>

              </div>

            </div>

          </div>

          {/* ==================================================
              ACCENT LINE
          ================================================== */}

          <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-[#E1DFDE]/60 to-transparent" />

        </div>


      </div>

      {/* ==================================================
          MATCHING BACKGROUND SPACE
          Keeps the transition between header and table
          the same color as the page background.
      ================================================== */}

      <div className="h-6 bg-[#D4D5D6] sm:h-8" />

      {mode === "favorites" && (
        <section className="mb-7 flex flex-col gap-4 rounded-[24px] border border-[#C8CBCC] bg-[#E9E9E7] p-5 shadow-[0_10px_28px_rgba(47,48,56,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
              Saved opportunity status
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#2F3038]">
              Choose your favorites view
            </h2>
          </div>

          <div className="inline-flex w-full rounded-2xl border border-[#C8CBCC] bg-white p-1.5 sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setFavoriteView("active")
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                favoriteView === "active"
                  ? "bg-[#2F3038] text-white shadow-sm"
                  : "text-[#626A70] hover:bg-[#F4F3F1] hover:text-[#2F3038]"
              }`}
            >
              Active
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                favoriteView === "active"
                  ? "bg-white/15 text-white"
                  : "bg-[#E2E3E3] text-[#626A70]"
              }`}>
                {favoriteActiveCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFavoriteView("archived")
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                favoriteView === "archived"
                  ? "bg-[#2F3038] text-white shadow-sm"
                  : "text-[#626A70] hover:bg-[#F4F3F1] hover:text-[#2F3038]"
              }`}
            >
              Archived
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                favoriteView === "archived"
                  ? "bg-white/15 text-white"
                  : "bg-[#E2E3E3] text-[#626A70]"
              }`}>
                {favoriteArchivedCount}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* ==================================================
          FUNDING TIMELINE
      ================================================== */}

      <section className="mb-7">
        <div className="mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7B8791]">
              Planning workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-[#2F3038]">
              {mode === "favorites"
                ? "Your Saved Funding Timeline"
                : "Your Funding Timeline"}
            </h2>
            <p className="mt-2 overflow-x-auto whitespace-nowrap pb-1 text-sm leading-6 text-[#626A70]">
              The calendar highlights the next five deadlines—select a colored date or its matching opportunity to open the full record.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.85fr)_minmax(520px,1.35fr)]">
          {/* Calendar */}
          <div className="group relative overflow-hidden rounded-[26px] border border-[#C8CBCC] bg-white p-5 shadow-[0_14px_36px_rgba(63,91,108,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(63,91,108,0.12)] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#E5D4CB]/70 blur-3xl transition duration-500 group-hover:scale-110" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7B8791]">
                  Deadline calendar
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                  {calendarMonth.toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveCalendarMonth(-1)}
                  aria-label="Previous month"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8CBCC] bg-[#F4F3F1] text-[#565E64] transition hover:-translate-x-0.5 hover:border-[#C2A05A] hover:bg-white hover:text-[#2F3038]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveCalendarMonth(1)}
                  aria-label="Next month"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8CBCC] bg-[#F4F3F1] text-[#565E64] transition hover:translate-x-0.5 hover:border-[#C2A05A] hover:bg-white hover:text-[#2F3038]"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-7 gap-1 text-center">
              {[
                "S",
                "M",
                "T",
                "W",
                "T",
                "F",
                "S",
              ].map((weekday, index) => (
                <div
                  key={`${weekday}-${index}`}
                  className="pb-2 text-[10px] font-bold uppercase tracking-widest text-[#747E85]"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div
              className="relative grid grid-cols-7 gap-1 text-center"
              style={{
                gridTemplateRows: `repeat(${Math.ceil(
                  calendarDays.length / 7
                )}, minmax(0, 1fr))`,
              }}
            >
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square"
                    />
                  );
                }

                const dateKey =
                  getCalendarDateKey(day);
                const dayOpportunities =
                  deadlinesByDate.get(dateKey) ?? [];
                const hasDeadline =
                  dayOpportunities.length > 0;
                const today = new Date();
                const isToday =
                  today.getFullYear() ===
                    calendarMonth.getFullYear() &&
                  today.getMonth() ===
                    calendarMonth.getMonth() &&
                  today.getDate() === day;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={!hasDeadline}
                    title={
                      hasDeadline
                        ? `${dayOpportunities.length} ${
                            dayOpportunities.length === 1
                              ? "opportunity"
                              : "opportunities"
                          }`
                        : undefined
                    }
                    onClick={() =>
                      setSelectedCustomerId(
                        String(
                          dayOpportunities[0].id
                        )
                      )
                    }
                    className={`group/day relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-sm font-semibold transition duration-200 ${
                      hasDeadline
                        ? "cursor-pointer bg-[#E5E4E1] text-[#2F3038] hover:-translate-y-0.5 hover:bg-[#D8CDC8] hover:shadow-md"
                        : "cursor-default text-[#626A70]"
                    } ${
                      isToday
                        ? "bg-white ring-2 ring-[#2F3038] ring-offset-2 ring-offset-white"
                        : ""
                    }`}
                  >
                    <span
                      className={
                        isToday
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#2F3038] font-bold text-white shadow-sm"
                          : ""
                      }
                    >
                      {day}
                    </span>
                    {hasDeadline && (
                      <span className="absolute bottom-1.5 flex gap-0.5">
                        {dayOpportunities
                          .slice(0, 3)
                          .map((opportunity) => (
                          <span
                            key={opportunity.id}
                            className="h-1.5 w-1.5 rounded-full ring-1 ring-white/80"
                            style={{
                              backgroundColor:
                                getDeadlineAccent(
                                  opportunity.id
                                ),
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative mt-4 flex items-center justify-between border-t border-[#D7D9DA] pt-4 text-xs text-[#626A70]">
              <span className="flex items-center gap-2">
                <span className="flex -space-x-1">
                  {upcomingDeadlines
                    .slice(0, 5)
                    .map((customer) => (
                    <span
                      key={customer.id}
                      className="h-2.5 w-2.5 rounded-full border border-white"
                      style={{
                        backgroundColor:
                          getDeadlineAccent(
                            customer.id
                          ),
                      }}
                    />
                  ))}
                </span>
                Colored dots match the next five opportunities; later deadlines appear in black
              </span>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setCalendarMonth(
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    )
                  );
                }}
                className="font-semibold text-[#444B51] transition hover:text-[#2F3038]"
              >
                Return to today
              </button>
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="relative overflow-hidden rounded-[26px] bg-[#2F3038] p-5 text-white shadow-[0_16px_40px_rgba(38,59,73,0.16)] sm:p-6">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[42px] border-[#C2A05A]/10" />
            <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full border border-white/10" />

            <div className="relative flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4D9DC]">
                  What&apos;s next
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  Next Five Opportunities
                </h3>
                <p className="mt-1 text-xs text-[#D4D9DC]">
                  Your nearest active deadlines, matched to the calendar
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#E9E9E7]">
                {upcomingDeadlines.length} shown
              </span>
            </div>

            <div className="relative mt-5 space-y-2">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(
                  (customer, index) => {
                    const deadline = new Date(
                      `${customer.deadline}T00:00:00`
                    );

                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() =>
                          setSelectedCustomerId(
                            String(customer.id)
                          )
                        }
                        className="group/deadline flex w-full items-center gap-4 rounded-2xl border border-l-[5px] border-white/10 bg-white/[0.07] px-4 py-3.5 text-left transition duration-200 hover:translate-x-1 hover:border-white/20 hover:bg-white/[0.13]"
                        style={{
                          borderLeftColor:
                            getDeadlineAccent(
                              customer.id
                            ),
                        }}
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-[0_7px_18px_rgba(0,0,0,0.18)]"
                          style={{
                            backgroundColor:
                              getDeadlineAccent(
                                customer.id
                              ),
                          }}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {deadline.toLocaleDateString(
                              "en-US",
                              { month: "short" }
                            )}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {deadline.getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-bold text-white">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  getDeadlineAccent(
                                    customer.id
                                  ),
                              }}
                            />
                            {customer.grantor ||
                              "Grantor not specified"}
                          </p>
                          <p className="mt-1 truncate text-base font-semibold leading-5 text-[#D4D9DC]">
                            {customer.opportunity_name ||
                              "Untitled opportunity"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {index === 0 && (
                            <span className="hidden rounded-full bg-[#F1D889] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4D4423] sm:inline-flex">
                              Next
                            </span>
                          )}
                          <span className="translate-x-1 text-xl text-[#D4D9DC] opacity-50 transition group-hover/deadline:translate-x-0 group-hover/deadline:opacity-100">
                            →
                          </span>
                        </div>
                      </button>
                    );
                  }
                )
              ) : (
                <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-6 text-center">
                  <div>
                    <p className="font-semibold text-white">
                      No upcoming deadlines
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#D4D9DC]">
                      Try adjusting your search or filters to reveal more opportunities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

        {/* ==================================================
            SEARCH + FILTER TOOLBAR
        ================================================== */}

        <div className="sticky top-0 z-30 isolate mb-8 overflow-visible rounded-[26px] border border-white/15 bg-black/85 px-5 py-5 shadow-[0_18px_42px_rgba(18,19,22,0.34)] backdrop-blur-xl sm:px-7">

          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#D45D3B]/20 blur-3xl" />

          <div className="relative mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">
              Search and refine
            </p>
            <div className="mt-1">
              <h2 className="text-xl font-bold text-white">
                Find the right opportunity
              </h2>
            </div>
          </div>

          <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center">

            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="relative flex-1">

              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7B8791]">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                  />

                </svg>

              </div>

              <input
                type="text"
                placeholder="Search grants, organizations, categories, key words..."
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput.trim());
                  }
                }}
                className="w-full rounded-2xl border border-[#D8C3B9] bg-white py-3.5 pl-11 pr-12 text-sm text-[#334B59] shadow-[0_5px_18px_rgba(63,91,108,0.07)] outline-none transition placeholder:text-[#778189] focus:border-[#7E9FB5] focus:ring-4 focus:ring-[#AF915A]/30"
              />

              {searchInput.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#778189] transition hover:text-[#4B5359]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDF2F5] text-sm font-bold leading-none transition hover:bg-[#DDE8EE]">
                  ×
                </span>
              </button>
            )}

            </div>

            {/* ==================================================
                FILTER BUTTONS
            ================================================== */}

            <div className="flex flex-col gap-2 sm:flex-row">

              <button
                ref={quickFilterButtonRef}
                type="button"
                onClick={toggleQuickFilters}
                className={`relative inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                  showQuickFilters
                    ? "border-[#8D7070] bg-white text-[#2F3038] shadow-sm"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }`}
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.287.74 7.484 2.03.336.197.516.579.444.961l-.79 4.16a2 2 0 0 1-.89 1.29l-3.118 1.87a2 2 0 0 0-.94 1.52l-.33 3.303a2 2 0 0 1-1.99 1.8h-1.74a2 2 0 0 1-1.99-1.8l-.33-3.303a2 2 0 0 0-.94-1.52l-3.118-1.87a2 2 0 0 1-.89-1.29l-.79-4.16a1 1 0 0 1 .444-.961A14.97 14.97 0 0 1 12 3Z"
                  />

                </svg>

                Quick Filter

                {activeQuickFilterCount > 0 && (

                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B7655E] px-1.5 text-xs text-white">
                    {activeQuickFilterCount}
                  </span>

                )}

              </button>

              <button
                ref={advancedFilterButtonRef}
                type="button"
                onClick={toggleAdvancedFilters}
                className={`relative inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                  showAdvancedFilters
                    ? "border-[#8D7070] bg-white text-[#2F3038] shadow-sm"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }`}
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 13.5V4.5m0 9a2.25 2.25 0 1 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0-4.5m6-4.5v9m0-9a2.25 2.25 0 1 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5m6-9v9m0-9a2.25 2.25 0 1 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5m0 9v-9m0 9a2.25 2.25 0 1 0 0-4.5m0 4.5a2.25 2.25 0 0 1 0-4.5"
                  />

                </svg>

                Advanced

                {activeAdvancedFilterCount > 0 && (

                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B7655E] px-1.5 text-xs text-white">
                    {activeAdvancedFilterCount}
                  </span>

                )}

              </button>

            </div>

            {/* ==================================================
                SORT
            ================================================== */}

            <div
              ref={sortDropdownRef}
              className="relative"
            >

              <button
                type="button"
                onClick={() => {
                  setShowQuickFilters(false);
                  setShowAdvancedFilters(false);
                  setShowSortOptions(
                    (current) =>
                      !current
                  );
                }}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-white/20 xl:min-w-[210px]"
              >

                <span>
                  Sort by
                </span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`h-4 w-4 transition-transform ${
                    showSortOptions
                      ? "rotate-180"
                      : ""
                  }`}
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />

                </svg>

              </button>

              {showSortOptions && (

                <div className="absolute right-0 top-full z-[9999] mt-2 w-[420px] max-w-[90vw] rounded-2xl border border-[#DDCEC7] bg-white p-4 shadow-[0_20px_50px_rgba(42,64,76,0.18)]">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <h3 className="text-sm font-semibold text-[#2F3038]">
                        Sort by
                      </h3>

                      <p className="mt-1 text-xs text-[#69747C]">
                        Drag and drop to change sort priority.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={resetSortRules}
                      className="text-xs font-semibold text-[#7B8791] underline underline-offset-2 hover:text-[#456A82]"
                    >
                      Reset
                    </button>

                  </div>

                  <div className="space-y-2">

                    {sortRules.map(
                      (
                        rule,
                        index
                      ) => (

                        <div
                          key={rule.id}
                          draggable
                          onDragStart={(event) =>
                            handleSortDragStart(
                              event,
                              rule.id
                            )
                          }
                          onDragOver={(event) =>
                            handleSortDragOver(
                              event,
                              rule.id
                            )
                          }
                          onDrop={(event) =>
                            handleSortDrop(
                              event,
                              rule.id
                            )
                          }
                          onDragEnd={
                            handleSortDragEnd
                          }
                          className={`rounded-xl border p-3 transition-all ${
                            draggedSortId ===
                            rule.id
                              ? "border-[#B7655E] bg-[#E7F0F5] opacity-50"
                              : dragOverSortId ===
                                rule.id
                              ? "border-[#B7655E] bg-[#F2F7FA] shadow-md"
                              : "border-[#E0E8ED] bg-[#F4F3F1]"
                          }`}
                        >

                          <div className="mb-2 flex items-center justify-between">

                            <div className="flex items-center gap-2">

                              <span
                                className="cursor-grab text-[#747E85] active:cursor-grabbing"
                                title="Drag to reorder"
                              >

                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                >

                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 6.75h.008v.008H8.25V6.75Zm0 5.25h.008v.008H8.25V12Zm0 5.25h.008v.008H8.25V17.25Zm7.5-10.5h.008v.008h-.008V6.75Zm0 5.25h.008v.008h-.008V12Zm0 5.25h.008v.008h-.008V17.25Z"
                                  />

                                </svg>

                              </span>

                              <span className="text-xs font-semibold uppercase tracking-wide text-[#69747C]">
                                Sort level{" "}
                                {index + 1}
                              </span>

                            </div>

                            {sortRules.length > 1 && (

                              <button
                                type="button"
                                onClick={() =>
                                  removeSortRule(
                                    rule.id
                                  )
                                }
                                className="text-xs font-semibold text-[#69747C] hover:text-red-600"
                              >
                                Remove
                              </button>

                            )}

                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                            <select
                              value={rule.field}
                              onChange={(e) =>
                                updateSortRule(
                                  rule.id,
                                  {
                                    field:
                                      e.target
                                        .value as SortField,
                                  }
                                )
                              }
                              className="rounded-lg border border-[#DFE0E0] bg-white px-3 py-2 text-sm text-[#394147] outline-none focus:border-[#B7655E]"
                            >

                              {(
                                Object.keys(
                                  SORT_FIELD_LABELS
                                ) as SortField[]
                              ).map(
                                (
                                  field
                                ) => {

                                  const usedByAnotherRule =
                                    sortRules.some(
                                      (
                                        otherRule
                                      ) =>
                                        otherRule.id !==
                                          rule.id &&
                                        otherRule.field ===
                                          field
                                    );

                                  return (

                                    <option
                                      key={field}
                                      value={field}
                                      disabled={
                                        usedByAnotherRule
                                      }
                                    >
                                      {
                                        SORT_FIELD_LABELS[
                                          field
                                        ]
                                      }
                                    </option>

                                  );

                                }
                              )}

                            </select>

                            <select
                              value={
                                rule.direction
                              }
                              onChange={(e) =>
                                updateSortRule(
                                  rule.id,
                                  {
                                    direction:
                                      e.target
                                        .value as SortDirection,
                                  }
                                )
                              }
                              className="rounded-lg border border-[#DFE0E0] bg-white px-3 py-2 text-sm text-[#394147] outline-none focus:border-[#B7655E]"
                            >

                              <option value="asc">
                                {getSortDirectionLabel(
                                  rule.field,
                                  "asc"
                                )}
                              </option>

                              <option value="desc">
                                {getSortDirectionLabel(
                                  rule.field,
                                  "desc"
                                )}
                              </option>

                            </select>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                  {sortRules.length < 4 && (

                    <button
                      type="button"
                      onClick={addSortRule}
                      className="mt-4 w-full rounded-xl border border-dashed border-[#D6CBC6] bg-[#F2F7FA] px-4 py-2.5 text-sm font-semibold text-[#7B8791] transition hover:bg-[#E7F0F5]"
                    >
                      + Add Sort Level
                    </button>

                  )}

                </div>

              )}

            </div>

            <button
              type="button"
              onClick={exportOpportunitiesToCsv}
              disabled={filteredCustomers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white px-5 py-3 text-sm font-semibold text-[#2F3038] shadow-sm transition hover:bg-[#F3EDE9] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5.25 18.75h13.5"
                />
              </svg>
              Export CSV
            </button>

          </div>

          {/* ==================================================
              QUICK FILTER PANEL
          ================================================== */}

          {showQuickFilters && (

            <div
              ref={quickFilterPopoverRef}
              className="absolute left-4 right-4 top-full z-[150] mt-3 max-h-[82vh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-6 shadow-[0_24px_60px_rgba(18,19,22,0.30)] sm:left-6 sm:right-6"
            >

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h3 className="text-base font-semibold text-[#2F3038]">
                    Quick Filters
                  </h3>

                  <p className="mt-1 text-sm text-[#626A70]">
                    Options update from your other selections. Choices within a section use OR; sections combine with AND.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={clearQuickFilters}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-[#647781] transition hover:bg-[#E2E3E3] hover:text-[#2F3038]"
                >
                  Clear Filters
                </button>

              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-5">

                {/* Grantor */}

                <div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#626A70]">
                      Grantor
                    </label>
                    {quickGrantors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuickGrantors([])}
                        className="text-[10px] font-bold uppercase tracking-wide text-[#778189] hover:text-[#2F3038]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#E2E3E3] bg-white p-3">

                    {conditionalGrantors.map(
                      (grantor) => {
                        const count =
                          getGrantorFacetCount(
                            grantor
                          );
                        const selected =
                          quickGrantors.includes(
                            grantor
                          );
                        const disabled =
                          count === 0 &&
                          !selected;

                        return (

                        <label
                          key={grantor}
                          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                            disabled
                              ? "cursor-not-allowed text-[#A0A5A9] opacity-55"
                              : "cursor-pointer text-[#394147] hover:bg-[#F6EFEA]"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={disabled}
                            onChange={() =>
                              activateQuickFilter(
                                () =>
                                  toggleArrayValue(
                                    grantor,
                                    quickGrantors,
                                    setQuickGrantors
                                  )
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-[#B7655E]"
                          />

                          <span className="min-w-0 flex-1 truncate">
                            {grantor}
                          </span>

                          <span className="rounded-full bg-[#ECEDEE] px-2 py-0.5 text-[10px] font-bold text-[#626A70]">
                            {count}
                          </span>

                        </label>

                        );
                      }
                    )}

                  </div>

                </div>

                {/* Maximum Grant */}

                <div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#626A70]">
                      Maximum Grant
                    </label>
                    {quickMaximumGrants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuickMaximumGrants([])}
                        className="text-[10px] font-bold uppercase tracking-wide text-[#778189] hover:text-[#2F3038]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#E2E3E3] bg-white p-3">

                    {conditionalMaximumGrantRanges.map(
                      (amount) => {
                        const count =
                          getMaximumGrantFacetCount(
                            amount
                          );
                        const selected =
                          quickMaximumGrants.includes(
                            amount
                          );
                        const disabled =
                          count === 0 &&
                          !selected;

                        return (

                        <label
                          key={amount}
                          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                            disabled
                              ? "cursor-not-allowed text-[#A0A5A9] opacity-55"
                              : "cursor-pointer text-[#394147] hover:bg-[#F6EFEA]"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={disabled}
                            onChange={() =>
                              activateQuickFilter(
                                () =>
                                  toggleArrayValue(
                                    amount,
                                    quickMaximumGrants,
                                    setQuickMaximumGrants
                                  )
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-[#B7655E]"
                          />

                          <span className="min-w-0 flex-1 truncate">
                            {amount}
                          </span>

                          <span className="rounded-full bg-[#ECEDEE] px-2 py-0.5 text-[10px] font-bold text-[#626A70]">
                            {count}
                          </span>

                        </label>

                        );
                      }
                    )}

                  </div>

                </div>

                {/* Deadline */}

                <div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#626A70]">
                      Application Deadline
                    </label>
                    {quickDeadline !== "all" && (
                      <button
                        type="button"
                        onClick={() => setQuickDeadline("all")}
                        className="text-[10px] font-bold uppercase tracking-wide text-[#778189] hover:text-[#2F3038]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <select
                    value={quickDeadline}
                    onChange={(e) =>
                      activateQuickFilter(
                        () =>
                          setQuickDeadline(
                            e.target.value
                          )
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-[#E2E3E3] bg-white px-4 py-3 text-sm text-[#394147] outline-none focus:border-[#B7655E] focus:ring-4 focus:ring-[#AF915A]/30"
                  >

                    <option value="all">
                      All Deadlines
                    </option>

                    <option value="30">
                      Due within 30 days
                    </option>

                    <option value="60">
                      Due within 60 days
                    </option>

                    <option value="90">
                      Due within 90 days
                    </option>

                    <option value="no-deadline">
                      No specific deadline
                    </option>

                  </select>

                </div>

                {/* Anticipated Deadline */}

                <div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#626A70]">
                      Anticipated Deadline
                    </label>
                    {quickMonths.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuickMonths([])}
                        className="text-[10px] font-bold uppercase tracking-wide text-[#778189] hover:text-[#2F3038]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#E2E3E3] bg-white p-3">

                    {conditionalMonths.map(
                      (month) => {
                        const count =
                          getMonthFacetCount(
                            month
                          );
                        const selected =
                          quickMonths.includes(
                            month
                          );
                        const disabled =
                          count === 0 &&
                          !selected;

                        return (

                        <label
                          key={month}
                          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                            disabled
                              ? "cursor-not-allowed text-[#A0A5A9] opacity-55"
                              : "cursor-pointer text-[#394147] hover:bg-[#F6EFEA]"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={disabled}
                            onChange={() =>
                              activateQuickFilter(
                                () =>
                                  toggleArrayValue(
                                    month,
                                    quickMonths,
                                    setQuickMonths
                                  )
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-[#B7655E]"
                          />

                          <span
                            className={`inline-flex min-w-0 max-w-full flex-1 truncate rounded-full border px-3 py-1 text-xs font-semibold ${getMonthStyle(
                              month
                            )}`}
                          >
                            {month}
                          </span>

                          <span className="rounded-full bg-[#ECEDEE] px-2 py-0.5 text-[10px] font-bold text-[#626A70]">
                            {count}
                          </span>

                        </label>

                        );
                      }
                    )}

                  </div>

                </div>

                {/* Categories */}

                <div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#626A70]">
                      Categories
                    </label>
                    {quickCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuickCategories([])}
                        className="text-[10px] font-bold uppercase tracking-wide text-[#778189] hover:text-[#2F3038]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#E2E3E3] bg-white p-3">

                    {conditionalCategories.map(
                      (category) => {
                        const count =
                          getCategoryFacetCount(
                            category
                          );
                        const selected =
                          quickCategories.includes(
                            category
                          );
                        const disabled =
                          count === 0 &&
                          !selected;

                        return (

                        <label
                          key={category}
                          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                            disabled
                              ? "cursor-not-allowed text-[#A0A5A9] opacity-55"
                              : "cursor-pointer text-[#394147] hover:bg-[#F6EFEA]"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={disabled}
                            onChange={() =>
                              activateQuickFilter(
                                () =>
                                  toggleArrayValue(
                                    category,
                                    quickCategories,
                                    setQuickCategories
                                  )
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-[#B7655E]"
                          />

                          <span
                            className={`inline-flex min-w-0 max-w-full flex-1 truncate rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                              category,
                              categoryColorMap
                            )}`}
                          >
                            {category}
                          </span>

                          <span className="rounded-full bg-[#ECEDEE] px-2 py-0.5 text-[10px] font-bold text-[#626A70]">
                            {count}
                          </span>

                        </label>

                        );
                      }
                    )}

                  </div>

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              ADVANCED FILTER PANEL
          ================================================== */}

          {showAdvancedFilters && (

            <div
              ref={advancedFilterPopoverRef}
              className="absolute left-4 right-4 top-full z-[150] mt-3 max-h-[72vh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-6 shadow-[0_24px_60px_rgba(18,19,22,0.30)] sm:left-6 sm:right-6"
            >

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h3 className="text-base font-semibold text-[#2F3038]">
                    Advanced Filters
                  </h3>

                  <p className="mt-1 text-sm text-[#626A70]">
                    Build custom rules and choose how each one connects to the previous rule.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={addAdvancedFilter}
                  className="rounded-xl bg-[#B7655E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7B8791]"
                >
                  + Add Filter
                </button>

              </div>

              {advancedFilters.length === 0 ? (

                <div className="mt-5 rounded-xl border border-dashed border-[#CBD9E1] bg-[#FAFCFD] p-6 text-center">

                  <p className="text-sm text-[#626A70]">
                    No advanced filters added yet.
                  </p>

                  <p className="mt-1 text-xs text-[#94A3AB]">
                    Click "Add Filter" to create your first rule.
                  </p>

                </div>

              ) : (

                <div className="mt-5 space-y-3">

                  {advancedFilters.map(
                    (
                      filter,
                      filterIndex
                    ) => {

                      const options =
                        getAdvancedFilterOptions(
                          filter.field
                        );

                      const dropdownIsOpen =
                        openAdvancedDropdownId ===
                        filter.id;

                      return (

                        <div
                          key={filter.id}
                          className="relative flex flex-col gap-3 rounded-xl border border-[#E2E3E3] bg-white p-4 lg:flex-row lg:items-start"
                        >

                          {filterIndex === 0 ? (
                            <div className="rounded-lg border border-[#E2E3E3] bg-[#F7F9FA] px-3 py-2 text-sm font-semibold text-[#69747C] lg:mt-0">
                              WHERE
                            </div>
                          ) : (
                            <select
                              value={filter.connector}
                              onChange={(event) =>
                                updateAdvancedFilter(
                                  filter.id,
                                  {
                                    connector:
                                      event.target.value as
                                        | "AND"
                                        | "OR",
                                  }
                                )
                              }
                              className="rounded-lg border border-[#DFE0E0] bg-[#F7F9FA] px-3 py-2 text-sm font-bold text-[#69747C] outline-none focus:border-[#B7655E]"
                            >
                              <option value="AND">
                                AND
                              </option>
                              <option value="OR">
                                OR
                              </option>
                            </select>
                          )}

                          <select
                            value={filter.field}
                            onChange={(e) => {

                              const field =
                                e.target.value as FilterField;

                              updateAdvancedFilter(
                                filter.id,
                                {
                                  field,
                                  operator: "is",
                                  values: [],
                                }
                              );

                              setOpenAdvancedDropdownId(
                                null
                              );

                            }}
                            className="rounded-lg border border-[#DFE0E0] bg-white px-3 py-2 text-sm text-[#394147] outline-none focus:border-[#B7655E]"
                          >

                            <option value="grantor">
                              Grantor
                            </option>

                            <option value="maximum_grant">
                              Maximum Grant
                            </option>

                            <option value="deadline">
                              Deadline
                            </option>

                            <option value="anticipated_deadline">
                              Anticipated Deadline
                            </option>

                            <option value="category">
                              Categories
                            </option>

                            <option value="limited_opportunity">
                              Limited Opportunity
                            </option>

                            <option value="fellowship_opportunity">
                              Fellowship Opportunity
                            </option>

                          </select>

                          <select
                            value={filter.operator}
                            onChange={(e) =>
                              updateAdvancedFilter(
                                filter.id,
                                {
                                  operator:
                                    e.target
                                      .value as FilterOperator,
                                }
                              )
                            }
                            className="rounded-lg border border-[#DFE0E0] bg-white px-3 py-2 text-sm text-[#394147] outline-none focus:border-[#B7655E]"
                          >

                            {getAdvancedOperators(
                              filter.field
                            ).map((operator) => (
                              <option
                                key={operator}
                                value={operator}
                              >
                                {getOperatorLabel(
                                  operator,
                                  filter.field
                                )}
                              </option>
                            ))}

                          </select>

                          <div
                            ref={
                              dropdownIsOpen
                                ? advancedDropdownRef
                                : null
                            }
                            className="relative min-w-0 flex-1"
                          >

                            <div
                              className={`min-h-[42px] rounded-lg border bg-white p-1.5 transition ${
                                dropdownIsOpen
                                  ? "border-[#B7655E] ring-2 ring-[#AF915A]/40"
                                  : "border-[#DFE0E0]"
                              }`}
                            >

                              <div className="flex flex-wrap items-center gap-1.5">

                                {filter.values.length === 0 && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenAdvancedDropdownId(
                                        dropdownIsOpen
                                          ? null
                                          : filter.id
                                      )
                                    }
                                    className="flex-1 px-2 py-1.5 text-left text-sm text-[#747E85]"
                                  >
                                    Select{" "}
                                    {getFieldLabel(
                                      filter.field
                                    ).toLowerCase()}
                                  </button>

                                )}

                                {filter.values.map(
                                  (
                                    value
                                  ) => (

                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() =>
                                        removeAdvancedFilterValue(
                                          filter.id,
                                          value
                                        )
                                      }
                                      className={`inline-flex max-w-full items-center gap-1 border px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-95 ${
                                        filter.field ===
                                        "anticipated_deadline"
                                          ? `rounded-full ${getMonthStyle(
                                              value
                                            )}`
                                          : filter.field ===
                                            "category"
                                          ? `rounded-full ${getCategoryStyle(
                                              value,
                                              categoryColorMap
                                            )}`
                                          : "rounded-md border-[#D6CBC6] bg-[#EEF5F8] text-[#394147] hover:bg-[#DCEAF1]"
                                      }`}
                                    >

                                      <span className="max-w-[180px] truncate">

                                        {filter.field ===
                                        "deadline"
                                          ? formatDeadline(
                                              value
                                            )
                                          : value}

                                      </span>

                                      <span className="font-bold text-[#69747C]">
                                        ×
                                      </span>

                                    </button>

                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenAdvancedDropdownId(
                                      dropdownIsOpen
                                        ? null
                                        : filter.id
                                    )
                                  }
                                  aria-label="Add filter value"
                                  className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#94A3AB] transition hover:bg-[#E2E3E3] hover:text-[#394147]"
                                >

                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className={`h-4 w-4 transition-transform ${
                                      dropdownIsOpen
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  >

                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                    />

                                  </svg>

                                </button>

                              </div>

                            </div>

                            {dropdownIsOpen && (

                              <div className="relative mt-2 max-h-80 w-full min-w-[260px] overflow-y-auto rounded-xl border border-[#C8CBCC] bg-white p-3 shadow-[0_12px_28px_rgba(42,64,76,0.12)]">

                                {options.length === 0 ? (

                                  <div className="px-3 py-4 text-center text-sm text-[#94A3AB]">
                                    No options available
                                  </div>

                                ) : (

                                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">

                                  {options.map(
                                    (
                                      option
                                    ) => (

                                      <label
                                        key={option}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#394147] hover:bg-[#F6EFEA]"
                                      >

                                        <input
                                          type="checkbox"
                                          checked={filter.values.includes(
                                            option
                                          )}
                                          onChange={() => {

                                            const newValues =
                                              filter.values.includes(
                                                option
                                              )
                                                ? filter.values.filter(
                                                    (
                                                      value
                                                    ) =>
                                                      value !==
                                                      option
                                                  )
                                                : [
                                                    ...filter.values,
                                                    option,
                                                  ];

                                            updateAdvancedFilter(
                                              filter.id,
                                              {
                                                values:
                                                  newValues,
                                              }
                                            );

                                          }}
                                          className="h-4 w-4 rounded border-slate-300 accent-[#B7655E]"
                                        />

                                        {filter.field ===
                                        "anticipated_deadline" ? (

                                          <span
                                            className={`inline-flex min-w-0 max-w-full rounded-full border px-3 py-1 text-xs font-semibold ${getMonthStyle(
                                              option
                                            )}`}
                                          >
                                            <span className="truncate">
                                              {option}
                                            </span>
                                          </span>

                                        ) : filter.field ===
                                          "category" ? (

                                          <span
                                            className={`inline-flex min-w-0 max-w-full rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                                              option,
                                              categoryColorMap
                                            )}`}
                                          >
                                            <span className="truncate">
                                              {option}
                                            </span>
                                          </span>

                                        ) : (

                                          <span>
                                            {filter.field ===
                                            "deadline"
                                              ? formatDeadline(
                                                  option
                                                )
                                              : option}
                                          </span>

                                        )}

                                      </label>

                                    )
                                  )}

                                  </div>

                                )}

                              </div>

                            )}

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeAdvancedFilter(
                                filter.id
                              )
                            }
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#69747C] transition hover:bg-red-50 hover:text-red-700"
                          >
                            Remove
                          </button>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

              <div className="mt-5 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-[#647781] transition hover:bg-[#E2E3E3] hover:text-[#2F3038]"
                >
                  Clear Advanced Filters
                </button>

              </div>

            </div>

          )}

          {/* ==================================================
              ACTIVE FILTER CHIPS
          ================================================== */}

          {totalActiveFilterCount > 0 && (

            <div className="mt-5 flex flex-wrap items-center gap-2">

              <span className="text-sm font-semibold text-white/90">
                Active filters:
              </span>

              {quickGrantors.map(
                (grantor) => (

                  <button
                    key={`grantor-${grantor}`}
                    type="button"
                    onClick={() =>
                      toggleArrayValue(
                        grantor,
                        quickGrantors,
                        setQuickGrantors
                      )
                    }
                    className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                  >
                    Grantor:{" "}
                    {grantor} ×
                  </button>

                )
              )}

              {quickMaximumGrants.map(
                (amount) => (

                  <button
                    key={`maximum-${amount}`}
                    type="button"
                    onClick={() =>
                      toggleArrayValue(
                        amount,
                        quickMaximumGrants,
                        setQuickMaximumGrants
                      )
                    }
                    className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                  >
                    Maximum Grant:{" "}
                    {amount} ×
                  </button>

                )
              )}

              {quickDeadline !== "all" && (

                <button
                  type="button"
                  onClick={() =>
                    setQuickDeadline("all")
                  }
                  className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                >
                  Deadline:{" "}
                  {quickDeadline ===
                  "no-deadline"
                    ? "No specific deadline"
                    : `Within ${quickDeadline} days`}{" "}
                  ×
                </button>

              )}

              {quickMonths.map(
                (month) => (

                  <button
                    key={`month-${month}`}
                    type="button"
                    onClick={() =>
                      toggleArrayValue(
                        month,
                        quickMonths,
                        setQuickMonths
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:brightness-95 ${getMonthStyle(
                      month
                    )}`}
                  >
                    {month} ×
                  </button>

                )
              )}

              {quickCategories.map(
                (category) => (

                  <button
                    key={`category-${category}`}
                    type="button"
                    onClick={() =>
                      toggleArrayValue(
                        category,
                        quickCategories,
                        setQuickCategories
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:brightness-95 ${getCategoryStyle(
                      category,
                      categoryColorMap
                    )}`}
                  >
                    {category} ×
                  </button>

                )
              )}

              {activeAdvancedFilterCount > 0 && (

                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
                >
                  Advanced filters:{" "}
                  {activeAdvancedFilterCount}{" "}
                  ×
                </button>

              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-1 text-xs font-semibold text-white/80 underline underline-offset-2 hover:text-white"
              >
                Clear all
              </button>

            </div>

          )}

          {/* ==================================================
              SEARCH RESULT COUNT
          ================================================== */}

          {(search.trim() ||
            totalActiveFilterCount > 0) && (

            <div className="mt-4 flex items-center gap-2 text-sm text-[#EADCD4]">

              <span className="inline-block h-2 w-2 rounded-full bg-[#E1DFDE]" />

              Showing{" "}

              <span className="font-semibold text-white">
                {filteredCustomers.length}
              </span>{" "}

              matching opportunities

            </div>

          )}

        </div>

      <div className="mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7B8791]">
            Opportunity directory
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-[#2F3038]">
            {mode === "favorites"
              ? favoriteView === "active"
                ? "Active Favorites"
                : "Archived Favorites"
              : "Active Opportunities"}
          </h2>
        </div>
      </div>

      {/* ==================================================
          OPPORTUNITIES TABLE
      ================================================== */}

      <div className="relative z-0 overflow-hidden rounded-[24px] border border-[#C8CBCC] bg-[#F4F3F1] shadow-[0_12px_35px_rgba(63,91,108,0.07)]">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#2F3038] text-white">

              <tr>

                <th className="border-b border-white/10 p-5 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Grantor
                </th>

                <th className="border-b border-white/10 p-5 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Opportunity
                </th>

                <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Maximum Grant
                </th>

                <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Deadline
                </th>

                <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Anticipated Deadline Month
                </th>

                <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Categories
                </th>

                <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Save
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-[#D7D9DA]">

              {filteredCustomers.map(
                (
                  customer,
                  index
                ) => {

                  const deadlineStyle =
                    getDeadlineStyle(
                      customer.deadline
                    );

                  const isPastDeadline =
                    customer.deadline
                      ? new Date(
                          `${customer.deadline}T00:00:00`
                        ) <
                        new Date()
                      : false;

                  const isSelected =
                    String(selectedCustomerId) ===
                    String(customer.id);

                  const grantorInitials = (
                    customer.grantor || "—"
                  )
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) =>
                      word.charAt(0).toUpperCase()
                    )
                    .join("");

                  const daysUntilDeadline =
                    getDeadlineDays(
                      customer.deadline
                    );

                  return (

                      <tr
                      key={customer.id}
                      ref={(element) => {
                        rowRefs.current[
                          String(customer.id)
                        ] = element;
                      }}
                      onClick={() =>
                        setSelectedCustomerId(
                          String(customer.id)
                        )
                      }

                      className={`group cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-[#F2D9D5] shadow-[inset_6px_0_0_#2F3038,0_8px_24px_rgba(47,48,56,0.10)]"
                          : index % 2 === 0
                            ? "bg-[#F4F3F1] hover:bg-white"
                            : "bg-[#ECEDEE] hover:bg-white"
                      }`}
                    >

                      {/* Grantor */}

                      <td className="border-l-4 border-transparent p-5 align-top text-left transition-colors group-hover:border-[#C2A05A]">

                        <div className="flex min-w-[170px] items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-xs font-bold tracking-wide text-[#444B51] shadow-sm">
                            {grantorInitials}
                          </span>
                          <div>
                            <span className="block font-semibold leading-5 text-[#3E454B]">
                              {customer.grantor ||
                                "-"}
                            </span>
                          </div>
                        </div>

                      </td>

                      {/* Opportunity */}

                      <td className="p-5 align-top text-left">

                        <div className="flex min-w-[250px] items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-bold leading-6 text-[#2F3038]">
                              {customer.opportunity_name ||
                                "-"}
                            </div>
                          </div>
                          <span className="mt-1 translate-x-2 text-lg text-[#69747C] opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </div>

                      </td>

                      {/* Maximum Grant */}

                      <td className="p-5 align-top text-center">

                        <div className="inline-flex min-w-[120px] flex-col rounded-xl border border-[#C8CBCC] bg-white px-4 py-3 shadow-sm">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#778189]">
                            Up to
                          </span>
                          <span className="mt-1 text-sm font-bold text-[#3E454B]">
                            {customer.maximum_grant ||
                              "Not specified"}
                          </span>
                        </div>

                      </td>

                      {/* Deadline */}

                      <td className="p-5 align-top">

                        <div className="flex flex-col items-center gap-2">

                          {customer.deadline ? (

                            <>

                              <span className="font-semibold text-[#4B5359]">

                                {new Date(
                                  `${customer.deadline}T00:00:00`
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month:
                                      "short",
                                    day: "numeric",
                                  }
                                )}

                              </span>

                              {!isPastDeadline &&
                                daysUntilDeadline !==
                                  null && (
                                  <span className="rounded-full bg-[#2F3038] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                    {daysUntilDeadline ===
                                    0
                                      ? "Due today"
                                      : `${daysUntilDeadline} days`}
                                  </span>
                                )}

                              {isPastDeadline && (

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${deadlineStyle.container}`}
                                >
                                  Past deadline
                                </span>

                              )}

                            </>

                          ) : (

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${deadlineStyle.container}`}
                            >
                              Not set
                            </span>

                          )}

                        </div>

                      </td>

                      {/* Anticipated Deadline */}

                      <td className="p-5 align-top text-center">

                        {customer.anticipated_deadline ? (

                          <button
                            type="button"
                            aria-label={`Filter by anticipated deadline ${customer.anticipated_deadline}`}
                            title="Add to Quick Filters"
                            onClick={(event) => {
                              event.stopPropagation();
                              addMonthQuickFilter(
                                String(
                                  customer.anticipated_deadline
                                )
                              );
                            }}
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getMonthStyle(
                              customer.anticipated_deadline
                            )} transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md`}
                          >
                            {
                              customer.anticipated_deadline
                            }
                          </button>

                        ) : (

                          <span className="text-[#7D858B]">
                            —
                          </span>

                        )}

                      </td>

                      {/* Categories */}

                      <td className="p-5 align-top">

                        <div className="flex flex-wrap justify-center gap-2">

                          {Array.isArray(
                            customer.rfp_categories
                          ) &&
                          customer.rfp_categories
                            .length >
                            0 ? (

                            customer.rfp_categories.map(
                              (
                                category
                              ) => (

                                <button
                                  type="button"
                                  aria-label={`Filter by category ${category}`}
                                  title="Add to Quick Filters"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    addCategoryQuickFilter(
                                      category
                                    );
                                  }}
                                  key={
                                    category
                                  }
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                                    category,
                                    categoryColorMap
                                  )} transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md`}
                                >
                                  {
                                    category
                                  }
                                </button>

                              )
                            )

                          ) : (

                            <span className="text-[#7D858B]">
                              —
                            </span>

                          )}

                        </div>

                      </td>

                      {/* Favorite */}

                      <td className="p-5 align-top text-center">
                        <button
                          type="button"
                          disabled={
                            !favoritesReady ||
                            favoritePendingIds.has(
                              String(customer.id)
                            )
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorite(customer.id);
                          }}
                          aria-label={
                            favoriteIds.has(
                              String(customer.id)
                            )
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                          title={
                            currentUserId
                              ? favoriteIds.has(
                                  String(customer.id)
                                )
                                ? "Remove from Favorites"
                                : "Add to Favorites"
                              : "Sign in to save this opportunity"
                          }
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-50 ${
                            favoriteIds.has(
                              String(customer.id)
                            )
                              ? "border-[#C4932D] bg-[#F2C14E] text-[#171719]"
                              : "border-[#C8CBCC] bg-white text-[#69747C] hover:border-[#C4932D] hover:text-[#9A6D12]"
                          }`}
                        >
                          {favoriteIds.has(
                            String(customer.id)
                          )
                            ? "★"
                            : "☆"}
                        </button>
                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {filteredCustomers.length ===
          0 && (

          <div className="bg-[#E2E3E3] px-6 py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] text-[#747E85] shadow-sm">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-7 w-7"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                />

              </svg>

            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#2F3038]">
              No opportunities found
            </h3>

            <p className="mt-2 text-sm text-[#626A70]">
              Try adjusting your search or
              filters to find matching funding
              opportunities.
            </p>

          </div>

        )}

      </div>

      {/* ==================================================
          ACTIVE OPPORTUNITIES COUNT
      ================================================== */}

      <div className="mt-4 flex justify-start">

        <div className="inline-flex items-center gap-3 rounded-xl border border-[#C8CBCC] bg-[#E8D7C8] px-5 py-3 shadow-sm">

          <span className="h-2.5 w-2.5 rounded-full bg-[#B7655E]" />

          <span className="text-sm font-semibold text-[#4B5359]">

            <span className="font-bold text-[#2F3038]">
              {mode === "favorites"
                ? favoriteView === "active"
                  ? favoriteActiveCount
                  : favoriteArchivedCount
                : activeCount}
            </span>{" "}

            {mode === "favorites"
              ? favoriteView === "active"
                ? "Active Favorites"
                : "Archived Favorites"
              : "Active Opportunities"}

          </span>

        </div>

      </div>

      {/* ==================================================
          REALTIME-SYNCHRONIZED DRAWER
      ================================================== */}

      <CustomerDrawer
        customer={selectedCustomer}
        isFavorite={
          selectedCustomer
            ? favoriteIds.has(
                String(selectedCustomer.id)
              )
            : false
        }
        favoriteDisabled={
          !favoritesReady ||
          (selectedCustomer
            ? favoritePendingIds.has(
                String(selectedCustomer.id)
              )
            : false)
        }
        onToggleFavorite={() => {
          if (selectedCustomer) {
            toggleFavorite(selectedCustomer.id);
          }
        }}
        availableCategories={availableCategories}
        categoryColorMap={categoryColorMap}
        navigationCustomers={filteredCustomers}
        onNavigate={(customerId) =>
          setSelectedCustomerId(
            String(customerId)
          )
        }
        onClose={() =>
          setSelectedCustomerId(null)
        }
      />

        </div>
      </main>
    </div>
  </div>
);
}