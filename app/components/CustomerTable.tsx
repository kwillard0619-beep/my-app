"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

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
  field: FilterField;
  operator: FilterOperator;
  values: string[];
};

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
];

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
  // Search and Sort
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

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

  const advancedFilterRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Close Advanced Filters When Clicking Elsewhere
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        advancedFilterRef.current &&
        !advancedFilterRef.current.contains(
          event.target as Node
        )
      ) {
        setShowAdvancedFilters(false);
      }
    };

    if (showAdvancedFilters) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showAdvancedFilters]);

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
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [customers]);

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

  const availableMonths = useMemo(() => {
    const months = customers
      .map((customer) =>
        String(
          customer.anticipated_deadline ?? ""
        ).trim()
      )
      .filter(Boolean);

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

  const availableMaximumGrants = useMemo(() => {
    const values = Array.from(
      new Set(
        customers
          .map((customer) =>
            String(
              customer.maximum_grant ?? ""
            ).trim()
          )
          .filter(Boolean)
      )
    );

    const parseAmount = (
      value: string
    ) => {
      const cleaned = value
        .replace(/[$,\s]/g, "")
        .replace(/[^\d.-]/g, "");

      const numericValue =
        Number(cleaned);

      return Number.isFinite(
        numericValue
      )
        ? numericValue
        : -1;
    };

    return values.sort(
      (a, b) =>
        parseAmount(b) -
        parseAmount(a)
    );
  }, [customers]);

  const availableDeadlines = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .map(
            (customer) =>
              customer.deadline
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
      )
    ).sort(
      (a, b) =>
        new Date(
          `${a}T00:00:00`
        ).getTime() -
        new Date(
          `${b}T00:00:00`
        ).getTime()
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
      quickDeadline ===
      "30"
    ) {
      return daysUntil <= 30;
    }

    if (
      quickDeadline ===
      "60"
    ) {
      return daysUntil <= 60;
    }

    if (
      quickDeadline ===
      "90"
    ) {
      return daysUntil <= 90;
    }

    return true;
  };

  const parseMaximumGrant = (
    value: string | null
  ) => {
    if (!value) {
      return null;
    }

    const cleaned = value
      .replace(/[$,\s]/g, "")
      .replace(/[^\d.-]/g, "");

    const number =
      Number(cleaned);

    return Number.isFinite(number)
      ? number
      : null;
  };

  const getBooleanValue = (
    value:
      | string
      | boolean
      | null
      | undefined
  ) => {
    if (
      typeof value ===
      "boolean"
    ) {
      return value;
    }

    if (
      typeof value !==
      "string"
    ) {
      return false;
    }

    const normalized =
      value
        .trim()
        .toLowerCase();

    return (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "y"
    );
  };

  // --------------------------------------------------
  // Advanced Filter Helpers
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
        return [
          "Yes",
          "No",
        ];

      case "fellowship_opportunity":
        return [
          "Yes",
          "No",
        ];

      default:
        return [];
    }
  };

  const getFilterLabel = (
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

  const getFilterValues = (
    customer: Customer,
    field: FilterField
  ): string[] => {
    switch (field) {
      case "grantor":
        return customer.grantor
          ? [customer.grantor]
          : [];

      case "maximum_grant":
        return customer.maximum_grant
          ? [
              customer.maximum_grant,
            ]
          : [];

      case "deadline":
        return customer.deadline
          ? [customer.deadline]
          : [];

      case "anticipated_deadline":
        return customer.anticipated_deadline
          ? [
              customer.anticipated_deadline,
            ]
          : [];

      case "category":
        return Array.isArray(
          customer.rfp_categories
        )
          ? customer.rfp_categories
          : [];

      case "limited_opportunity":
        return [
          getBooleanValue(
            customer.limited_opportunity
          )
            ? "Yes"
            : "No",
        ];

      case "fellowship_opportunity":
        return [
          getBooleanValue(
            customer.fellowship_opportunity
          )
            ? "Yes"
            : "No",
        ];

      default:
        return [];
    }
  };

  const normalizeFilterValue = (
    value: string
  ) => {
    return value
      .trim()
      .toLowerCase();
  };

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    if (
      filter.values.length ===
      0
    ) {
      return true;
    }

    const customerValues =
      getFilterValues(
        customer,
        filter.field
      ).map(
        normalizeFilterValue
      );

    const selectedValues =
      filter.values.map(
        normalizeFilterValue
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

  const toggleAdvancedValue = (
    filterId: number,
    value: string
  ) => {
    setAdvancedFilters(
      (current) =>
        current.map(
          (filter) => {
            if (
              filter.id !==
              filterId
            ) {
              return filter;
            }

            const alreadySelected =
              filter.values.includes(
                value
              );

            return {
              ...filter,
              values:
                alreadySelected
                  ? filter.values.filter(
                      (
                        selectedValue
                      ) =>
                        selectedValue !==
                        value
                    )
                  : [
                      ...filter.values,
                      value,
                    ],
            };
          }
        )
    );
  };

  // --------------------------------------------------
  // Filtered Customers
  // --------------------------------------------------

  const filteredCustomers = useMemo(() => {
    let result =
      customers.filter(
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
            customer.maximum_grant
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
      quickCategories.length >
      0
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
      advancedFilters.length >
      0
    ) {
      result = result.filter(
        (customer) =>
          advancedFilters.every(
            (filter) =>
              matchesAdvancedFilter(
                customer,
                filter
              )
          )
      );
    }

    // Sort
    if (
      sortBy === "grantor"
    ) {
      result.sort((a, b) =>
        (
          a.grantor ?? ""
        ).localeCompare(
          b.grantor ?? ""
        )
      );
    }

    if (
      sortBy === "deadline"
    ) {
      result.sort(
        (a, b) =>
          new Date(
            a.deadline ||
              "9999-12-31"
          ).getTime() -
          new Date(
            b.deadline ||
              "9999-12-31"
          ).getTime()
      );
    }

    return result;
  }, [
    customers,
    search,
    sortBy,
    quickGrantors,
    quickMaximumGrants,
    quickDeadline,
    quickMonths,
    quickCategories,
    advancedFilters,
  ]);

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
  // Unique Category Colors
  // --------------------------------------------------

  const categoryColorPalette = [
    "bg-blue-100 text-blue-800 border-blue-300",
    "bg-purple-100 text-purple-800 border-purple-300",
    "bg-emerald-100 text-emerald-800 border-emerald-300",
    "bg-amber-100 text-amber-800 border-amber-300",
    "bg-rose-100 text-rose-800 border-rose-300",
    "bg-cyan-100 text-cyan-800 border-cyan-300",
    "bg-indigo-100 text-indigo-800 border-indigo-300",
    "bg-orange-100 text-orange-800 border-orange-300",
    "bg-teal-100 text-teal-800 border-teal-300",
    "bg-pink-100 text-pink-800 border-pink-300",
    "bg-lime-100 text-lime-800 border-lime-300",
    "bg-sky-100 text-sky-800 border-sky-300",
    "bg-violet-100 text-violet-800 border-violet-300",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    "bg-yellow-100 text-yellow-800 border-yellow-300",
    "bg-stone-100 text-stone-800 border-stone-300",
    "bg-slate-200 text-slate-800 border-slate-300",
    "bg-zinc-100 text-zinc-800 border-zinc-300",
    "bg-red-100 text-red-800 border-red-300",
    "bg-green-100 text-green-800 border-green-300",
  ];

  const categoryColorMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      availableCategories.forEach(
        (
          category,
          index
        ) => {
          map.set(
            category,
            categoryColorPalette[
              index %
                categoryColorPalette.length
            ]
          );
        }
      );

      return map;
    }, [
      availableCategories,
    ]);

  const getCategoryStyle = (
    category: string
  ) => {
    return (
      categoryColorMap.get(
        category
      ) ||
      "bg-slate-100 text-slate-700 border-slate-300"
    );
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
    };

    return (
      monthColors[
        normalizedMonth
      ] ||
      "bg-[#E1E3E5] text-[#555B60] border-[#C5C8CB]"
    );
  };

  // --------------------------------------------------
  // Filter Functions
  // --------------------------------------------------

  const clearQuickFilters = () => {
    setQuickGrantors([]);
    setQuickMaximumGrants([]);
    setQuickDeadline("all");
    setQuickMonths([]);
    setQuickCategories([]);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters([]);
  };

  const clearAllFilters = () => {
    clearQuickFilters();
    clearAdvancedFilters();
  };

  const addAdvancedFilter = () => {
    // Adding an advanced filter clears all quick filters
    clearQuickFilters();

    setShowQuickFilters(false);
    setShowAdvancedFilters(true);

    setAdvancedFilters(
      (current) => [
        ...current,
        {
          id: nextFilterId,
          field: "grantor",
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
    // Any advanced filter change clears quick filters
    clearQuickFilters();

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
  };

  const activateQuickFilter = () => {
    // Using quick filters clears advanced filters
    if (
      advancedFilters.length >
      0
    ) {
      setAdvancedFilters([]);
    }

    setShowAdvancedFilters(false);
    setShowQuickFilters(true);
  };

  const activeFilterCount =
    quickGrantors.length +
    quickMaximumGrants.length +
    (quickDeadline !== "all"
      ? 1
      : 0) +
    quickMonths.length +
    quickCategories.length +
    advancedFilters.reduce(
      (
        total,
        filter
      ) =>
        total +
        (filter.values.length >
        0
          ? 1
          : 0),
      0
    );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 py-2">
      <div className="max-w-[1800px] mx-auto">

        {/* Dashboard Header */}
        <div className="relative overflow-hidden bg-[#AFC4D4] rounded-2xl shadow-lg border border-[#9FB7C8] p-8 mb-6 text-slate-800">

          {/* Accent Line */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#7E9FB5] via-[#91AFC2] to-[#AFC4D4]" />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

            {/* Branding */}
            <div>
              <div className="h-14 w-48 mb-6 flex items-center">
                {/* Logo goes here */}
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-600 mb-2">
                Private Grant Funding
              </p>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Active RFP Opportunities
              </h1>

              <p className="mt-3 text-slate-700 max-w-2xl leading-6">
                Discover active funding opportunities and find
                grants that align with your organization's
                mission, priorities, and goals.
              </p>
            </div>

            {/* Active Count */}
            <div className="flex-shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-[#91AFC2] bg-white/50 px-7 py-5 min-w-[200px] shadow-sm">

                <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-white/30 -translate-y-8 translate-x-8" />

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
          <div className="mt-8 pt-6 border-t border-[#91AFC2]">

            <div className="flex flex-col xl:flex-row gap-3">

              {/* Search */}
              <div className="relative flex-1">

                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
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
                  className="w-full rounded-xl border border-[#91AFC2] bg-white/70 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-500 outline-none transition focus:border-[#6F91A8] focus:bg-white focus:ring-4 focus:ring-white/30"
                />
              </div>

              {/* Quick Filter Button */}
              <button
                type="button"
                onClick={() => {
                  if (
                    !showQuickFilters
                  ) {
                    activateQuickFilter();
                  } else {
                    setShowQuickFilters(
                      false
                    );
                  }
                }}
                className="rounded-xl border border-[#91AFC2] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
              >
                Quick Filter

                {activeFilterCount >
                  0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6F91A8] px-1.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Advanced Filter Button */}
              <div
                ref={
                  advancedFilterRef
                }
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !showAdvancedFilters
                    ) {
                      setAdvancedFilters(
                        []
                      );

                      clearQuickFilters();

                      setShowQuickFilters(
                        false
                      );

                      setShowAdvancedFilters(
                        true
                      );
                    } else {
                      setShowAdvancedFilters(
                        false
                      );
                    }
                  }}
                  className="rounded-xl border border-[#91AFC2] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
                >
                  Advanced Filters
                </button>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Sort by
                </span>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-[#91AFC2] bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6F91A8] focus:bg-white focus:ring-4 focus:ring-white/30"
                >
                  <option value="deadline">
                    Deadline
                  </option>

                  <option value="grantor">
                    Grantor A-Z
                  </option>
                </select>
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
                                toggleArrayValue(
                                  grantor,
                                  quickGrantors,
                                  setQuickGrantors
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
                        (maximumGrant) => (
                          <label
                            key={
                              maximumGrant
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={quickMaximumGrants.includes(
                                maximumGrant
                              )}
                              onChange={() => {
                                clearAdvancedFilters();

                                toggleArrayValue(
                                  maximumGrant,
                                  quickMaximumGrants,
                                  setQuickMaximumGrants
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {
                                maximumGrant
                              }
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
                      onChange={(e) => {
                        clearAdvancedFilters();

                        setQuickDeadline(
                          e.target.value
                        );
                      }}
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
                              onChange={() => {
                                clearAdvancedFilters();

                                toggleArrayValue(
                                  month,
                                  quickMonths,
                                  setQuickMonths
                                );
                              }}
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
                              onChange={() => {
                                clearAdvancedFilters();

                                toggleArrayValue(
                                  category,
                                  quickCategories,
                                  setQuickCategories
                                );
                              }}
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
                      clearAllFilters
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
              <div
                ref={
                  advancedFilterRef
                }
                className="mt-5 rounded-2xl border border-[#91AFC2] bg-white/70 p-6 shadow-sm"
              >

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Advanced Filters
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Build custom filters using
                      multiple values with
                      "is" or "is not."
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
                  <div className="mt-5 space-y-4">

                    {advancedFilters.map(
                      (
                        filter
                      ) => {
                        const options =
                          getAdvancedFilterOptions(
                            filter.field
                          );

                        return (
                          <div
                            key={
                              filter.id
                            }
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

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

                                  clearQuickFilters();

                                  updateAdvancedFilter(
                                    filter.id,
                                    {
                                      field,
                                      values:
                                        [],
                                    }
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
                                ) => {
                                  clearQuickFilters();

                                  updateAdvancedFilter(
                                    filter.id,
                                    {
                                      operator:
                                        e
                                          .target
                                          .value as FilterOperator,
                                    }
                                  );
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                              >
                                <option value="is">
                                  is
                                </option>

                                <option value="is_not">
                                  is not
                                </option>
                              </select>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() =>
                                  removeAdvancedFilter(
                                    filter.id
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700 lg:ml-auto"
                              >
                                Remove
                              </button>
                            </div>

                            {/* Multi-select Options */}
                            <div className="mt-4">

                              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Select{" "}
                                {getFilterLabel(
                                  filter.field
                                )}
                              </div>

                              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">

                                {options.length >
                                0 ? (
                                  <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">

                                    {options.map(
                                      (
                                        option
                                      ) => (
                                        <label
                                          key={
                                            option
                                          }
                                          className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              filter.values.includes(
                                                option
                                              )
                                            }
                                            onChange={() =>
                                              toggleAdvancedValue(
                                                filter.id,
                                                option
                                              )
                                            }
                                            className="h-4 w-4 rounded border-slate-300"
                                          />

                                          <span>
                                            {filter.field ===
                                              "deadline"
                                              ? new Date(
                                                  `${option}T00:00:00`
                                                ).toLocaleDateString(
                                                  "en-US",
                                                  {
                                                    year: "numeric",
                                                    month:
                                                      "short",
                                                    day: "numeric",
                                                  }
                                                )
                                              : option}
                                          </span>
                                        </label>
                                      )
                                    )}

                                  </div>
                                ) : (
                                  <div className="py-5 text-center text-sm text-slate-500">
                                    No options available.
                                  </div>
                                )}

                              </div>

                              {filter.values.length >
                                0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {filter.values.map(
                                    (
                                      value
                                    ) => (
                                      <span
                                        key={
                                          value
                                        }
                                        className="inline-flex items-center rounded-full border border-[#91AFC2] bg-[#E7EFF4] px-3 py-1.5 text-xs font-semibold text-slate-700"
                                      >
                                        {filter.field ===
                                        "deadline"
                                          ? new Date(
                                              `${value}T00:00:00`
                                            ).toLocaleDateString(
                                              "en-US",
                                              {
                                                year: "numeric",
                                                month:
                                                  "short",
                                                day: "numeric",
                                              }
                                            )
                                          : value}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleAdvancedValue(
                                              filter.id,
                                              value
                                            )
                                          }
                                          className="ml-2 text-slate-500 hover:text-slate-900"
                                          aria-label={`Remove ${value}`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    )
                                  )}
                                </div>
                              )}

                            </div>

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
            {activeFilterCount >
              0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">

                <span className="text-sm font-semibold text-slate-700">
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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Grantor:{" "}
                      {grantor} ×
                    </button>
                  )
                )}

                {quickMaximumGrants.map(
                  (
                    maximumGrant
                  ) => (
                    <button
                      key={`maximum-grant-${maximumGrant}`}
                      type="button"
                      onClick={() =>
                        toggleArrayValue(
                          maximumGrant,
                          quickMaximumGrants,
                          setQuickMaximumGrants
                        )
                      }
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Maximum Grant:{" "}
                      {maximumGrant} ×
                    </button>
                  )
                )}

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
                      Anticipated Deadline:{" "}
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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Category:{" "}
                      {category} ×
                    </button>
                  )
                )}

                {advancedFilters.map(
                  (filter) =>
                    filter.values.length >
                      0 && (
                      <button
                        key={`advanced-${filter.id}`}
                        type="button"
                        onClick={() =>
                          removeAdvancedFilter(
                            filter.id
                          )
                        }
                        className="rounded-full border border-[#91AFC2] bg-[#E7EFF4] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#DCE8EF]"
                      >
                        {getFilterLabel(
                          filter.field
                        )}{" "}
                        {filter.operator ===
                        "is"
                          ? "is"
                          : "is not"}{" "}
                        {filter.values.length >
                        1
                          ? `(${filter.values.length} selected)`
                          : filter.values[0]}{" "}
                        ×
                      </button>
                    )
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
              activeFilterCount >
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
        <div className="bg-white rounded-2xl shadow-lg border border-[#D5E0E7] overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              {/* Table Header */}
              <thead className="bg-[#AFC4D4] text-slate-800">

                <tr>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Grantor
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Opportunity
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Maximum Grant
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Deadline
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Anticipated Deadline Month
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Abstract
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                    Categories
                  </th>

                </tr>

              </thead>

              {/* Rows */}
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
                        <td className="p-5 align-top text-center">

                          <span className="font-semibold text-slate-800">
                            {customer.grantor ||
                              "-"}
                          </span>

                        </td>

                        {/* Opportunity */}
                        <td className="p-5 align-top">

                          <div className="font-semibold text-slate-900">
                            {customer.opportunity_name ||
                              "-"}
                          </div>

                        </td>

                        {/* Maximum Grant */}
                        <td className="p-5 align-top text-center">

                          <span className="inline-flex rounded-lg bg-slate-100 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
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
                                      month: "short",
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

                        {/* Anticipated Deadline Month */}
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
                        <td className="p-5 align-top">

                          <div className="max-w-sm mx-auto text-sm leading-6 text-slate-700 line-clamp-3">
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
                                      category
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
            <div className="py-20 px-6 text-center bg-slate-50">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-300 text-slate-400 shadow-sm">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7"
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