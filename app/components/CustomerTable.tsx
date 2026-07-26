"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const [quickCategories, setQuickCategories] =
    useState<string[]>([]);

  const [quickGrantors, setQuickGrantors] =
    useState<string[]>([]);

  const [quickMaximumGrants, setQuickMaximumGrants] =
    useState<string[]>([]);

  const [quickDeadline, setQuickDeadline] =
    useState("all");

  const [quickMonths, setQuickMonths] =
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
  // Advanced Filter Dropdown State
  // --------------------------------------------------

  const [openAdvancedDropdown, setOpenAdvancedDropdown] =
    useState<number | null>(null);

  const advancedDropdownRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Close Advanced Dropdown When Clicking Anywhere
  // Outside the Dropdown
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        advancedDropdownRef.current &&
        !advancedDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenAdvancedDropdown(null);
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

  // --------------------------------------------------
  // Maximum Grant Sorting
  // Largest to Smallest
  // --------------------------------------------------

  const getNumericGrantValue = (
    value: string | null | undefined
  ) => {
    if (!value) {
      return 0;
    }

    const numericValue =
      String(value)
        .replace(/[^0-9.-]/g, "");

    const parsed =
      Number(numericValue);

    return Number.isNaN(parsed)
      ? 0
      : parsed;
  };

  const availableMaximumGrants =
    useMemo(() => {
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
          getNumericGrantValue(b) -
          getNumericGrantValue(a)
      );
    }, [customers]);

  // --------------------------------------------------
  // Available Months
  // --------------------------------------------------

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

      return (
        monthOrder.indexOf(
          a.toLowerCase()
        ) -
        monthOrder.indexOf(
          b.toLowerCase()
        )
      );
    });
  }, [customers]);

  // --------------------------------------------------
  // Available Deadlines
  // --------------------------------------------------

  const availableDeadlines = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .map(
            (customer) =>
              customer.deadline
          )
          .filter(Boolean)
      )
    ).sort((a, b) => {
      return (
        new Date(
          `${a}T00:00:00`
        ).getTime() -
        new Date(
          `${b}T00:00:00`
        ).getTime()
      );
    });
  }, [customers]);

  // --------------------------------------------------
  // Limited Opportunity Options
  // --------------------------------------------------

  const availableLimitedOpportunity =
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

  // --------------------------------------------------
  // Fellowship Opportunity Options
  // --------------------------------------------------

  const availableFellowshipOpportunity =
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

  const clearQuickFilters = () => {
    setQuickCategories([]);
    setQuickGrantors([]);
    setQuickMaximumGrants([]);
    setQuickDeadline("all");
    setQuickMonths([]);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters([]);
    setOpenAdvancedDropdown(null);
  };

  const toggleArrayValue = (
    value: string,
    currentValues: string[],
    setter: React.Dispatch<
      React.SetStateAction<string[]>
    >
  ) => {
    // Any use of a Quick Filter clears Advanced Filters
    if (
      advancedFilters.length > 0
    ) {
      clearAdvancedFilters();
    }

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

  // --------------------------------------------------
  // Quick Deadline Filter
  // --------------------------------------------------

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
  // Advanced Filter Values
  // --------------------------------------------------

  const getAdvancedFilterValues = (
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
          ? [customer.maximum_grant]
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
        return customer.limited_opportunity
          ? [
              customer.limited_opportunity,
            ]
          : [];

      case "fellowship_opportunity":
        return customer.fellowship_opportunity
          ? [
              customer.fellowship_opportunity,
            ]
          : [];

      default:
        return [];
    }
  };

  // --------------------------------------------------
  // Advanced Filter Matching
  // --------------------------------------------------

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    // If no values have been selected,
    // do not filter the customer out.
    if (
      filter.values.length === 0
    ) {
      return true;
    }

    const customerValues =
      getAdvancedFilterValues(
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
  // Filtered Customers
  // --------------------------------------------------

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(
      (customer) =>
        customer.Category ===
        "active"
    );

    // --------------------------------------------------
    // Search
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Quick Category Filter
    // --------------------------------------------------

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
                    .toLowerCase() ===
                  selectedCategory.toLowerCase()
              )
          )
      );
    }

    // --------------------------------------------------
    // Quick Grantor Filter
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

    // --------------------------------------------------
    // Quick Maximum Grant Filter
    // --------------------------------------------------

    if (
      quickMaximumGrants.length > 0
    ) {
      result = result.filter(
        (customer) =>
          customer.maximum_grant &&
          quickMaximumGrants.includes(
            customer.maximum_grant
          )
      );
    }

    // --------------------------------------------------
    // Quick Deadline Filter
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Quick Month Filter
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Advanced Filters
    // --------------------------------------------------

    if (
      advancedFilters.length > 0
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

    // --------------------------------------------------
    // Sort
    // --------------------------------------------------

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
    quickCategories,
    quickGrantors,
    quickMaximumGrants,
    quickDeadline,
    quickMonths,
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
  // Category Colors
  // Each category receives a unique HSL color
  // based on its position in the complete category list.
  // --------------------------------------------------

  const categoryColorMap =
    useMemo(() => {
      const map: Record<
        string,
        string
      > = {};

      availableCategories.forEach(
        (category, index) => {
          const hue =
            Math.round(
              (index * 360) /
                Math.max(
                  availableCategories.length,
                  1
                )
            );

          map[category] =
            `hsl(${hue}, 70%, 92%)`;
        }
      );

      return map;
    }, [availableCategories]);

  const getCategoryStyle = (
    category: string
  ) => {
    const backgroundColor =
      categoryColorMap[
        category
      ] ||
      "hsl(210, 20%, 92%)";

    return {
      backgroundColor,
      color: "hsl(210, 25%, 30%)",
      borderColor:
        "hsl(210, 20%, 75%)",
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
    // Adding an Advanced Filter clears Quick Filters
    clearQuickFilters();

    setAdvancedFilters(
      (current) => [
        ...current,
        {
          id: nextFilterId,
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

    setOpenAdvancedDropdown(
      null
    );
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
                      (item) =>
                        item !== value
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

  const getAdvancedOptions = (
    field: FilterField
  ) => {
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
        return availableLimitedOpportunity;

      case "fellowship_opportunity":
        return availableFellowshipOpportunity;

      default:
        return [];
    }
  };

  const getAdvancedFieldLabel = (
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

  const clearAllFilters = () => {
    clearQuickFilters();
    clearAdvancedFilters();
  };

  const activeFilterCount =
    quickCategories.length +
    quickGrantors.length +
    quickMaximumGrants.length +
    (quickDeadline !== "all"
      ? 1
      : 0) +
    quickMonths.length +
    advancedFilters.reduce(
      (total, filter) =>
        total +
        filter.values.length,
      0
    );

  return (
    <div className="min-h-screen bg-slate-100 py-2">
      <div className="max-w-[1800px] mx-auto">

        {/* Dashboard Header */}
        <div className="relative overflow-hidden bg-[#AFC4D4] rounded-2xl shadow-lg border border-[#9FB7C8] p-8 mb-6 text-slate-800">

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
                onClick={() =>
                  setShowQuickFilters(
                    (current) =>
                      !current
                  )
                }
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
              </button>

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
                            key={grantor}
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
                        (grant) => (
                          <label
                            key={grant}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={quickMaximumGrants.includes(
                                grant
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  grant,
                                  quickMaximumGrants,
                                  setQuickMaximumGrants
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <span>
                              {grant}
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
                      value={quickDeadline}
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
                            key={month}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={quickMonths.includes(
                                month
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  month,
                                  quickMonths,
                                  setQuickMonths
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
                            key={category}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={quickCategories.includes(
                                category
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  category,
                                  quickCategories,
                                  setQuickCategories
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
              <div className="mt-5 rounded-2xl border border-[#91AFC2] bg-white/70 p-6 shadow-sm">

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Advanced Filters
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Create one or more rules to narrow down your opportunities.
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
                      Click "Add Filter" to create your first rule.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">

                    {advancedFilters.map(
                      (
                        filter
                      ) => (
                        <div
                          key={
                            filter.id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-start"
                        >

                          {/* Field */}
                          <select
                            value={
                              filter.field
                            }
                            onChange={(
                              e
                            ) => {
                              updateAdvancedFilter(
                                filter.id,
                                {
                                  field:
                                    e.target
                                      .value as FilterField,
                                  values:
                                    [],
                                }
                              );

                              setOpenAdvancedDropdown(
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
                              openAdvancedDropdown ===
                              filter.id
                                ? advancedDropdownRef
                                : null
                            }
                            className="relative flex-1"
                          >

                            <button
                              type="button"
                              onClick={() =>
                                setOpenAdvancedDropdown(
                                  (
                                    current
                                  ) =>
                                    current ===
                                    filter.id
                                      ? null
                                      : filter.id
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
                            >
                              {filter.values.length >
                              0
                                ? `${filter.values.length} selected`
                                : "Select options..."}
                            </button>

                            {openAdvancedDropdown ===
                              filter.id && (
                              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                                {getAdvancedOptions(
                                  filter.field
                                ).length ===
                                0 ? (
                                  <div className="px-3 py-3 text-sm text-slate-500">
                                    No options available.
                                  </div>
                                ) : (
                                  getAdvancedOptions(
                                    filter.field
                                  ).map(
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
                      )
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
                  (grant) => (
                    <button
                      key={`grant-${grant}`}
                      type="button"
                      onClick={() =>
                        toggleArrayValue(
                          grant,
                          quickMaximumGrants,
                          setQuickMaximumGrants
                        )
                      }
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Maximum Grant:{" "}
                      {grant} ×
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
                        {getAdvancedFieldLabel(
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
                                ) => {

                                  const categoryStyle =
                                    getCategoryStyle(
                                      category
                                    );

                                  return (
                                    <span
                                      key={
                                        category
                                      }
                                      style={{
                                        backgroundColor:
                                          categoryStyle.backgroundColor,
                                        color:
                                          categoryStyle.color,
                                        borderColor:
                                          categoryStyle.borderColor,
                                      }}
                                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                                    >
                                      {
                                        category
                                      }
                                    </span>
                                  );
                                }
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