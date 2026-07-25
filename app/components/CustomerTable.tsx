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

  // Determine deadline styling
  const getDeadlineStyle = (
    deadline: string | null
  ) => {
    if (!deadline) {
      return {
        container:
          "bg-gray-100 text-gray-500 border-gray-200",
        label: "Not set",
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
          "bg-gray-100 text-gray-500 border-gray-200",
        label: "Past deadline",
      };
    }

    if (daysUntil === 0) {
      return {
        container:
          "bg-red-50 text-red-700 border-red-200",
        label: "Due today",
      };
    }

    if (daysUntil <= 30) {
      return {
        container:
          "bg-amber-50 text-amber-700 border-amber-200",
        label: "Due soon",
      };
    }

    return {
      container:
        "bg-slate-50 text-slate-700 border-slate-200",
      label: "Upcoming",
    };
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-300" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Branding */}
          <div>
            {/* Logo Placeholder */}
            <div className="h-14 w-48 mb-6 flex items-center">
              {/* Logo goes here */}
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">
              Funding Opportunities
            </p>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Active RFP Opportunities
            </h1>

            <p className="mt-3 text-gray-500 max-w-2xl leading-6">
              Explore current funding opportunities
              and discover grants aligned with your
              organization's goals and interests.
            </p>
          </div>

          {/* Active Count */}
          <div className="flex-shrink-0">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-100 px-7 py-5 min-w-[200px]">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-slate-200/40 -translate-y-8 translate-x-8" />

              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Opportunities
                </div>

                <div className="mt-1 text-4xl font-bold text-slate-900">
                  {activeCount}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Currently available
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mt-8 pt-6 border-t border-slate-100">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                Sort by
              </span>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
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

          {/* Search Results Count */}
          {search.trim() && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />

              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredCustomers.length}
              </span>{" "}
              matching opportunities
            </div>
          )}
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Headers */}
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Grantor
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Opportunity
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Maximum Grant
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Deadline
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Anticipated Deadline Month
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Abstract
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Categories
                </th>
              </tr>
            </thead>

            {/* Table Data */}
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(
                (customer) => {
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
                      className="group cursor-pointer transition-all duration-200 hover:bg-slate-50/70"
                    >
                      {/* Grantor */}
                      <td className="p-5 align-top">
                        <div className="flex items-center justify-center gap-3">
                          <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {customer.grantor
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "?"}
                          </div>

                          <span className="font-medium text-slate-700">
                            {customer.grantor ||
                              "-"}
                          </span>
                        </div>
                      </td>

                      {/* Opportunity */}
                      <td className="p-5 align-top">
                        <div className="font-semibold text-slate-900 group-hover:text-slate-700 transition">
                          {customer.opportunity_name ||
                            "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          Click to view details
                        </div>
                      </td>

                      {/* Maximum Grant */}
                      <td className="p-5 align-top text-center">
                        <span className="inline-flex rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
                          {customer.maximum_grant ||
                            "Not specified"}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="p-5 align-top">
                        <div className="flex flex-col items-center gap-2">
                          {customer.deadline ? (
                            <>
                              <span className="font-medium text-slate-800">
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
                                {deadlineStyle.label}
                              </span>
                            </>
                          ) : (
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${deadlineStyle.container}`}
                            >
                              {deadlineStyle.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Anticipated Deadline */}
                      <td className="p-5 align-top text-center">
                        <span className="text-sm text-slate-600">
                          {customer.anticipated_deadline ||
                            "—"}
                        </span>
                      </td>

                      {/* Abstract */}
                      <td className="p-5 align-top">
                        <div className="max-w-sm mx-auto text-sm leading-6 text-slate-600 line-clamp-3">
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
                                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                                >
                                  {category}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-gray-400">
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
          <div className="py-20 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400">
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

            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your search to find
              matching funding opportunities.
            </p>
          </div>
        )}
      </div>

      {/* Opportunity Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        onClose={() =>
          setSelectedCustomer(null)
        }
      />
    </div>
  );
}