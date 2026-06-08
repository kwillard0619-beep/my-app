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
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search) {
      const searchTerm = search.toLowerCase();

      result = result.filter((customer) =>
        Object.values(customer).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchTerm)
        )
      );
    }

    if (filter !== "all") {
      result = result.filter(
        (customer) => customer.Category === filter
      );
    }

    if (sortBy === "grantor") {
      result.sort((a, b) =>
        a.grantor.localeCompare(b.grantor)
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
  }, [customers, search, filter, sortBy]);

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">
            Customer Dashboard
          </h2>

          <div className="mt-2 text-sm font-medium text-gray-700">
            Active: {activeCount}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-lg px-3 py-2 w-72 bg-white"
          />

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className="border rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">
              All Categories
            </option>
            <option value="active">
              Active
            </option>
            <option value="pending">
              Pending
            </option>
          </select>

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

      <div className="bg-white rounded-xl shadow overflow-hidden">
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
                Category
              </th>

              <th className="text-left p-4">
                Deadline
              </th>

              <th className="text-left p-4">
                Anticipated
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() =>
                  setSelectedCustomer(customer)
                }
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4">
                  {customer.grantor}
                </td>

                <td className="p-4">
                  {customer.opportunity_name}
                </td>

                <td className="p-4">
                  {customer.Category}
                </td>

                <td className="p-4">
                  {customer.deadline || "-"}
                </td>

                <td className="p-4">
                  {customer.anticipated_deadline ||
                    "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomerDrawer
        customer={selectedCustomer}
        onClose={() =>
          setSelectedCustomer(null)
        }
      />
    </>
  );
}