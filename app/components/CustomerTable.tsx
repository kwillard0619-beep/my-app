"use client";

import { useMemo, useState } from "react";
import CustomerDrawer from "./CustomerDrawer";
import type { Customer } from "../types/customer";

export default function CustomerTable({
  customers,
  activeCount,
}: {
  customers: Customer[];
  activeCount: number;
}) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(
      (customer) =>
        customer.Category === "active"
    );

    if (search.trim()) {
      const searchTerm = search
        .trim()
        .toLowerCase();

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
            a.deadline || "9999-12-31"
          ).getTime() -
          new Date(
            b.deadline || "9999-12-31"
          ).getTime()
      );
    }

    return result;
  }, [customers, search, sortBy]);

  const getDeadlineStyle = (
    deadline: string | null
  ) => {
    if (!deadline) {
      return {
        container:
          "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    const deadlineDate = new Date(
      `${deadline}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    const daysUntil = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
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

    for (let i = 0; i < category.length; i++) {
      hash =
        category.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    const index =
      Math.abs(hash) % colors.length;

    return colors[index];
  };

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
        "bg-blue-100 text-blue-800 border-blue-300",
      february:
        "bg-purple-100 text-purple-800 border-purple-300",
      march:
        "bg-emerald-100 text-emerald-800 border-emerald-300",
      april:
        "bg-amber-100 text-amber-800 border-amber-300",
      may:
        "bg-rose-100 text-rose-800 border-rose-300",
      june:
        "bg-cyan-100 text-cyan-800 border-cyan-300",
      july:
        "bg-indigo-100 text-indigo-800 border-indigo-300",
      august:
        "bg-orange-100 text-orange-800 border-orange-300",
      september:
        "bg-teal-100 text-teal-800 border-teal-300",
      october:
        "bg-pink-100 text-pink-800 border-pink-300",
      november:
        "bg-violet-100 text-violet-800 border-violet-300",
      december:
        "bg-sky-100 text-sky-800 border-sky-300",
    };

    return (
      monthColors[normalizedMonth] ||
      "bg-slate-100 text-slate-700 border-slate-300"
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-2">
      <div className="max-w-[1800px] mx-auto">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-8 mb-6 text-white">

          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

            {/* Branding */}
            <div>
              <div className="h-14 w-48 mb-6 flex items-center">
                {/* Logo goes here */}
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300 mb-2">
                Funding Opportunities
              </p>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Active RFP Opportunities
              </h1>

              <p className="mt-3 text-slate-300 max-w-2xl leading-6">
                Explore current funding opportunities
                and discover grants aligned with your
                organization's goals and interests.
              </p>
            </div>

            {/* Active Count */}
            <div className="flex-shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-slate-600 bg-slate-700 px-7 py-5 min-w-[200px] shadow-inner">

                <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-slate-600/40 -translate-y-8 translate-x-8" />

                <div className="relative">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Active Opportunities
                  </div>

                  <div className="mt-1 text-4xl font-bold text-white">
                    {activeCount}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    Currently available
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="mt-8 pt-6 border-t border-slate-700">

            <div className="flex flex-col md:flex-row gap-3">

              {/* Search */}
              <div className="relative flex-1">

                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
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
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-500 bg-slate-700 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-slate-600 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
                  Sort by
                </span>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
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

            {search.trim() && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />

                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredCustomers.length}
                </span>{" "}
                matching opportunities
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-300 overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              {/* Headers */}
              <thead className="bg-slate-700 text-white">

                <tr>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Grantor
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Opportunity
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Maximum Grant
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Deadline
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Anticipated Deadline Month
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
                    Abstract
                  </th>

                  <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider">
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
                          setSelectedCustomer(
                            customer
                          )
                        }
                        className={`group cursor-pointer transition-all duration-200 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50"
                        } hover:bg-blue-50`}
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

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${deadlineStyle.container}`}
                                >
                                  {new Date(
                                    `${customer.deadline}T00:00:00`
                                  ) < new Date()
                                    ? "Past deadline"
                                    : "Due soon"}
                                </span>
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
                              .length > 0 ? (

                              customer.rfp_categories.map(
                                (category) => (

                                  <span
                                    key={category}
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                                      category
                                    )}`}
                                  >
                                    {category}
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
                Try adjusting your search to find
                matching funding opportunities.
              </p>

            </div>
          )}

        </div>

        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() =>
            setSelectedCustomer(null)
          }
        />

      </div>
    </div>
  );
}