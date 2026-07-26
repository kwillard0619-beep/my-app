"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

type QuickDeadline =
  | "all"
  | "within7"
  | "within30"
  | "within31to90"
  | "over90"
  | "none";

type FilterField =
  | "grantor"
  | "maximum_grant"
  | "anticipated_deadline"
  | "rfp_categories"
  | "limited_opportunity"
  | "fellowship_opportunity";

type FilterOperator = "AND" | "OR" | "AND NOT";

type AdvancedFilter = {
  id: number;
  operator: FilterOperator;
  field: FilterField;
  values: string[];
};

type QuickFilterPanel =
  | "categories"
  | "grantors"
  | "deadline"
  | "months"
  | null;

export default function CustomerTable({
  customers,
  activeCount,
}: {
  customers: Customer[];
  activeCount: number;
}) {
  // --------------------------------------------------
  // Drawer / Realtime
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
  // Search + Sort
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  // --------------------------------------------------
  // Quick Filter State
  // --------------------------------------------------

  const [showQuickFilters, setShowQuickFilters] =
    useState(false);

  const [quickFilterPanel, setQuickFilterPanel] =
    useState<QuickFilterPanel>(null);

  const [quickCategories, setQuickCategories] =
    useState<string[]>([]);

  const [quickGrantors, setQuickGrantors] =
    useState<string[]>([]);

  const [quickDeadline, setQuickDeadline] =
    useState<QuickDeadline>("all");

  const [quickMonths, setQuickMonths] =
    useState<string[]>([]);

  const quickFilterRef =
    useRef<HTMLDivElement | null>(null);

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
  // Close Filters When Clicking Outside
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        quickFilterRef.current &&
        !quickFilterRef.current.contains(target)
      ) {
        setShowQuickFilters(false);
        setQuickFilterPanel(null);
      }

      if (
        advancedFilterRef.current &&
        !advancedFilterRef.current.contains(target)
      ) {
        setShowAdvancedFilters(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // --------------------------------------------------
  // Active Customers
  // --------------------------------------------------

  const activeCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.Category === "active"
    );
  }, [customers]);

  // --------------------------------------------------
  // Quick Filter Options
  // --------------------------------------------------

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        activeCustomers
          .flatMap(
            (customer) =>
              Array.isArray(
                customer.rfp_categories
              )
                ? customer.rfp_categories
                : []
          )
          .map((category) =>
            String(category).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [activeCustomers]);

  const availableGrantors = useMemo(() => {
    return Array.from(
      new Set(
        activeCustomers
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
  }, [activeCustomers]);

  const availableMonths = useMemo(() => {
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

    return Array.from(
      new Set(
        activeCustomers
          .map((customer) =>
            String(
              customer.anticipated_deadline ??
                ""
            ).trim()
          )
          .filter(Boolean)
      )
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
  }, [activeCustomers]);

  // --------------------------------------------------
  // Advanced Filter Fields
  // --------------------------------------------------

  const advancedFilterFields: {
    value: FilterField;
    label: string;
  }[] = [
    {
      value: "grantor",
      label: "Grantor",
    },
    {
      value: "maximum_grant",
      label: "Maximum Grant",
    },
    {
      value:
        "anticipated_deadline",
      label:
        "Anticipated Deadline",
    },
    {
      value: "rfp_categories",
      label: "Categories",
    },
    {
      value:
        "limited_opportunity",
      label:
        "Limited Opportunity",
    },
    {
      value:
        "fellowship_opportunity",
      label:
        "Fellowship Opportunity",
    },
  ];

  // --------------------------------------------------
  // Advanced Filter Options
  // --------------------------------------------------

  const getAdvancedFilterOptions = (
    field: FilterField
  ) => {
    if (field === "grantor") {
      return availableGrantors;
    }

    if (
      field === "maximum_grant"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                String(
                  customer.maximum_grant ??
                    ""
                ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }

    if (
      field ===
      "anticipated_deadline"
    ) {
      return availableMonths;
    }

    if (
      field ===
      "rfp_categories"
    ) {
      return availableCategories;
    }

    if (
      field ===
      "limited_opportunity"
    ) {
      return ["Yes", "No"];
    }

    if (
      field ===
      "fellowship_opportunity"
    ) {
      return ["Yes", "No"];
    }

    return [];
  };

  // --------------------------------------------------
  // Advanced Filter Helpers
  // --------------------------------------------------

  const getCustomerFieldValues = (
    customer: Customer,
    field: FilterField
  ): string[] => {
    if (field === "grantor") {
      return customer.grantor
        ? [customer.grantor]
        : [];
    }

    if (
      field ===
      "maximum_grant"
    ) {
      return customer.maximum_grant
        ? [customer.maximum_grant]
        : [];
    }

    if (
      field ===
      "anticipated_deadline"
    ) {
      return customer.anticipated_deadline
        ? [
            customer.anticipated_deadline,
          ]
        : [];
    }

    if (
      field ===
      "rfp_categories"
    ) {
      return (
        customer.rfp_categories ?? []
      );
    }

    if (
      field ===
      "limited_opportunity"
    ) {
      if (
        customer.limited_opportunity ===
        null ||
        customer.limited_opportunity ===
        undefined
      ) {
        return [];
      }

      return [
        String(
          customer.limited_opportunity
        ),
      ];
    }

    if (
      field ===
      "fellowship_opportunity"
    ) {
      if (
        customer.fellowship_opportunity ===
        null ||
        customer.fellowship_opportunity ===
        undefined
      ) {
        return [];
      }

      return [
        String(
          customer.fellowship_opportunity
        ),
      ];
    }

    return [];
  };

  // --------------------------------------------------
  // Quick Deadline Matching
  // --------------------------------------------------

  const matchesQuickDeadline = (
    deadline: string | null,
    filter: QuickDeadline
  ) => {
    if (filter === "all") {
      return true;
    }

    if (filter === "none") {
      return !deadline;
    }

    if (!deadline) {
      return false;
    }

    const deadlineDate =
      new Date(
        `${deadline}T00:00:00`
      );

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    const daysUntil = Math.ceil(
      difference /
        (1000 *
          60 *
          60 *
          24)
    );

    if (
      filter === "within7"
    ) {
      return (
        daysUntil >= 0 &&
        daysUntil <= 7
      );
    }

    if (
      filter === "within30"
    ) {
      return (
        daysUntil >= 0 &&
        daysUntil <= 30
      );
    }

    if (
      filter ===
      "within31to90"
    ) {
      return (
        daysUntil > 30 &&
        daysUntil <= 90
      );
    }

    if (
      filter === "over90"
    ) {
      return daysUntil > 90;
    }

    return true;
  };

  // --------------------------------------------------
  // Advanced Filter Matching
  // --------------------------------------------------

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    const customerValues =
      getCustomerFieldValues(
        customer,
        filter.field
      );

    const matches =
      filter.values.length === 0 ||
      filter.values.some(
        (value) =>
          customerValues.some(
            (customerValue) =>
              String(
                customerValue
              ).toLowerCase() ===
              String(
                value
              ).toLowerCase()
          )
      );

    if (
      filter.operator ===
      "AND NOT"
    ) {
      return !matches;
    }

    return matches;
  };

  // --------------------------------------------------
  // Filtered Customers
  // --------------------------------------------------

  const filteredCustomers =
    useMemo(() => {
      let result =
        activeCustomers;

      // ------------------------------
      // Search
      // ------------------------------

      if (search.trim()) {
        const searchTerm =
          search
            .trim()
            .toLowerCase();

        result =
          result.filter(
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
                ...(
                  customer.rfp_categories ??
                  []
                ),
              ];

              return searchableFields.some(
                (value) =>
                  String(
                    value ?? ""
                  )
                    .toLowerCase()
                    .includes(
                      searchTerm
                    )
              );
            }
          );
      }

      // ------------------------------
      // Quick Categories
      // ------------------------------

      if (
        quickCategories.length >
        0
      ) {
        result =
          result.filter(
            (customer) =>
              Array.isArray(
                customer.rfp_categories
              ) &&
              quickCategories.some(
                (selectedCategory) =>
                  customer.rfp_categories?.some(
                    (category) =>
                      category
                        .toLowerCase() ===
                      selectedCategory
                        .toLowerCase()
                  )
              )
          );
      }

      // ------------------------------
      // Quick Grantors
      // ------------------------------

      if (
        quickGrantors.length >
        0
      ) {
        result =
          result.filter(
            (customer) =>
              customer.grantor &&
              quickGrantors.includes(
                customer.grantor
              )
          );
      }

      // ------------------------------
      // Quick Deadline
      // ------------------------------

      if (
        quickDeadline !== "all"
      ) {
        result =
          result.filter(
            (customer) =>
              matchesQuickDeadline(
                customer.deadline,
                quickDeadline
              )
          );
      }

      // ------------------------------
      // Quick Anticipated Deadline
      // ------------------------------

      if (
        quickMonths.length >
        0
      ) {
        result =
          result.filter(
            (customer) =>
              customer.anticipated_deadline &&
              quickMonths.some(
                (month) =>
                  month.toLowerCase() ===
                  customer
                    .anticipated_deadline
                    ?.toLowerCase()
              )
          );
      }

      // ------------------------------
      // Advanced Filters
      // ------------------------------

      if (
        advancedFilters.length >
        0
      ) {
        const filtersWithValues =
          advancedFilters.filter(
            (filter) =>
              filter.values.length >
              0
          );

        if (
          filtersWithValues.length >
          0
        ) {
          const firstFilter =
            filtersWithValues[0];

          result =
            result.filter(
              (customer) => {
                let matchesResult =
                  matchesAdvancedFilter(
                    customer,
                    firstFilter
                  );

                for (
                  let i = 1;
                  i <
                  filtersWithValues.length;
                  i++
                ) {
                  const filter =
                    filtersWithValues[
                      i
                    ];

                  const currentMatch =
                    matchesAdvancedFilter(
                      customer,
                      filter
                    );

                  if (
                    filter.operator ===
                    "AND"
                  ) {
                    matchesResult =
                      matchesResult &&
                      currentMatch;
                  }

                  if (
                    filter.operator ===
                    "AND NOT"
                  ) {
                    matchesResult =
                      matchesResult &&
                      currentMatch;
                  }

                  if (
                    filter.operator ===
                    "OR"
                  ) {
                    matchesResult =
                      matchesResult ||
                      currentMatch;
                  }
                }

                return matchesResult;
              }
            );
        }
      }

      // ------------------------------
      // Sort
      // ------------------------------

      if (
        sortBy === "grantor"
      ) {
        result.sort(
          (a, b) =>
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
      activeCustomers,
      search,
      sortBy,
      quickCategories,
      quickGrantors,
      quickDeadline,
      quickMonths,
      advancedFilters,
    ]);

  // --------------------------------------------------
  // Advanced Filter Functions
  // --------------------------------------------------

  const addAdvancedFilter = () => {
    setAdvancedFilters(
      (current) => [
        ...current,
        {
          id: nextFilterId,
          operator:
            current.length === 0
              ? "AND"
              : "AND",
          field: "grantor",
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
  };

  const clearAllFilters = () => {
    setQuickCategories([]);
    setQuickGrantors([]);
    setQuickDeadline("all");
    setQuickMonths([]);
    setAdvancedFilters([]);
  };

  const activeFilterCount =
    quickCategories.length +
    quickGrantors.length +
    (quickDeadline !== "all"
      ? 1
      : 0) +
    quickMonths.length +
    advancedFilters.filter(
      (filter) =>
        filter.values.length >
        0
    ).length;

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

    const deadlineDate =
      new Date(
        `${deadline}T00:00:00`
      );

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    const daysUntil = Math.ceil(
      difference /
        (1000 *
          60 *
          60 *
          24)
    );

    if (daysUntil < 0) {
      return {
        container:
          "bg-slate-100 text-slate-600 border-slate-300",
      };
    }

    if (daysUntil === 0) {
      return {
        container:
          "bg-red-100 text-red-800 border-red-300",
      };
    }

    if (daysUntil <= 30) {
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
  // Category Colors
  // --------------------------------------------------

  const getCategoryStyle = (
    category: string
  ) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-emerald-100 text-emerald-800 border-emerald-300",
      "bg-amber-100 text-amber-800 border-amber-300",
      "bg-rose-100 text-rose-800 border-rose-300",
      "bg-cyan-100 text-cyan-800 border-cyan-300",
      "bg-indigo-100 text-indigo-800 border-indigo-300",
      "bg-orange-100 text-orange-800 border-orange-300",
    ];

    let hash = 0;

    for (
      let i = 0;
      i < category.length;
      i++
    ) {
      hash =
        category.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    const index =
      Math.abs(hash) %
      colors.length;

    return colors[index];
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

          {/* Search / Filter / Sort */}
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

              {/* Quick Filter */}
              <div
                ref={quickFilterRef}
                className="relative w-full xl:w-[180px]"
              >

                <button
                  type="button"
                  onClick={() => {
                    setShowQuickFilters(
                      (open) => !open
                    );

                    if (
                      showQuickFilters
                    ) {
                      setQuickFilterPanel(
                        null
                      );
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-white/30 ${
                    showQuickFilters ||
                    quickCategories.length >
                      0 ||
                    quickGrantors.length >
                      0 ||
                    quickDeadline !==
                      "all" ||
                    quickMonths.length >
                      0
                      ? "border-[#6F91A8] bg-white text-[#31566B]"
                      : "border-[#91AFC2] bg-white/70 text-slate-800 hover:bg-white"
                  }`}
                >
                  <span>
                    Quick Filter
                  </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className={`h-4 w-4 transition-transform ${
                      showQuickFilters
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </button>

                {showQuickFilters && (
                  <div className="relative z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">

                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Quick Filter
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Choose one or more filter categories.
                        </p>
                      </div>

                      {activeFilterCount >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            clearAllFilters
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-red-600"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Quick Filter Buttons */}
                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          setQuickFilterPanel(
                            "categories"
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                          quickFilterPanel ===
                          "categories"
                            ? "border-[#6F91A8] bg-[#D9E8F0] text-[#31566B]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          Categories
                        </div>

                        {quickCategories.length >
                          0 && (
                          <div className="mt-1 text-[11px] font-medium opacity-70">
                            {
                              quickCategories.length
                            }{" "}
                            selected
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setQuickFilterPanel(
                            "grantors"
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                          quickFilterPanel ===
                          "grantors"
                            ? "border-[#6F91A8] bg-[#D9E8F0] text-[#31566B]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          Grantors
                        </div>

                        {quickGrantors.length >
                          0 && (
                          <div className="mt-1 text-[11px] font-medium opacity-70">
                            {
                              quickGrantors.length
                            }{" "}
                            selected
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setQuickFilterPanel(
                            "deadline"
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                          quickFilterPanel ===
                          "deadline"
                            ? "border-[#6F91A8] bg-[#D9E8F0] text-[#31566B]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          Deadline
                        </div>

                        {quickDeadline !==
                          "all" && (
                          <div className="mt-1 text-[11px] font-medium opacity-70">
                            Active
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setQuickFilterPanel(
                            "months"
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                          quickFilterPanel ===
                          "months"
                            ? "border-[#6F91A8] bg-[#D9E8F0] text-[#31566B]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          Anticipated Deadline
                        </div>

                        {quickMonths.length >
                          0 && (
                          <div className="mt-1 text-[11px] font-medium opacity-70">
                            {
                              quickMonths.length
                            }{" "}
                            selected
                          </div>
                        )}
                      </button>

                    </div>

                    {/* Categories */}
                    {quickFilterPanel ===
                      "categories" && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Categories
                          </p>

                          {quickCategories.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setQuickCategories(
                                  []
                                )
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-red-600"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">

                          {availableCategories.map(
                            (option) => (
                              <label
                                key={
                                  option
                                }
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={quickCategories.includes(
                                    option
                                  )}
                                  onChange={() =>
                                    setQuickCategories(
                                      (
                                        current
                                      ) =>
                                        current.includes(
                                          option
                                        )
                                          ? current.filter(
                                              (
                                                value
                                              ) =>
                                                value !==
                                                option
                                            )
                                          : [
                                              ...current,
                                              option,
                                            ]
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                />

                                <span>
                                  {
                                    option
                                  }
                                </span>
                              </label>
                            )
                          )}

                        </div>
                      </div>
                    )}

                    {/* Grantors */}
                    {quickFilterPanel ===
                      "grantors" && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Grantors
                          </p>

                          {quickGrantors.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setQuickGrantors(
                                  []
                                )
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-red-600"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">

                          {availableGrantors.map(
                            (option) => (
                              <label
                                key={
                                  option
                                }
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={quickGrantors.includes(
                                    option
                                  )}
                                  onChange={() =>
                                    setQuickGrantors(
                                      (
                                        current
                                      ) =>
                                        current.includes(
                                          option
                                        )
                                          ? current.filter(
                                              (
                                                value
                                              ) =>
                                                value !==
                                                option
                                            )
                                          : [
                                              ...current,
                                              option,
                                            ]
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                />

                                <span>
                                  {
                                    option
                                  }
                                </span>
                              </label>
                            )
                          )}

                        </div>
                      </div>
                    )}

                    {/* Deadline */}
                    {quickFilterPanel ===
                      "deadline" && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Deadline
                          </p>

                          {quickDeadline !==
                            "all" && (
                            <button
                              type="button"
                              onClick={() =>
                                setQuickDeadline(
                                  "all"
                                )
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-red-600"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">

                          {[
                            {
                              value:
                                "within7" as QuickDeadline,
                              label:
                                "Due within 7 days",
                            },
                            {
                              value:
                                "within30" as QuickDeadline,
                              label:
                                "Due within 30 days",
                            },
                            {
                              value:
                                "within31to90" as QuickDeadline,
                              label:
                                "Due in 31–90 days",
                            },
                            {
                              value:
                                "over90" as QuickDeadline,
                              label:
                                "Due in 90+ days",
                            },
                            {
                              value:
                                "none" as QuickDeadline,
                              label:
                                "No deadline listed",
                            },
                          ].map(
                            (option) => (
                              <label
                                key={
                                  option.value
                                }
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white"
                              >
                                <input
                                  type="radio"
                                  name="quick-deadline"
                                  checked={
                                    quickDeadline ===
                                    option.value
                                  }
                                  onChange={() =>
                                    setQuickDeadline(
                                      option.value
                                    )
                                  }
                                  className="h-4 w-4 border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                />

                                <span>
                                  {
                                    option.label
                                  }
                                </span>
                              </label>
                            )
                          )}

                        </div>
                      </div>
                    )}

                    {/* Anticipated Deadline */}
                    {quickFilterPanel ===
                      "months" && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Anticipated Deadline
                          </p>

                          {quickMonths.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setQuickMonths(
                                  []
                                )
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-red-600"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">

                          {availableMonths.map(
                            (option) => (
                              <label
                                key={
                                  option
                                }
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={quickMonths.includes(
                                    option
                                  )}
                                  onChange={() =>
                                    setQuickMonths(
                                      (
                                        current
                                      ) =>
                                        current.includes(
                                          option
                                        )
                                          ? current.filter(
                                              (
                                                value
                                              ) =>
                                                value !==
                                                option
                                            )
                                          : [
                                              ...current,
                                              option,
                                            ]
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                />

                                <span>
                                  {
                                    option
                                  }
                                </span>
                              </label>
                            )
                          )}

                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Advanced Filter */}
              <div
                ref={advancedFilterRef}
                className="relative w-full xl:w-[200px]"
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowAdvancedFilters(
                      (open) =>
                        !open
                    )
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-white/30 ${
                    showAdvancedFilters ||
                    advancedFilters.length >
                      0
                      ? "border-[#6F91A8] bg-white text-[#31566B]"
                      : "border-[#91AFC2] bg-white/70 text-slate-800 hover:bg-white"
                  }`}
                >
                  <span>
                    Advanced Filter
                  </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className={`h-4 w-4 transition-transform ${
                      showAdvancedFilters
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </button>

                {showAdvancedFilters && (
                  <div className="relative z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">

                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Advanced Filter
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Build detailed filters using AND, OR, and AND NOT.
                        </p>
                      </div>

                      {advancedFilters.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAdvancedFilters(
                              []
                            )
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {advancedFilters.map(
                      (
                        filter,
                        index
                      ) => (
                        <div
                          key={
                            filter.id
                          }
                          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >

                          {/* Connector */}
                          <div className="mb-3 flex items-center justify-between">

                            {index ===
                            0 ? (
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Filter 1
                              </span>
                            ) : (
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
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                              >
                                <option value="AND">
                                  AND
                                </option>

                                <option value="OR">
                                  OR
                                </option>

                                <option value="AND NOT">
                                  AND NOT
                                </option>
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                removeAdvancedFilter(
                                  filter.id
                                )
                              }
                              className="text-xs font-semibold text-slate-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Field */}
                          <select
                            value={
                              filter.field
                            }
                            onChange={(
                              e
                            ) =>
                              updateAdvancedFilter(
                                filter.id,
                                {
                                  field:
                                    e
                                      .target
                                      .value as FilterField,
                                  values:
                                    [],
                                }
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {advancedFilterFields.map(
                              (
                                field
                              ) => (
                                <option
                                  key={
                                    field.value
                                  }
                                  value={
                                    field.value
                                  }
                                >
                                  {
                                    field.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          {/* Values */}
                          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">

                            {getAdvancedFilterOptions(
                              filter.field
                            ).map(
                              (
                                option
                              ) => (
                                <label
                                  key={
                                    option
                                  }
                                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={filter.values.includes(
                                      option
                                    )}
                                    onChange={() => {
                                      const nextValues =
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
                                            nextValues,
                                        }
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                  />

                                  <span>
                                    {
                                      option
                                    }
                                  </span>
                                </label>
                              )
                            )}

                          </div>

                          {filter.values.length >
                            0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {filter.values.map(
                                (
                                  value
                                ) => (
                                  <span
                                    key={
                                      value
                                    }
                                    className="rounded-full bg-[#D9E8F0] px-2 py-1 text-[11px] font-semibold text-[#31566B]"
                                  >
                                    {
                                      value
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          )}

                        </div>
                      )
                    )}

                    <button
                      type="button"
                      onClick={
                        addAdvancedFilter
                      }
                      className="w-full rounded-xl border border-dashed border-[#91AFC2] bg-[#F2F7FA] px-4 py-2.5 text-sm font-semibold text-[#496A7E] transition hover:bg-[#E8F1F5]"
                    >
                      + Add Filter
                    </button>

                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Sort by
                </span>

                <select
                  value={
                    sortBy
                  }
                  onChange={(
                    e
                  ) =>
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

            {/* Active Filter Summary */}
            {(search.trim() ||
              activeFilterCount >
                0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-700">

                <span className="inline-block h-2 w-2 rounded-full bg-[#6F91A8]" />

                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {
                    filteredCustomers.length
                  }
                </span>{" "}
                matching opportunities

                {activeFilterCount >
                  0 && (
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-600">
                    {
                      activeFilterCount
                    }{" "}
                    filter
                    {activeFilterCount ===
                    1
                      ? ""
                      : "s"}{" "}
                    active
                  </span>
                )}

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
                            {
                              customer.grantor ||
                              "-"
                            }
                          </span>

                        </td>

                        {/* Opportunity */}
                        <td className="p-5 align-top">

                          <div className="font-semibold text-slate-900">
                            {
                              customer.opportunity_name ||
                              "-"
                            }
                          </div>

                        </td>

                        {/* Maximum Grant */}
                        <td className="p-5 align-top text-center">

                          <span className="inline-flex rounded-lg bg-slate-100 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                            {
                              customer.maximum_grant ||
                              "Not specified"
                            }
                          </span>

                        </td>

                        {/* Deadline */}
                        <td className="p-5 align-top">

                          <div className="flex flex-col items-center gap-2">

                            {customer.deadline ? (
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
                            {
                              customer.abstract ||
                              "No abstract provided."
                            }
                          </div>

                        </td>

                        {/* Categories */}
                        <td className="p-5 align-top">

                          <div className="flex flex-wrap justify-center gap-2">

                            {Array.isArray(
                              customer.rfp_categories
                            ) &&
                            customer
                              .rfp_categories
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
                Try adjusting your search to find
                matching funding opportunities.
              </p>

            </div>
          )}

        </div>

        {/* Realtime-Synchronized Drawer */}
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