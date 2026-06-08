"use client";

import { useState } from "react";
import CustomerDrawer from "./CustomerDrawer";

type Customer = {
  id: number;
  Name: string;
  Category: string;
  created_at: string;
};

export default function CustomerTable({
  customers,
}: {
  customers: Customer[];
}) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4">{customer.Name}</td>

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
        onClose={() => setSelectedCustomer(null)}
      />
    </>
  );
}