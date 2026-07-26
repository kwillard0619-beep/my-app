"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

type QuickFilterField =
  | "grantor"
  | "deadline"
  | "anticipated_deadline"
  | "rfp_categories"
  | "maximum_grant"
  | null;

type FilterField =
  | "grantor"
  | "maximum_grant"
  | "anticipated_deadline"
  | "rfp_categories"
  | "limited_opportunity"
  | "fellowship_opportunity";

type FilterOperator =
  | "AND"
  | "OR"
  | "AND NOT";

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
  // Drawer
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
  // Quick Filter
  // --------------------------------------------------

  const [quickFilterOpen, setQuickFilterOpen] =
    useState(false);

  const [quickFilterField, setQuickFilterField] =
    useState<QuickFilterField>(null);

  const [quickFilterValues, setQuickFilterValues] =
    useState<string[]>([]);

  const quickFilterRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Advanced Filter
  // --------------------------------------------------

  const [advancedFilterOpen, setAdvancedFilterOpen] =
    useState(false);

  const [advancedFilters, setAdvancedFilters] =
    useState<AdvancedFilter[]>([]);

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
        !quickFilterRef.current.contains(
          target
        )
      ) {
        setQuickFilterOpen(false);
      }

      if (
        advancedFilterRef.current &&
        !advancedFilterRef.current.contains(
          target
        )
      ) {
        setAdvancedFilterOpen(false);
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

  const quickFilterOptions = useMemo(() => {
    if (!quickFilterField) {
      return [];
    }

    if (
      quickFilterField ===
      "grantor"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.grantor
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      quickFilterField ===
      "anticipated_deadline"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.anticipated_deadline
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      quickFilterField ===
      "rfp_categories"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .flatMap(
              (customer) =>
                customer.rfp_categories ??
                []
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      quickFilterField ===
      "maximum_grant"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.maximum_grant
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      quickFilterField ===
      "deadline"
    ) {
      return [
        "Due within 7 days",
        "Due within 30 days",
        "Due in 31–90 days",
        "Due in 90+ days",
        "No deadline listed",
      ];
    }

    return [];
  }, [
    activeCustomers,
    quickFilterField,
  ]);

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
  ): string[] => {
    if (field === "grantor") {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.grantor
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      field ===
      "maximum_grant"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.maximum_grant
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      field ===
      "anticipated_deadline"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .map(
              (customer) =>
                customer.anticipated_deadline
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      field ===
      "rfp_categories"
    ) {
      return Array.from(
        new Set(
          activeCustomers
            .flatMap(
              (customer) =>
                customer.rfp_categories ??
                []
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }

    if (
      field ===
      "limited_opportunity"
    ) {
      return [
        "Yes",
        "No",
      ];
    }

    if (
      field ===
      "fellowship_opportunity"
    ) {
      return [
        "Yes",
        "No",
      ];
    }

    return [];
  };

  // --------------------------------------------------
  // Get Customer Values For Filter
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
        ? [
            customer.maximum_grant,
          ]
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
        customer.rfp_categories ??
        []
      );
    }

    if (
      field ===
      "limited_opportunity"
    ) {
      return customer
        .limited_opportunity
        ? [
            String(
              customer.limited_opportunity
            ),
          ]
        : [];
    }

    if (
      field ===
      "fellowship_opportunity"
    ) {
      return customer
        .fellowship_opportunity
        ? [
            String(
              customer.fellowship_opportunity
            ),
          ]
        : [];
    }

    return [];
  };

  // --------------------------------------------------
  // Quick Deadline Matching
  // --------------------------------------------------

  const matchesQuickDeadline = (
    deadline: string | null,
    filter: string
  ) => {
    if (
      filter ===
      "No deadline listed"
    ) {
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
      filter ===
      "Due within 7 days"
    ) {
      return (
        daysUntil >= 0 &&
        daysUntil <= 7
      );
    }

    if (
      filter ===
      "Due within 30 days"
    ) {
      return (
        daysUntil >= 0 &&
        daysUntil <= 30
      );
    }

    if (
      filter ===
      "Due in 31–90 days"
    ) {
      return (
        daysUntil > 30 &&
        daysUntil <= 90
      );
    }

    if (
      filter ===
      "Due in 90+ days"
    ) {
      return daysUntil > 90;
    }

    return false;
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

    return filter.values.some(
      (value) =>
        customerValues.includes(
          value
        )
    );
  };

  // --------------------------------------------------
  // Filtered Customers
  // --------------------------------------------------

  const filteredCustomers =
    useMemo(() => {
      let result =
        [...activeCustomers];

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
                ...(customer.rfp_categories ??
                  []),
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
      // Quick Filter
      // ------------------------------

      if (
        quickFilterField &&
        quickFilterValues.length >
          0
      ) {
        result =
          result.filter(
            (customer) => {
              if (
                quickFilterField ===
                "deadline"
              ) {
                return quickFilterValues.some(
                  (value) =>
                    matchesQuickDeadline(
                      customer.deadline,
                      value
                    )
                );
              }

              const customerValues =
                getCustomerFieldValues(
                  customer,
                  quickFilterField
                );

              return quickFilterValues.some(
                (value) =>
                  customerValues.includes(
                    value
                  )
              );
            }
          );
      }

      // ------------------------------
      // Advanced Filters
      //
      // First filter can be:
      // AND
      // OR
      // AND NOT
      //
      // Subsequent filters can also be:
      // AND
      // OR
      // AND NOT
      // ------------------------------

      if (
        advancedFilters.length >
        0
      ) {
        let advancedResult: Customer[] =
          [];

        advancedFilters.forEach(
          (
            filter,
            index
          ) => {
            if (
              filter.values.length ===
              0
            ) {
              return;
            }

            const matchingCustomers =
              activeCustomers.filter(
                (customer) =>
                  matchesAdvancedFilter(
                    customer,
                    filter
                  )
              );

            // First active filter
            if (
              index === 0
            ) {
              if (
                filter.operator ===
                "AND NOT"
              ) {
                advancedResult =
                  activeCustomers.filter(
                    (customer) =>
                      !matchingCustomers.some(
                        (
                          match
                        ) =>
                          String(
                            match.id
                          ) ===
                          String(
                            customer.id
                          )
                      )
                  );
              } else {
                advancedResult =
                  matchingCustomers;
              }

              return;
            }

            // AND
            if (
              filter.operator ===
              "AND"
            ) {
              advancedResult =
                advancedResult.filter(
                  (customer) =>
                    matchingCustomers.some(
                      (
                        match
                      ) =>
                        String(
                          match.id
                        ) ===
                        String(
                          customer.id
                        )
                    )
                );

              return;
            }

            // OR
            if (
              filter.operator ===
              "OR"
            ) {
              const existingIds =
                new Set(
                  advancedResult.map(
                    (customer) =>
                      String(
                        customer.id
                      )
                  )
                );

              matchingCustomers.forEach(
                (customer) => {
                  if (
                    !existingIds.has(
                      String(
                        customer.id
                      )
                    )
                  ) {
                    advancedResult.push(
                      customer
                    );
                  }
                }
              );

              return;
            }

            // AND NOT
            if (
              filter.operator ===
              "AND NOT"
            ) {
              advancedResult =
                advancedResult.filter(
                  (customer) =>
                    !matchingCustomers.some(
                      (
                        match
                      ) =>
                        String(
                          match.id
                        ) ===
                        String(
                          customer.id
                        )
                    )
                );
            }
          }
        );

        // Apply advanced result
        // to the current result.
        //
        // This means search and quick
        // filter remain active while
        // advanced filtering is applied.
        const advancedIds =
          new Set(
            advancedResult.map(
              (customer) =>
                String(
                  customer.id
                )
            )
          );

        result =
          result.filter(
            (customer) =>
              advancedIds.has(
                String(
                  customer.id
                )
              )
          );
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
      quickFilterField,
      quickFilterValues,
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

          {/* Search, Filters and Sort */}
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
                ref={
                  quickFilterRef
                }
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setQuickFilterOpen(
                      (open) => !open
                    )
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#91AFC2] bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/30 xl:w-[180px]"
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
                      quickFilterOpen
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

                {quickFilterOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Quick Filter
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Choose a field, then select one or more values.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">

                      {[
                        {
                          value:
                            "grantor",
                          label:
                            "Grantor",
                        },
                        {
                          value:
                            "deadline",
                          label:
                            "Deadline",
                        },
                        {
                          value:
                            "anticipated_deadline",
                          label:
                            "Anticipated Deadline",
                        },
                        {
                          value:
                            "rfp_categories",
                          label:
                            "Categories",
                        },
                        {
                          value:
                            "maximum_grant",
                          label:
                            "Maximum Grant",
                        },
                      ].map(
                        (option) => (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            onClick={() => {
                              setQuickFilterField(
                                option.value as Exclude<
                                  QuickFilterField,
                                  null
                                >
                              );

                              setQuickFilterValues(
                                []
                              );
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              quickFilterField ===
                              option.value
                                ? "border-[#6F91A8] bg-[#D9E8F0] text-[#31566B]"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {
                              option.label
                            }
                          </button>
                        )
                      )}

                    </div>

                    {quickFilterField && (
                      <div className="mt-4 border-t border-slate-200 pt-4">

                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Select Values
                        </p>

                        <div className="max-h-52 space-y-1 overflow-y-auto">

                          {quickFilterOptions.map(
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
                                  checked={quickFilterValues.includes(
                                    option
                                  )}
                                  onChange={() => {
                                    setQuickFilterValues(
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
                      </div>
                    )}

                    {quickFilterValues.length >
                      0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickFilterField(
                            null
                          );

                          setQuickFilterValues(
                            []
                          );
                        }}
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Clear Quick Filter
                      </button>
                    )}

                  </div>
                )}
              </div>

              {/* Advanced Filter */}
              <div
                ref={
                  advancedFilterRef
                }
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedFilterOpen(
                      (open) => !open
                    )
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#91AFC2] bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/30 xl:w-[200px]"
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
                      advancedFilterOpen
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

                {advancedFilterOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Advanced Filter
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Combine multiple filters with AND, OR, or AND NOT.
                      </p>
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

                          <div className="mb-2 flex items-center justify-between">

                            <select
                              value={
                                filter.operator
                              }
                              onChange={(
                                e
                              ) => {
                                setAdvancedFilters(
                                  (
                                    current
                                  ) =>
                                    current.map(
                                      (
                                        item
                                      ) =>
                                        item.id ===
                                        filter.id
                                          ? {
                                              ...item,
                                              operator:
                                                e
                                                  .target
                                                  .value as FilterOperator,
                                            }
                                          : item
                                    )
                                );
                              }}
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

                            <span className="ml-2 flex-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Filter{" "}
                              {index +
                                1}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setAdvancedFilters(
                                  (
                                    current
                                  ) =>
                                    current.filter(
                                      (
                                        item
                                      ) =>
                                        item.id !==
                                        filter.id
                                    )
                                )
                              }
                              className="ml-3 text-xs font-semibold text-slate-400 hover:text-red-600"
                            >
                              Remove
                            </button>

                          </div>

                          <select
                            value={
                              filter.field
                            }
                            onChange={(
                              e
                            ) => {
                              setAdvancedFilters(
                                (
                                  current
                                ) =>
                                  current.map(
                                    (
                                      item
                                    ) =>
                                      item.id ===
                                      filter.id
                                        ? {
                                            ...item,
                                            field:
                                              e
                                                .target
                                                .value as FilterField,
                                            values:
                                              [],
                                          }
                                        : item
                                  )
                              );
                            }}
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
                                      setAdvancedFilters(
                                        (
                                          current
                                        ) =>
                                          current.map(
                                            (
                                              item
                                            ) =>
                                              item.id ===
                                              filter.id
                                                ? {
                                                    ...item,
                                                    values:
                                                      item.values.includes(
                                                        option
                                                      )
                                                        ? item.values.filter(
                                                            (
                                                              value
                                                            ) =>
                                                              value !==
                                                              option
                                                          )
                                                        : [
                                                            ...item.values,
                                                            option,
                                                          ],
                                                  }
                                                : item
                                          )
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
                        </div>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedFilters(
                          (
                            current
                          ) => [
                            ...current,
                            {
                              id:
                                Date.now(),
                              operator:
                                "AND",
                              field:
                                "grantor",
                              values:
                                [],
                            },
                          ]
                        )
                      }
                      className="w-full rounded-xl border border-dashed border-[#91AFC2] bg-[#F2F7FA] px-4 py-2.5 text-sm font-semibold text-[#496A7E] transition hover:bg-[#E8F1F5]"
                    >
                      + Add Filter
                    </button>

                    {advancedFilters.length >
                      0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setAdvancedFilters(
                            []
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Clear Advanced Filters
                      </button>
                    )}

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

            {(search.trim() ||
              quickFilterValues.length >
                0 ||
              advancedFilters.length >
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

                {quickFilterValues.length >
                  0 && (
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-600">
                    Quick filter active
                  </span>
                )}

                {advancedFilters.length >
                  0 && (
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-600">
                    Advanced filter active
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