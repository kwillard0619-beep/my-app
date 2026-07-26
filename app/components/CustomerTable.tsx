"use client";

import { useMemo, useState } from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

type FilterField =
  | "category"
  | "grantor"
  | "deadline"
  | "anticipated_deadline";

type FilterOperator = "is" | "is_not";

type FilterConnector = "AND" | "OR" | "AND NOT";

type AdvancedFilter = {
  id: number;
  connector: FilterConnector;
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

export default function CustomerTable({
  customers,
  activeCount,
}: {
  customers: Customer[];
  activeCount: number;
}) {
  // --------------------------------------------------
  // Selected Customer / Drawer
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
          String(customer.id) === selectedCustomerId
      ) ?? null
    );
  }, [customers, selectedCustomerId]);

  // --------------------------------------------------
  // Search / Sort
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
  // Dynamic Filter Options
  // --------------------------------------------------

  const availableCategories = useMemo(() => {
    const categories = customers.flatMap((customer) =>
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

  const availableMonths = useMemo(() => {
    const months = customers
      .map((customer) =>
        String(
          customer.anticipated_deadline ?? ""
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
    ];

    return Array.from(
      new Set(months)
    ).sort((a, b) => {
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
    if (quickDeadline === "all") {
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

    if (quickDeadline === "30") {
      return daysUntil <= 30;
    }

    if (quickDeadline === "60") {
      return daysUntil <= 60;
    }

    if (quickDeadline === "90") {
      return daysUntil <= 90;
    }

    return true;
  };

  // --------------------------------------------------
  // Advanced Filter Helpers
  // --------------------------------------------------

  const getFilterValue = (
    customer: Customer,
    field: FilterField
  ): string[] => {
    switch (field) {
      case "category":
        return Array.isArray(
          customer.rfp_categories
        )
          ? customer.rfp_categories
          : [];

      case "grantor":
        return customer.grantor
          ? [customer.grantor]
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

      default:
        return [];
    }
  };

  const matchesAdvancedFilter = (
    customer: Customer,
    filter: AdvancedFilter
  ) => {
    const values = getFilterValue(
      customer,
      filter.field
    );

    const normalizedFilterValue =
      filter.value
        .trim()
        .toLowerCase();

    const hasMatch = values.some(
      (value) =>
        String(value)
          .trim()
          .toLowerCase() ===
        normalizedFilterValue
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
  // Filter Customers
  // --------------------------------------------------

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(
      (customer) =>
        customer.Category === "active"
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
                .includes(searchTerm)
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
    // Quick Anticipated Deadline Month Filter
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
        (customer) => {
          let matches =
            matchesAdvancedFilter(
              customer,
              advancedFilters[0]
            );

          for (
            let i = 1;
            i <
            advancedFilters.length;
            i++
          ) {
            const filter =
              advancedFilters[i];

            const currentMatch =
              matchesAdvancedFilter(
                customer,
                filter
              );

            if (
              filter.connector ===
              "AND"
            ) {
              matches =
                matches &&
                currentMatch;
            }

            if (
              filter.connector ===
              "OR"
            ) {
              matches =
                matches ||
                currentMatch;
            }

            if (
              filter.connector ===
              "AND NOT"
            ) {
              matches =
                matches &&
                !currentMatch;
            }
          }

          return matches;
        }
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
        "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  };

  // --------------------------------------------------
  // Category Colors
  // --------------------------------------------------

  const getCategoryStyle = (
    category: string
  ) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-emerald-100 text-emerald-800 border-emerald-200",
      "bg-amber-100 text-amber-800 border-amber-200",
      "bg-rose-100 text-rose-800 border-rose-200",
      "bg-cyan-100 text-cyan-800 border-cyan-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
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
        "bg-[#E8E0D4] text-[#665B4E] border-[#D4C8B8]",
      february:
        "bg-[#E5DDE7] text-[#65566B] border-[#D0C4D4]",
      march:
        "bg-[#DDE7DF] text-[#536556] border-[#C5D5C8]",
      april:
        "bg-[#E1E8DD] text-[#586653] border-[#C8D3C4]",
      may:
        "bg-[#E5E0D6] text-[#665F50] border-[#D3CABB]",
      june:
        "bg-[#E7DFD4] text-[#665A4A] border-[#D2C6B5]",
      july:
        "bg-[#E7DCD8] text-[#69544D] border-[#D3C3BC]",
      august:
        "bg-[#DDDCE8] text-[#57546A] border-[#C6C4D7]",
      september:
        "bg-[#E4DED4] text-[#655C4D] border-[#D0C7B8]",
      october:
        "bg-[#E8DDD4] text-[#69574A] border-[#D6C5B7]",
      november:
        "bg-[#DEDCD5] text-[#5F5C50] border-[#C9C6BA]",
      december:
        "bg-[#DDE4E7] text-[#536169] border-[#C5D0D5]",
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
    const defaultField: FilterField =
      "category";

    setAdvancedFilters(
      (current) => [
        ...current,
        {
          id: nextFilterId,

          connector:
            current.length === 0
              ? "AND"
              : "AND",

          field: defaultField,

          operator: "is",

          value:
            availableCategories[0] ??
            "",
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

  // --------------------------------------------------
  // Clear Filters
  // --------------------------------------------------

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
    advancedFilters.length;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 py-2">
      <div className="mx-auto max-w-[1800px]">

        {/* --------------------------------------------------
            Header / Hero
        -------------------------------------------------- */}

        <div className="rounded-2xl border border-[#91AFC2] bg-[#B7CEDD] p-6 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">
                Private Grant Funding
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Active RFP Opportunities
              </h1>

              <p className="mt-3 max-w-2xl leading-6 text-slate-700">
                Discover active funding opportunities
                and find grants that align with your
                organization's mission, priorities,
                and goals.
              </p>

            </div>

            <div className="rounded-2xl border border-[#91AFC2] bg-white/50 px-8 py-5 text-center">

              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Active RFPs
              </div>

              <div className="mt-1 text-4xl font-bold text-slate-900">
                {activeCount}
              </div>

            </div>

          </div>


          {/* --------------------------------------------------
              Search / Filter Controls
          -------------------------------------------------- */}

          <div className="mt-8 border-t border-[#91AFC2] pt-6">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* Search */}

              <div className="relative flex-1">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">

                  <svg
                    className="h-5 w-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
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
                  className="w-full rounded-xl border border-[#91AFC2] bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#6F91A8] focus:bg-white focus:ring-4 focus:ring-white/30"
                />

              </div>


              {/* Quick Filter Button */}

              <button
                type="button"
                onClick={() => {
                  setShowQuickFilters(
                    (current) =>
                      !current
                  );

                  if (
                    !showQuickFilters
                  ) {
                    setShowAdvancedFilters(
                      false
                    );
                  }
                }}
                className={`rounded-xl border border-[#91AFC2] px-5 py-3 text-sm font-semibold text-slate-800 transition ${
                  showQuickFilters
                    ? "bg-white shadow-sm"
                    : "bg-white/70 hover:bg-white"
                }`}
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
                onClick={() => {
                  setShowAdvancedFilters(
                    (current) =>
                      !current
                  );

                  if (
                    !showAdvancedFilters
                  ) {
                    setShowQuickFilters(
                      false
                    );
                  }
                }}
                className={`rounded-xl border border-[#91AFC2] px-5 py-3 text-sm font-semibold text-slate-800 transition ${
                  showAdvancedFilters
                    ? "bg-white shadow-sm"
                    : "bg-white/70 hover:bg-white"
                }`}
              >

                Advanced Filters

                {advancedFilters.length >
                  0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6F91A8] px-1.5 text-xs text-white">
                    {advancedFilters.length}
                  </span>
                )}

              </button>


              {/* Sort */}

              <div className="flex items-center gap-3">

                <span className="whitespace-nowrap text-sm font-medium text-slate-700">
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
                    Grantor
                  </option>

                </select>

              </div>

            </div>


            {/* ==================================================
                QUICK FILTER PANEL
            ================================================== */}

            {showQuickFilters && (
              <div className="mt-5 rounded-2xl border border-[#91AFC2] bg-[#E7EFF4] p-6 shadow-sm">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">

                  {/* Category */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Category
                    </label>

                    <div className="mt-4 h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      <div className="space-y-1">

                        {availableCategories.map(
                          (category) => (
                            <label
                              key={category}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#173B63] transition hover:bg-slate-50"
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
                                className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                              />

                              <span>
                                {category}
                              </span>

                            </label>
                          )
                        )}

                        {availableCategories.length ===
                          0 && (
                          <p className="px-2 py-2 text-sm text-slate-500">
                            No categories available
                          </p>
                        )}

                      </div>

                    </div>

                  </div>


                  {/* Grantor */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Grantor
                    </label>

                    <div className="mt-4 h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      <div className="space-y-1">

                        {availableGrantors.map(
                          (grantor) => (
                            <label
                              key={grantor}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#173B63] transition hover:bg-slate-50"
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
                                className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                              />

                              <span>
                                {grantor}
                              </span>

                            </label>
                          )
                        )}

                        {availableGrantors.length ===
                          0 && (
                          <p className="px-2 py-2 text-sm text-slate-500">
                            No grantors available
                          </p>
                        )}

                      </div>

                    </div>

                  </div>


                  {/* Deadline */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Deadline
                    </label>

                    <select
                      value={quickDeadline}
                      onChange={(e) =>
                        setQuickDeadline(
                          e.target.value
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#173B63] outline-none transition focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40"
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


                  {/* Anticipated Deadline Month */}

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Anticipated Deadline Month
                    </label>

                    <div className="mt-4 h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                      <div className="space-y-1">

                        {availableMonths.map(
                          (month) => (
                            <label
                              key={month}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#173B63] transition hover:bg-slate-50"
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
                                className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                              />

                              <span>
                                {month}
                              </span>

                            </label>
                          )
                        )}

                        {availableMonths.length ===
                          0 && (
                          <p className="px-2 py-2 text-sm text-slate-500">
                            No anticipated deadline months available
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                </div>


                {/* Clear Filters */}

                <div className="mt-6 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      clearAllFilters
                    }
                    className="text-sm font-semibold text-[#173B63] transition hover:text-[#0F2945] hover:underline"
                  >
                    Clear Filters
                  </button>

                </div>

              </div>
            )}


            {/* ==================================================
                ADVANCED FILTER PANEL
            ================================================== */}

            {showAdvancedFilters && (
              <div className="mt-5 rounded-2xl border border-[#91AFC2] bg-[#E7EFF4] p-6 shadow-sm">

                {/* Advanced Filter Header */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Advanced Filters
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      Build custom rules using
                      AND, OR, and AND NOT.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      addAdvancedFilter
                    }
                    className="rounded-xl border border-[#91AFC2] bg-white px-5 py-3 text-sm font-semibold text-[#173B63] transition hover:bg-slate-50"
                  >
                    + Add Filter
                  </button>

                </div>


                {/* Advanced Filter Rows */}

                {advancedFilters.length ===
                0 ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center">

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
                        filter,
                        index
                      ) => (
                        <div
                          key={
                            filter.id
                          }
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

                            {/* Connector */}

                            <div>

                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Match
                              </label>

                              <select
                                value={
                                  filter.connector
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateAdvancedFilter(
                                    filter.id,
                                    {
                                      connector:
                                        e
                                          .target
                                          .value as FilterConnector,
                                    }
                                  )
                                }
                                disabled={
                                  index ===
                                  0
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40 disabled:bg-slate-100 disabled:text-slate-400"
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

                            </div>


                            {/* Field */}

                            <div>

                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Field
                              </label>

                              <select
                                value={
                                  filter.field
                                }
                                onChange={(
                                  e
                                ) => {

                                  const field =
                                    e.target
                                      .value as FilterField;

                                  let defaultValue =
                                    "";

                                  if (
                                    field ===
                                    "category"
                                  ) {
                                    defaultValue =
                                      availableCategories[0] ??
                                      "";
                                  }

                                  if (
                                    field ===
                                    "grantor"
                                  ) {
                                    defaultValue =
                                      availableGrantors[0] ??
                                      "";
                                  }

                                  if (
                                    field ===
                                    "anticipated_deadline"
                                  ) {
                                    defaultValue =
                                      availableMonths[0] ??
                                      "";
                                  }

                                  updateAdvancedFilter(
                                    filter.id,
                                    {
                                      field,
                                      value:
                                        defaultValue,
                                    }
                                  );

                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40"
                              >

                                <option value="category">
                                  Category
                                </option>

                                <option value="grantor">
                                  Grantor
                                </option>

                                <option value="deadline">
                                  Deadline
                                </option>

                                <option value="anticipated_deadline">
                                  Anticipated Deadline
                                </option>

                              </select>

                            </div>


                            {/* Operator */}

                            <div>

                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Condition
                              </label>

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
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40"
                              >

                                <option value="is">
                                  is
                                </option>

                                <option value="is_not">
                                  is not
                                </option>

                              </select>

                            </div>


                            {/* Value */}

                            <div>

                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Value
                              </label>

                              <select
                                value={
                                  filter.value
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateAdvancedFilter(
                                    filter.id,
                                    {
                                      value:
                                        e.target
                                          .value,
                                    }
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-4 focus:ring-[#AFC4D4]/40"
                              >

                                {filter.field ===
                                "category" ? (
                                  availableCategories.map(
                                    (
                                      category
                                    ) => (
                                      <option
                                        key={
                                          category
                                        }
                                        value={
                                          category
                                        }
                                      >
                                        {
                                          category
                                        }
                                      </option>
                                    )
                                  )
                                ) : filter.field ===
                                  "grantor" ? (
                                  availableGrantors.map(
                                    (
                                      grantor
                                    ) => (
                                      <option
                                        key={
                                          grantor
                                        }
                                        value={
                                          grantor
                                        }
                                      >
                                        {
                                          grantor
                                        }
                                      </option>
                                    )
                                  )
                                ) : filter.field ===
                                  "anticipated_deadline" ? (
                                  availableMonths.map(
                                    (
                                      month
                                    ) => (
                                      <option
                                        key={
                                          month
                                        }
                                        value={
                                          month
                                        }
                                      >
                                        {
                                          month
                                        }
                                      </option>
                                    )
                                  )
                                ) : (
                                  <>
                                    <option value="">
                                      No specific
                                      deadline
                                    </option>

                                    {Array.from(
                                      new Set(
                                        customers
                                          .map(
                                            (
                                              customer
                                            ) =>
                                              customer.deadline
                                          )
                                          .filter(
                                            Boolean
                                          )
                                      )
                                    )
                                      .sort()
                                      .map(
                                        (
                                          deadline
                                        ) => (
                                          <option
                                            key={
                                              deadline
                                            }
                                            value={
                                              deadline!
                                            }
                                          >
                                            {new Date(
                                              `${deadline}T00:00:00`
                                            ).toLocaleDateString(
                                              "en-US",
                                              {
                                                year: "numeric",
                                                month:
                                                  "short",
                                                day: "numeric",
                                              }
                                            )}
                                          </option>
                                        )
                                      )}
                                  </>
                                )}

                              </select>

                            </div>


                            {/* Remove */}

                            <div className="flex items-end">

                              <button
                                type="button"
                                onClick={() =>
                                  removeAdvancedFilter(
                                    filter.id
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                Remove
                              </button>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}


                {/* Clear Advanced Filters */}

                <div className="mt-6 flex justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      setAdvancedFilters(
                        []
                      )
                    }
                    className="text-sm font-semibold text-[#173B63] transition hover:text-[#0F2945] hover:underline"
                  >
                    Clear Advanced Filters
                  </button>

                </div>

              </div>
            )}


            {/* --------------------------------------------------
                Active Filter Chips
            -------------------------------------------------- */}

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
                      Month:{" "}
                      {month} ×
                    </button>
                  )
                )}

                {advancedFilters.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAdvancedFilters(
                        []
                      )
                    }
                    className="rounded-full border border-[#91AFC2] bg-[#E7EFF4] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#DCE8EF]"
                  >
                    Advanced filters:{" "}
                    {
                      advancedFilters.length
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


            {/* --------------------------------------------------
                Search / Filter Result Count
            -------------------------------------------------- */}

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


        {/* ==================================================
            DATA TABLE
        ================================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-[#B7CEDD]">

                <tr>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Grantor
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Opportunity
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Maximum
                    <br />
                    Grant
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Deadline
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Anticipated Deadline
                    <br />
                    Month
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
                    Abstract
                  </th>

                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-900">
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

                        <td className="px-6 py-6 align-top">

                          <div className="font-semibold text-slate-900">
                            {
                              customer.grantor ||
                              "—"
                            }
                          </div>

                        </td>


                        {/* Opportunity */}

                        <td className="px-6 py-6 align-top">

                          <div className="font-semibold text-slate-900">
                            {
                              customer.opportunity_name ||
                              "—"
                            }
                          </div>

                        </td>


                        {/* Maximum Grant */}

                        <td className="px-6 py-6 align-top">

                          {customer.maximum_grant ? (
                            <span className="inline-flex rounded-lg border border-[#B8C9D8] bg-[#F3F7FA] px-3 py-2 text-sm font-semibold text-slate-800">
                              {
                                customer.maximum_grant
                              }
                            </span>
                          ) : (
                            "—"
                          )}

                        </td>


                        {/* Deadline */}

                        <td className="px-6 py-6 align-top">

                          {customer.deadline ? (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${deadlineStyle.container}`}
                            >
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
                          ) : (
                            <span className="text-sm text-slate-500">
                              No specific deadline
                            </span>
                          )}

                        </td>


                        {/* Anticipated Deadline */}

                        <td className="px-6 py-6 align-top">

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
                            "—"
                          )}

                        </td>


                        {/* Abstract */}

                        <td className="px-6 py-6 align-top">

                          <div className="max-w-xl text-sm leading-6 text-slate-700">

                            {
                              customer.abstract ||
                              "—"
                            }

                          </div>

                        </td>


                        {/* Categories */}

                        <td className="px-6 py-6 align-top">

                          <div className="flex flex-wrap gap-2">

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
                              <span className="text-sm text-slate-500">
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
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.5 9.5h.01M14.5 9.5h.01M8 14s1.5 2 4 2 4-2 4-2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>

              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No matching opportunities
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try adjusting your search or
                filters to find matching funding
                opportunities.
              </p>

            </div>
          )}

        </div>


        {/* --------------------------------------------------
            Realtime Drawer
        -------------------------------------------------- */}

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