"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CustomerDrawer from "./CustomerDrawer";
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

type FilterOperator = "is" | "is_not";

type AdvancedFilter = {
  id: number;
  connector: "AND";
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

const SORT_FIELD_LABELS: Record<
  SortField,
  string
> = {
  grantor: "Grantor",
  maximum_grant: "Maximum Grant",
  deadline: "Deadline",
  anticipated_deadline:
    "Anticipated Deadline",
};

export default function CustomerTable({
  customers,
  activeCount,
}: {
  customers: Customer[];
  activeCount: number;
}) {
  // --------------------------------------------------
  // Selected Customer / Realtime Drawer
  // --------------------------------------------------

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);

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

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const [search, setSearch] = useState("");

  // --------------------------------------------------
  // Stackable Sort State
  // --------------------------------------------------

  const [sortRules, setSortRules] =
    useState<SortRule[]>([
      {
        id: 1,
        field: "anticipated_deadline",
        direction: "asc",
      },
      {
        id: 2,
        field: "deadline",
        direction: "asc",
      },
      {
        id: 3,
        field: "maximum_grant",
        direction: "desc",
      },
    ]);

  const [nextSortId, setNextSortId] =
    useState(4);

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
      const target =
        event.target as Node;

      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(
          target
        )
      ) {
        setShowSortOptions(false);
      }

      if (
        advancedDropdownRef.current &&
        !advancedDropdownRef.current.contains(
          target
        )
      ) {
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
  }, []);

  // --------------------------------------------------
  // Dynamic Filter Options
  // --------------------------------------------------

  const availableCategories = useMemo(() => {
    const categories = customers.flatMap(
      (customer) =>
        Array.isArray(
          customer.rfp_categories
        )
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

  const availableMaximumGrants = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .map((customer) =>
            String(
              customer.maximum_grant ?? ""
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort(
      (a, b) =>
        parseMaximumGrant(b) -
        parseMaximumGrant(a)
    );
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

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    if (
      filter.values.length === 0
    ) {
      return true;
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
    let result = customers.filter(
      (customer) =>
        customer.Category ===
        "active"
    );

    // Search

    if (search.trim()) {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

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
              String(value ?? "")
                .toLowerCase()
                .includes(
                  searchTerm
                )
          );
        }
      );
    }

    // Quick Grantor Filter

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

    // Quick Maximum Grant Filter

    if (
      quickMaximumGrants.length >
      0
    ) {
      result = result.filter(
        (customer) =>
          customer.maximum_grant &&
          quickMaximumGrants.includes(
            String(
              customer.maximum_grant
            )
          )
      );
    }

    // Quick Deadline Filter

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

    // Quick Anticipated Deadline Filter

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

    // Quick Category Filter

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

    // Advanced Filters

    if (
      advancedFilters.length > 0
    ) {
      result = result.filter(
        (customer) =>
          advancedFilters.every(
            (filter) =>
              filter.values.length ===
                0 ||
              matchesAdvancedFilter(
                customer,
                filter
              )
          )
      );
    }

    // Stackable Sorting

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
  ]);

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

  const resetSortRules = () => {
    setSortRules([
      {
        id: 1,
        field: "anticipated_deadline",
        direction: "asc",
      },
      {
        id: 2,
        field: "deadline",
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
        "bg-[#D9E8F0] text-[#31566B] border-[#AFC9D8]",
      february:
        "bg-[#E5DDF0] text-[#5B4772] border-[#C8B8DA]",
      march:
        "bg-[#DDE8D8] text-[#46613F] border-[#B8CCAF]",
      april:
        "bg-[#E9E0D3] text-[#66523D] border-[#D2C0A8]",
      may:
        "bg-[#E8D9DF] text-[#704B5A] border-[#CEB5BF]",
      june:
        "bg-[#D8E5E7] text-[#3F5E63] border-[#B0C9CD]",
      july:
        "bg-[#E1DCD2] text-[#5E574B] border-[#C8BDAA]",
      august:
        "bg-[#DCDDE5] text-[#4E5265] border-[#BCBFCE]",
      september:
        "bg-[#E5DED4] text-[#62574A] border-[#CEC2B2]",
      october:
        "bg-[#E7D9D0] text-[#694F43] border-[#CDB7A9]",
      november:
        "bg-[#DADFE4] text-[#4B5660] border-[#B8C2CA]",
      december:
        "bg-[#E2DDE7] text-[#5D5267] border-[#C5BBCD]",
      rolling:
        "bg-[#E3E0D8] text-[#5D574B] border-[#C9C3B7]",
    };

    return (
      monthColors[
        normalizedMonth
      ] ||
      "bg-[#E1E3E5] text-[#555B60] border-[#C5C8CB]"
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
  // Render
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 py-2">
      <div className="mx-auto max-w-[1800px]">

        {/* Dashboard Header */}

        <div className="relative mb-6 overflow-visible rounded-2xl border border-[#9FB7C8] bg-[#AFC4D4] p-8 text-slate-800 shadow-lg">

          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-gradient-to-r from-[#7E9FB5] via-[#91AFC2] to-[#AFC4D4]" />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>

              {/* Logo */}

              <div className="mb-6 flex h-20 w-64 items-center">
                <img
                  src="/lg-listings-logo.png"
                  alt="LG Listings"
                  className="h-full w-auto max-w-full object-contain object-left"
                />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">
                Private Grant Funding
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Active RFP Opportunities
              </h1>

              <p className="mt-3 max-w-2xl leading-6 text-slate-700">
                Explore current funding opportunities and discover grants that
                align with your research, programs, and academic priorities.
              </p>

            </div>

            <div className="flex-shrink-0">

              <div className="relative min-w-[200px] overflow-hidden rounded-2xl border border-[#91AFC2] bg-white/50 px-7 py-5 shadow-sm">

                <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-white/30" />

                <div className="relative text-center">

                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Active RFPs
                  </div>

                  <div className="mt-1 text-4xl font-bold text-slate-900">
                    {activeCount}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Currently available
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Search and Filters */}

          <div className="mt-8 border-t border-[#91AFC2] pt-6">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* Search */}

              <div className="relative flex-1">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">

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
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#91AFC2] bg-white/70 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#6F91A8] focus:bg-white focus:ring-4 focus:ring-white/30"
                />

              </div>

              {/* Quick Filter Button */}

              <button
                type="button"
                onClick={() =>
                  setShowQuickFilters(
                    (current) =>
                      !current
                  )
                }
                className="rounded-xl border border-[#91AFC2] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
              >
                Quick Filter

                {activeQuickFilterCount >
                  0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6F91A8] px-1.5 text-xs text-white">
                    {activeQuickFilterCount}
                  </span>
                )}
              </button>

              {/* Advanced Filter Button */}

              <button
                type="button"
                onClick={() =>
                  setShowAdvancedFilters(
                    (current) =>
                      !current
                  )
                }
                className="rounded-xl border border-[#91AFC2] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
              >
                Advanced Filters

                {activeAdvancedFilterCount >
                  0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6F91A8] px-1.5 text-xs text-white">
                    {activeAdvancedFilterCount}
                  </span>
                )}
              </button>

              {/* Stackable Sort */}

              <div
                ref={sortDropdownRef}
                className="relative"
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowSortOptions(
                      (current) =>
                        !current
                    )
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#91AFC2] bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition hover:bg-white xl:min-w-[280px]"
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
                  <div className="absolute right-0 top-full z-[100] mt-2 w-[380px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <h3 className="text-sm font-semibold text-slate-900">
                          Sort by
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Sorts are applied from top to bottom.
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={
                          resetSortRules
                        }
                        className="text-xs font-semibold text-[#5F829B] underline underline-offset-2 hover:text-[#456A82]"
                      >
                        Reset
                      </button>

                    </div>

                    <div className="space-y-3">

                      {sortRules.map(
                        (
                          rule,
                          index
                        ) => (
                          <div
                            key={
                              rule.id
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >

                            <div className="mb-2 flex items-center justify-between">

                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Sort level{" "}
                                {index +
                                  1}
                              </span>

                              {sortRules.length >
                                1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSortRule(
                                      rule.id
                                    )
                                  }
                                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                                >
                                  Remove
                                </button>
                              )}

                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                              <select
                                value={
                                  rule.field
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateSortRule(
                                    rule.id,
                                    {
                                      field:
                                        e
                                          .target
                                          .value as SortField,
                                    }
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#6F91A8]"
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
                                        key={
                                          field
                                        }
                                        value={
                                          field
                                        }
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
                                onChange={(
                                  e
                                ) =>
                                  updateSortRule(
                                    rule.id,
                                    {
                                      direction:
                                        e
                                          .target
                                          .value as SortDirection,
                                    }
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#6F91A8]"
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

                    {sortRules.length <
                      4 && (
                      <button
                        type="button"
                        onClick={
                          addSortRule
                        }
                        className="mt-4 w-full rounded-xl border border-dashed border-[#91AFC2] bg-[#F2F7FA] px-4 py-2.5 text-sm font-semibold text-[#5F829B] transition hover:bg-[#E7F0F5]"
                      >
                        + Add Sort Level
                      </button>
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* Quick Filter Panel */}

            {showQuickFilters && (
              <div className="mt-5 rounded-2xl border border-[#91AFC2] bg-white/70 p-6 shadow-sm">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-5">

                  {/* Grantor */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Grantor
                    </label>

                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      {availableGrantors.map(
                        (grantor) => (
                          <label
                            key={
                              grantor
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >

                            <input
                              type="checkbox"
                              checked={quickGrantors.includes(
                                grantor
                              )}
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
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {grantor}
                            </span>

                          </label>
                        )
                      )}

                    </div>

                  </div>

                  {/* Maximum Grant */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Maximum Grant
                    </label>

                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      {availableMaximumGrants.map(
                        (amount) => (
                          <label
                            key={
                              amount
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >

                            <input
                              type="checkbox"
                              checked={quickMaximumGrants.includes(
                                amount
                              )}
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
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {amount}
                            </span>

                          </label>
                        )
                      )}

                    </div>

                  </div>

                  {/* Deadline */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Deadline
                    </label>

                    <select
                      value={
                        quickDeadline
                      }
                      onChange={(e) =>
                        activateQuickFilter(
                          () =>
                            setQuickDeadline(
                              e
                                .target
                                .value
                            )
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40"
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

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Anticipated Deadline
                    </label>

                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      {availableMonths.map(
                        (month) => (
                          <label
                            key={
                              month
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >

                            <input
                              type="checkbox"
                              checked={quickMonths.includes(
                                month
                              )}
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
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {month}
                            </span>

                          </label>
                        )
                      )}

                    </div>

                  </div>

                  {/* Categories */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Categories
                    </label>

                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      {availableCategories.map(
                        (category) => (
                          <label
                            key={
                              category
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >

                            <input
                              type="checkbox"
                              checked={quickCategories.includes(
                                category
                              )}
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
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {category}
                            </span>

                          </label>
                        )
                      )}

                    </div>

                  </div>

                </div>

                <div className="mt-5 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      clearQuickFilters
                    }
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Clear Filters
                  </button>

                </div>

              </div>
            )}

            {/* Advanced Filter Panel */}

            {showAdvancedFilters && (
              <div className="relative z-[90] mt-5 rounded-2xl border border-[#91AFC2] bg-white/70 p-6 shadow-sm">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <h3 className="text-base font-semibold text-slate-900">
                      Advanced Filters
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Build a custom filter using
                      multiple AND rules.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      addAdvancedFilter
                    }
                    className="rounded-xl bg-[#6F91A8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5F829B]"
                  >
                    + Add Filter
                  </button>

                </div>

                {advancedFilters.length ===
                0 ? (

                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">

                    <p className="text-sm text-slate-500">
                      No advanced filters added yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Click "Add Filter" to create
                      your first rule.
                    </p>

                  </div>

                ) : (

                  <div className="mt-5 space-y-3">

                    {advancedFilters.map(
                      (
                        filter
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
                            key={
                              filter.id
                            }
                            className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-start"
                          >

                            {/* AND */}

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500 lg:mt-0">
                              AND
                            </div>

                            {/* Field */}

                            <select
                              value={
                                filter.field
                              }
                              onChange={(
                                e
                              ) => {

                                const field =
                                  e
                                    .target
                                    .value as FilterField;

                                updateAdvancedFilter(
                                  filter.id,
                                  {
                                    field,
                                    values:
                                      [],
                                  }
                                );

                                setOpenAdvancedDropdownId(
                                  null
                                );

                              }}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
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

                            {/* Operator */}

                            <select
                              value={
                                filter.operator
                              }
                              onChange={(
                                e
                              ) =>
                                updateAdvancedFilter(
                                  filter.id,
                                  {
                                    operator:
                                      e
                                        .target
                                        .value as FilterOperator,
                                  }
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                            >

                              <option value="is">
                                is
                              </option>

                              <option value="is_not">
                                is not
                              </option>

                            </select>

                            {/* Multi-Select Dropdown */}

                            <div
                              ref={
                                dropdownIsOpen
                                  ? advancedDropdownRef
                                  : null
                              }
                              className="relative min-w-0 flex-1"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenAdvancedDropdownId(
                                    dropdownIsOpen
                                      ? null
                                      : filter.id
                                  )
                                }
                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm"
                              >

                                <span
                                  className={
                                    filter.values
                                      .length ===
                                    0
                                      ? "text-slate-400"
                                      : "text-slate-700"
                                  }
                                >

                                  {filter.values
                                    .length ===
                                  0
                                    ? `Select ${getFieldLabel(
                                        filter.field
                                      ).toLowerCase()}`
                                    : `${filter.values.length} selected`}

                                </span>

                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={
                                    1.5
                                  }
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

                              {/* Selected Options */}

                              {filter.values.length >
                                0 && (

                                <div className="mt-2 flex flex-wrap gap-1.5">

                                  {filter.values.map(
                                    (
                                      value
                                    ) => (

                                      <button
                                        key={
                                          value
                                        }
                                        type="button"
                                        onClick={() =>
                                          removeAdvancedFilterValue(
                                            filter.id,
                                            value
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-full border border-[#B8CBD7] bg-[#EEF5F8] px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-[#DCEAF1]"
                                      >

                                        <span className="max-w-[180px] truncate">

                                          {filter.field ===
                                          "deadline"
                                            ? formatDeadline(
                                                value
                                              )
                                            : value}

                                        </span>

                                        <span className="font-bold text-slate-500">
                                          ×
                                        </span>

                                      </button>

                                    )
                                  )}

                                </div>

                              )}

                              {dropdownIsOpen && (

                                <div className="absolute left-0 top-full z-[200] mt-2 max-h-64 w-full min-w-[260px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">

                                  {options.length ===
                                  0 ? (

                                    <div className="px-3 py-4 text-center text-sm text-slate-400">
                                      No options available
                                    </div>

                                  ) : (

                                    options.map(
                                      (
                                        option
                                      ) => (

                                        <label
                                          key={
                                            option
                                          }
                                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
                                            className="h-4 w-4 rounded border-slate-300"
                                          />

                                          <span>

                                            {filter.field ===
                                            "deadline"
                                              ? formatDeadline(
                                                  option
                                                )
                                              : option}

                                          </span>

                                        </label>

                                      )
                                    )

                                  )}

                                </div>

                              )}

                            </div>

                            {/* Remove */}

                            <button
                              type="button"
                              onClick={() =>
                                removeAdvancedFilter(
                                  filter.id
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700"
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
                    onClick={
                      clearAdvancedFilters
                    }
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Clear Advanced Filters
                  </button>

                </div>

              </div>
            )}

            {/* Active Filter Chips */}

            {totalActiveFilterCount >
              0 && (

              <div className="mt-5 flex flex-wrap items-center gap-2">

                <span className="text-sm font-semibold text-slate-700">
                  Active filters:
                </span>

                {/* Quick Grantors */}

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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Grantor:{" "}
                      {grantor} ×
                    </button>

                  )
                )}

                {/* Quick Maximum Grants */}

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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Maximum Grant:{" "}
                      {amount} ×
                    </button>

                  )
                )}

                {/* Quick Deadline */}

                {quickDeadline !==
                  "all" && (

                  <button
                    type="button"
                    onClick={() =>
                      setQuickDeadline(
                        "all"
                      )
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Deadline:{" "}
                    {quickDeadline ===
                    "no-deadline"
                      ? "No specific deadline"
                      : `Within ${quickDeadline} days`}{" "}
                    ×
                  </button>

                )}

                {/* Quick Months */}

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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Anticipated:{" "}
                      {month} ×
                    </button>

                  )
                )}

                {/* Quick Categories */}

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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Category:{" "}
                      {category} ×
                    </button>

                  )
                )}

                {/* Advanced Filter Summary */}

                {activeAdvancedFilterCount >
                  0 && (

                  <button
                    type="button"
                    onClick={
                      clearAdvancedFilters
                    }
                    className="rounded-full border border-[#91AFC2] bg-[#E7EFF4] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#DCE8EF]"
                  >
                    Advanced filters:{" "}
                    {
                      activeAdvancedFilterCount
                    }{" "}
                    ×
                  </button>

                )}

                <button
                  type="button"
                  onClick={
                    clearAllFilters
                  }
                  className="ml-1 text-xs font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900"
                >
                  Clear all
                </button>

              </div>

            )}

            {/* Search Result Count */}

            {(search.trim() ||
              totalActiveFilterCount >
                0) && (

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">

                <span className="inline-block h-2 w-2 rounded-full bg-[#6F91A8]" />

                Showing{" "}

                <span className="font-semibold text-slate-900">
                  {
                    filteredCustomers.length
                  }
                </span>{" "}

                matching opportunities

              </div>

            )}

          </div>

        </div>

        {/* Table */}

        <div className="relative z-0 overflow-hidden rounded-2xl border border-[#D5E0E7] bg-white shadow-lg">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#AFC4D4] text-slate-800">

                <tr>

                  <th className="p-5 text-left text-xs font-semibold uppercase tracking-wider">
                    Grantor
                  </th>

                  <th className="p-5 text-left text-xs font-semibold uppercase tracking-wider">
                    Opportunity
                  </th>

                  <th className="p-5 text-center text-xs font-semibold uppercase tracking-wider">
                    Maximum Grant
                  </th>

                  <th className="p-5 text-center text-xs font-semibold uppercase tracking-wider">
                    Deadline
                  </th>

                  <th className="p-5 text-center text-xs font-semibold uppercase tracking-wider">
                    Anticipated Deadline Month
                  </th>

                  <th className="p-5 text-left text-xs font-semibold uppercase tracking-wider">
                    Abstract
                  </th>

                  <th className="p-5 text-center text-xs font-semibold uppercase tracking-wider">
                    Categories
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200">

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

                    return (

                      <tr
                        key={
                          customer.id
                        }
                        onClick={() =>
                          setSelectedCustomerId(
                            String(
                              customer.id
                            )
                          )
                        }
                        className={`group cursor-pointer transition-all duration-200 ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50"
                        } hover:bg-[#EEF5F8]`}
                      >

                        {/* Grantor */}

                        <td className="p-5 align-top text-left">

                          <span className="font-semibold text-slate-800">
                            {customer.grantor ||
                              "-"}
                          </span>

                        </td>

                        {/* Opportunity */}

                        <td className="p-5 align-top text-left">

                          <div className="font-semibold text-slate-900">
                            {customer.opportunity_name ||
                              "-"}
                          </div>

                        </td>

                        {/* Maximum Grant */}

                        <td className="p-5 align-top text-center">

                          <span className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
                            {customer.maximum_grant ||
                              "Not specified"}
                          </span>

                        </td>

                        {/* Deadline */}

                        <td className="p-5 align-top">

                          <div className="flex flex-col items-center gap-2">

                            {customer.deadline ? (

                              <>

                                <span className="font-semibold text-slate-800">

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

                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getMonthStyle(
                                customer.anticipated_deadline
                              )}`}
                            >
                              {
                                customer.anticipated_deadline
                              }
                            </span>

                          ) : (

                            <span className="text-slate-400">
                              —
                            </span>

                          )}

                        </td>

                        {/* Abstract */}

                        <td className="p-5 align-top text-left">

                          <div className="mx-auto max-w-sm line-clamp-3 text-sm leading-6 text-slate-700">
                            {customer.abstract ||
                              "No abstract provided."}
                          </div>

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

                                  <span
                                    key={
                                      category
                                    }
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                                      category,
                                      categoryColorMap
                                    )}`}
                                  >
                                    {
                                      category
                                    }
                                  </span>

                                )
                              )

                            ) : (

                              <span className="text-slate-400">
                                —
                              </span>

                            )}

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

          {/* Empty State */}

          {filteredCustomers.length ===
            0 && (

            <div className="bg-slate-50 px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-400 shadow-sm">

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

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No opportunities found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try adjusting your search or
                filters to find matching funding
                opportunities.
              </p>

            </div>

          )}

        </div>

        {/* Realtime-synchronized Drawer */}

        <CustomerDrawer
          customer={
            selectedCustomer
          }
          availableCategories={
            availableCategories
          }
          onClose={() =>
            setSelectedCustomerId(
              null
            )
          }
        />

      </div>
    </div>
  );
}