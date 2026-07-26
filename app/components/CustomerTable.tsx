"use client";

import { useMemo, useState } from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

type QuickFilter =
  | "all"
  | "30"
  | "60"
  | "90"
  | "hasCategories";

type FilterOperator = "AND" | "OR" | "AND NOT";

type FilterField =
  | "categories"
  | "grantor"
  | "deadline";

type AdvancedFilter = {
  id: number;
  operator: FilterOperator;
  field: FilterField;
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
  // Search / Sort
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  // --------------------------------------------------
  // Quick Filters
  // --------------------------------------------------

  const [quickFilter, setQuickFilter] =
    useState<QuickFilter>("all");

  // --------------------------------------------------
  // Advanced Filters
  // --------------------------------------------------

  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState(false);

  const [advancedFilters, setAdvancedFilters] =
    useState<AdvancedFilter[]>([
      {
        id: 1,
        operator: "AND",
        field: "categories",
        values: [],
      },
    ]);

  // --------------------------------------------------
  // Filter Options
  // --------------------------------------------------

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();

    customers.forEach((customer) => {
      customer.rfp_categories?.forEach(
        (category) => {
          if (category?.trim()) {
            categories.add(category.trim());
          }
        }
      );
    });

    return Array.from(categories).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [customers]);

  const grantorOptions = useMemo(() => {
    const grantors = new Set<string>();

    customers.forEach((customer) => {
      if (customer.grantor?.trim()) {
        grantors.add(customer.grantor.trim());
      }
    });

    return Array.from(grantors).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [customers]);

  // --------------------------------------------------
  // Quick Filter Handler
  // --------------------------------------------------

  const handleQuickFilterChange = (
    filter: QuickFilter
  ) => {
    setQuickFilter(filter);

    // Selecting a Quick Filter clears
    // any active Advanced Filters.
    if (filter !== "all") {
      setAdvancedFilters([
        {
          id: Date.now(),
          operator: "AND",
          field: "categories",
          values: [],
        },
      ]);

      setShowAdvancedFilters(false);
    }
  };

  // --------------------------------------------------
  // Advanced Filter Handler
  // --------------------------------------------------

  const handleOpenAdvancedFilters = () => {
    // Clear Quick Filters before opening
    // Advanced Filters.
    setQuickFilter("all");

    setShowAdvancedFilters(
      !showAdvancedFilters
    );
  };

  const updateAdvancedFilter = (
    id: number,
    updates: Partial<AdvancedFilter>
  ) => {
    setAdvancedFilters((current) =>
      current.map((filter) =>
        filter.id === id
          ? {
              ...filter,
              ...updates,
            }
          : filter
      )
    );
  };

  const addAdvancedFilter = () => {
    setAdvancedFilters((current) => [
      ...current,
      {
        id: Date.now(),
        operator: "AND",
        field: "categories",
        values: [],
      },
    ]);
  };

  const removeAdvancedFilter = (
    id: number
  ) => {
    setAdvancedFilters((current) =>
      current.filter(
        (filter) => filter.id !== id
      )
    );
  };

  const toggleFilterValue = (
    filterId: number,
    value: string
  ) => {
    setAdvancedFilters((current) =>
      current.map((filter) => {
        if (filter.id !== filterId) {
          return filter;
        }

        const alreadySelected =
          filter.values.includes(value);

        return {
          ...filter,
          values: alreadySelected
            ? filter.values.filter(
                (item) => item !== value
              )
            : [
                ...filter.values,
                value,
              ],
        };
      })
    );
  };

  const clearAllFilters = () => {
    setQuickFilter("all");
    setSearch("");

    setAdvancedFilters([
      {
        id: Date.now(),
        operator: "AND",
        field: "categories",
        values: [],
      },
    ]);
  };

  // --------------------------------------------------
  // Deadline Helpers
  // --------------------------------------------------

  const getDaysUntilDeadline = (
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

    return Math.ceil(
      (deadlineDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  // --------------------------------------------------
  // Filtering
  // --------------------------------------------------

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(
      (customer) =>
        customer.Category === "active"
    );

    // ------------------------------
    // Search
    // ------------------------------

    if (search.trim()) {
      const searchTerm =
        search.trim().toLowerCase();

      result = result.filter((customer) => {
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
          ...(customer.rfp_categories ?? []),
        ];

        return searchableFields.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchTerm)
        );
      });
    }

    // ------------------------------
    // Quick Filter
    // ------------------------------

    if (quickFilter !== "all") {
      result = result.filter((customer) => {
        if (
          quickFilter ===
          "hasCategories"
        ) {
          return (
            Array.isArray(
              customer.rfp_categories
            ) &&
            customer.rfp_categories.length >
              0
          );
        }

        const daysUntil =
          getDaysUntilDeadline(
            customer.deadline
          );

        if (daysUntil === null) {
          return false;
        }

        if (daysUntil < 0) {
          return false;
        }

        if (quickFilter === "30") {
          return daysUntil <= 30;
        }

        if (quickFilter === "60") {
          return daysUntil <= 60;
        }

        if (quickFilter === "90") {
          return daysUntil <= 90;
        }

        return true;
      });
    }

    // ------------------------------
    // Advanced Filters
    // ------------------------------

    const activeAdvancedFilters =
      advancedFilters.filter(
        (filter) =>
          filter.values.length > 0
      );

    if (
      activeAdvancedFilters.length > 0
    ) {
      result = result.filter(
        (customer) => {
          let matchesResult = true;

          activeAdvancedFilters.forEach(
            (filter, index) => {
              let matches = false;

              // Categories
              if (
                filter.field ===
                "categories"
              ) {
                matches =
                  filter.values.some(
                    (value) =>
                      customer.rfp_categories?.some(
                        (category) =>
                          category
                            .toLowerCase() ===
                          value.toLowerCase()
                      ) ?? false
                  );
              }

              // Grantor
              if (
                filter.field ===
                "grantor"
              ) {
                matches =
                  filter.values.some(
                    (value) =>
                      (
                        customer.grantor ??
                        ""
                      ).toLowerCase() ===
                      value.toLowerCase()
                  );
              }

              // Deadline
              if (
                filter.field ===
                "deadline"
              ) {
                const daysUntil =
                  getDaysUntilDeadline(
                    customer.deadline
                  );

                matches =
                  filter.values.some(
                    (value) => {
                      if (
                        value === "30"
                      ) {
                        return (
                          daysUntil !==
                            null &&
                          daysUntil >= 0 &&
                          daysUntil <=
                            30
                        );
                      }

                      if (
                        value === "60"
                      ) {
                        return (
                          daysUntil !==
                            null &&
                          daysUntil >= 0 &&
                          daysUntil <=
                            60
                        );
                      }

                      if (
                        value === "90"
                      ) {
                        return (
                          daysUntil !==
                            null &&
                          daysUntil >= 0 &&
                          daysUntil <=
                            90
                        );
                      }

                      return false;
                    }
                  );
              }

              // First filter
              if (index === 0) {
                if (
                  filter.operator ===
                  "AND NOT"
                ) {
                  matchesResult =
                    !matches;
                } else {
                  matchesResult =
                    matches;
                }

                return;
              }

              // AND
              if (
                filter.operator ===
                "AND"
              ) {
                matchesResult =
                  matchesResult &&
                  matches;
              }

              // OR
              if (
                filter.operator ===
                "OR"
              ) {
                matchesResult =
                  matchesResult ||
                  matches;
              }

              // AND NOT
              if (
                filter.operator ===
                "AND NOT"
              ) {
                matchesResult =
                  matchesResult &&
                  !matches;
              }
            }
          );

          return matchesResult;
        }
      );
    }

    // ------------------------------
    // Sorting
    // ------------------------------

    if (sortBy === "grantor") {
      result.sort((a, b) =>
        (a.grantor ?? "").localeCompare(
          b.grantor ?? ""
        )
      );
    }

    if (sortBy === "deadline") {
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
    quickFilter,
    advancedFilters,
    sortBy,
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
      getDaysUntilDeadline(deadline);

    if (
      daysUntil !== null &&
      daysUntil === 0
    ) {
      return {
        container:
          "bg-red-100 text-red-800 border-red-300",
      };
    }

    if (
      daysUntil !== null &&
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
      Math.abs(hash) % colors.length;

    return colors[index];
  };

  // --------------------------------------------------
  // Month Colors
  // --------------------------------------------------

  const getMonthStyle = (
    month: string
  ) => {
    const normalizedMonth =
      month.trim().toLowerCase();

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
  // Filter Options
  // --------------------------------------------------

  const getFilterOptions = (
    field: FilterField
  ) => {
    if (field === "categories") {
      return categoryOptions;
    }

    if (field === "grantor") {
      return grantorOptions;
    }

    return [
      "30",
      "60",
      "90",
    ];
  };

  const getFilterOptionLabel = (
    field: FilterField,
    value: string
  ) => {
    if (field === "deadline") {
      return `Next ${value} Days`;
    }

    return value;
  };

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

          {/* Search and Sort */}
          <div className="mt-8 pt-6 border-t border-[#91AFC2]">

            <div className="flex flex-col md:flex-row gap-3">

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

            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-3">

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5h18M6 12h12M10 19h4"
                  />
                </svg>

                Quick Filters

              </div>

              {[
                {
                  value: "all",
                  label: "All",
                },
                {
                  value: "30",
                  label: "Next 30 Days",
                },
                {
                  value: "60",
                  label: "Next 60 Days",
                },
                {
                  value: "90",
                  label: "Next 90 Days",
                },
                {
                  value: "hasCategories",
                  label: "Has Categories",
                },
              ].map((filter) => (

                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    handleQuickFilterChange(
                      filter.value as QuickFilter
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    quickFilter ===
                    filter.value
                      ? "border-[#6F91A8] bg-[#6F91A8] text-white shadow-sm"
                      : "border-[#91AFC2] bg-white/60 text-slate-700 hover:bg-white hover:border-[#6F91A8]"
                  }`}
                >
                  {filter.label}
                </button>

              ))}

              {/* Advanced Filters Button */}
              <button
                type="button"
                onClick={
                  handleOpenAdvancedFilters
                }
                className={`ml-auto rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  showAdvancedFilters
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-[#6F91A8] bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                Advanced Filters
              </button>

            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilters && (

              <div className="mt-5 rounded-2xl border border-[#91AFC2] bg-white/60 p-5 shadow-sm">

                <div className="flex flex-col gap-1 mb-5">

                  <h3 className="text-base font-semibold text-slate-900">
                    Advanced Filters
                  </h3>

                  <p className="text-sm text-slate-600">
                    Combine filters using AND, OR,
                    and AND NOT.
                  </p>

                </div>

                <div className="space-y-4">

                  {advancedFilters.map(
                    (filter) => {

                      const options =
                        getFilterOptions(
                          filter.field
                        );

                      return (

                        <div
                          key={filter.id}
                          className="flex flex-col lg:flex-row lg:items-start gap-3"
                        >

                          {/* Operator */}
                          <select
                            value={
                              filter.operator
                            }
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
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-2 focus:ring-[#AFC4D4]"
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

                          {/* Field */}
                          <select
                            value={
                              filter.field
                            }
                            onChange={(e) =>
                              updateAdvancedFilter(
                                filter.id,
                                {
                                  field:
                                    e.target
                                      .value as FilterField,
                                  values: [],
                                }
                              )
                            }
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#6F91A8] focus:ring-2 focus:ring-[#AFC4D4]"
                          >

                            <option value="categories">
                              Categories
                            </option>

                            <option value="grantor">
                              Grantor
                            </option>

                            <option value="deadline">
                              Deadline
                            </option>

                          </select>

                          {/* Multi Select */}
                          <div className="relative flex-1">

                            <details className="group">

                              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">

                                <span>
                                  {filter.values.length ===
                                  0
                                    ? "Select options..."
                                    : `${filter.values.length} selected`}
                                </span>

                                <span className="text-slate-400">
                                  ▾
                                </span>

                              </summary>

                              <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                                {options.length ===
                                0 ? (

                                  <div className="p-3 text-sm text-slate-500">
                                    No options available.
                                  </div>

                                ) : (

                                  options.map(
                                    (option) => (

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
                                            toggleFilterValue(
                                              filter.id,
                                              option
                                            )
                                          }
                                          className="h-4 w-4 rounded border-slate-300 text-[#6F91A8] focus:ring-[#6F91A8]"
                                        />

                                        <span>
                                          {getFilterOptionLabel(
                                            filter.field,
                                            option
                                          )}
                                        </span>

                                      </label>

                                    )
                                  )

                                )}

                              </div>

                            </details>

                            {/* Selected Values */}
                            {filter.values.length >
                              0 && (

                              <div className="mt-2 flex flex-wrap gap-2">

                                {filter.values.map(
                                  (value) => (

                                    <span
                                      key={
                                        value
                                      }
                                      className="rounded-full bg-[#D9E8F0] px-3 py-1 text-xs font-medium text-[#31566B]"
                                    >
                                      {getFilterOptionLabel(
                                        filter.field,
                                        value
                                      )}
                                    </span>

                                  )
                                )}

                              </div>

                            )}

                          </div>

                          {/* Remove Filter */}
                          {advancedFilters.length >
                            1 && (

                            <button
                              type="button"
                              onClick={() =>
                                removeAdvancedFilter(
                                  filter.id
                                )
                              }
                              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            >
                              Remove
                            </button>

                          )}

                        </div>

                      );
                    }
                  )}

                </div>

                {/* Advanced Filter Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                  <button
                    type="button"
                    onClick={
                      addAdvancedFilter
                    }
                    className="rounded-xl border border-[#6F91A8] bg-white px-4 py-2.5 text-sm font-semibold text-[#4F7086] transition hover:bg-[#EEF5F8]"
                  >
                    + Add Filter
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllFilters
                    }
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Clear All Filters
                  </button>

                </div>

              </div>

            )}

            {/* Filter Results */}
            {(search.trim() ||
              quickFilter !== "all" ||
              advancedFilters.some(
                (filter) =>
                  filter.values.length > 0
              )) && (

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">

                <span className="inline-block h-2 w-2 rounded-full bg-[#6F91A8]" />

                Showing{" "}

                <span className="font-semibold text-slate-900">
                  {filteredCustomers.length}
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
                  (customer, index) => {

                    const deadlineStyle =
                      getDeadlineStyle(
                        customer.deadline
                      );

                    return (

                      <tr
                        key={customer.id}
                        onClick={() =>
                          setSelectedCustomerId(
                            String(customer.id)
                          )
                        }
                        className={`group cursor-pointer transition-all duration-200 ${
                          index % 2 === 0
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
                              .length > 0 ? (

                              customer.rfp_categories.map(
                                (category) => (

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
          {filteredCustomers.length === 0 && (

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
                Try adjusting your search or filters to find matching funding opportunities.
              </p>

            </div>

          )}

        </div>

        {/* Realtime-Synchronized Drawer */}
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() =>
            setSelectedCustomerId(null)
          }
        />

      </div>
    </div>
  );
}