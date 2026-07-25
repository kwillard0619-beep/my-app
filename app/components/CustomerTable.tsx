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
    // Only display opportunities that are marked as active.
    // The Category field is intentionally hidden from the user.
    let result = customers.filter(
      (customer) =>
        customer.Category === "active"
    );

    // Search all opportunity information.
    // This includes information displayed in the main table
    // and information displayed in the pop-out drawer.
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

    // Sort by Grantor A-Z
    if (sortBy === "grantor") {
      result.sort((a, b) =>
        (a.grantor ?? "").localeCompare(
          b.grantor ?? ""
        )
      );
    }

    // Sort by Deadline
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

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Branding and Title */}
          <div>
            {/* Logo Placeholder */}
            <div className="h-16 w-48 mb-6 flex items-center">
              {/* Your logo will go here */}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Funding Opportunities
              </p>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Active RFP Opportunities
              </h1>

              <p className="mt-3 text-gray-500 max-w-2xl">
                Explore current funding opportunities
                and find grants that align with your
                organization's goals and interests.
              </p>
            </div>
          </div>

          {/* Active Opportunity Count */}
          <div className="flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 min-w-[180px]">
              <div className="text-sm font-medium text-gray-500">
                Active Opportunities
              </div>

              <div className="mt-1 text-3xl font-bold text-slate-900">
                {activeCount}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
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
                placeholder="Search grants, organizations, categories..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                Sort by
              </span>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
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
            <div className="mt-4 text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredCustomers.length}
              </span>{" "}
              matching opportunities
            </div>
          )}
        </div>
      </div>

      {/* Opportunities Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Headers */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Grantor
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Opportunity
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Maximum Grant
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Deadline
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Anticipated Deadline Month
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Abstract
                </th>

                <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Categories
                </th>
              </tr>
            </thead>

            {/* Table Data */}
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map(
                (customer) => (
                  <tr
                    key={customer.id}
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                    className="group cursor-pointer transition hover:bg-slate-50"
                  >
                    {/* Grantor */}
                    <td className="p-5 align-top">
                      <div className="font-medium text-gray-700">
                        {customer.grantor || "-"}
                      </div>
                    </td>

                    {/* Opportunity */}
                    <td className="p-5 align-top">
                      <div className="font-semibold text-slate-900 group-hover:text-slate-700">
                        {customer.opportunity_name ||
                          "-"}
                      </div>
                    </td>

                    {/* Maximum Grant */}
                    <td className="p-5 align-top">
                      <div className="font-semibold text-slate-900">
                        {customer.maximum_grant ||
                          "-"}
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className="p-5 align-top">
                      {customer.deadline ? (
                        <div className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
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
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          Not set
                        </span>
                      )}
                    </td>

                    {/* Anticipated Deadline */}
                    <td className="p-5 align-top">
                      <span className="text-gray-700">
                        {customer.anticipated_deadline ||
                          "-"}
                      </span>
                    </td>

                    {/* Abstract */}
                    <td className="p-5 align-top">
                      <div className="max-w-sm text-sm leading-6 text-gray-600 line-clamp-3">
                        {customer.abstract || "-"}
                      </div>
                    </td>

                    {/* Categories */}
                    <td className="p-5 align-top">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(
                          customer.rfp_categories
                        ) &&
                        customer.rfp_categories
                          .length > 0 ? (
                          customer.rfp_categories.map(
                            (category) => (
                              <span
                                key={category}
                                className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {category}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-400">
                            -
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Empty Search State */}
        {filteredCustomers.length === 0 && (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No opportunities found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search to find
              matching funding opportunities.
            </p>
          </div>
        )}
      </div>

      {/* Opportunity Pop-Out Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        onClose={() =>
          setSelectedCustomer(null)
        }
      />
    </div>
  );
}