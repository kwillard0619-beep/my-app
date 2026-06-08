"use client";

import { useMemo, useState } from "react";
import CustomerDrawer from "./CustomerDrawer";

type Customer = {
  id: number;
  Name: string;
  Category: string;
  created_at: string;
};

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
  const [sortBy, setSortBy] = useState("created");

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search) {
      result = result.filter((customer) =>
        customer.Name.toLowerCase().includes(
          search.toLowerCase()
        )
      );
    }

    if (filter !== "all") {
      result = result.filter(
        (customer) => customer.Category === filter
      );
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        a.Name.localeCompare(b.Name)
      );
    }

    if (sortBy === "created") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [customers, search, filter, sortBy]);

  return (
    <>
      {/* Header */}
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
            placeholder="Search customers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-lg px-3 py-2 w-64 bg-white"
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
            <option value="created">
              Newest First
            </option>
            <option value="name">
              Name A-Z
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">
                Name
              </th>
              <th className="text-left p-4">
                Category
              </th>
              <th className="text-left p-4">
                Created
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
                  {customer.Name}
                </td>

                <td className="p-4">
                  {customer.Category}
                </td>

                <td className="p-4">
                  {new Date(
                    customer.created_at
                  ).toLocaleDateString()}
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