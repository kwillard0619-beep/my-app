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
    // as well as information displayed in the pop-out drawer.
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
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {/* Logo Placeholder */}
          <div className="mb-4 h-16 w-48 flex items-center">
            {/* Your logo will go here */}
          </div>

          <h2 className="text-3xl font-bold">
            Active RFP Opportunities
          </h2>

          <div className="mt-2 text-sm font-medium text-gray-700">
            Active: {activeCount}
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-lg px-3 py-2 w-72 bg-white"
          />

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
            className="border rounded-lg px-3 py-2 bg-white"
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

      {/* Opportunities Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">
                  Grantor
                </th>

                <th className="text-left p-4">
                  Opportunity
                </th>

                <th className="text-left p-4">
                  Maximum Grant
                </th>

                <th className="text-left p-4">
                  Deadline
                </th>

                <th className="text-left p-4">
                  Anticipated Deadline Month
                </th>

                <th className="text-left p-4">
                  Abstract
                </th>

                <th className="text-left p-4">
                  Categories
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map(
                (customer) => (
                  <tr
                    key={customer.id}
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                    className="border-t hover:bg-gray-50 cursor-pointer"
                  >
                    {/* Grantor */}
                    <td className="p-4">
                      {customer.grantor || "-"}
                    </td>

                    {/* Opportunity */}
                    <td className="p-4">
                      {customer.opportunity_name ||
                        "-"}
                    </td>

                    {/* Maximum Grant */}
                    <td className="p-4">
                      {customer.maximum_grant ||
                        "-"}
                    </td>

                    {/* Deadline */}
                    <td className="p-4">
                      {customer.deadline
                        ? new Date(
                            `${customer.deadline}T00:00:00`
                          ).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </td>

                    {/* Anticipated Deadline Month */}
                    <td className="p-4">
                      {customer.anticipated_deadline ||
                        "-"}
                    </td>

                    {/* Abstract */}
                    <td className="p-4 max-w-md">
                      {customer.abstract || "-"}
                    </td>

                    {/* Categories */}
                    <td className="p-4">
                      {Array.isArray(
                        customer.rfp_categories
                      )
                        ? customer.rfp_categories.join(
                            ", "
                          )
                        : "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opportunity Pop-Out Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        onClose={() =>
          setSelectedCustomer(null)
        }
      />
    </>
  );
}