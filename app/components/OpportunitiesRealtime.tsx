"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CustomerTable from "./CustomerTable";
import type { Customer } from "../types/customer";

export default function OpportunitiesRealtime({
  initialCustomers,
}: {
  initialCustomers: Customer[];
  activeCount: number;
}) {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

  // Keep local state synchronized if the server
  // supplies a refreshed opportunity list.
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  useEffect(() => {
    const channel = supabase
      .channel("personal-bb-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Personal_BB",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCustomer =
              payload.new as Customer;

            // Only add active opportunities to this page.
            if (
              String(newCustomer.status)
                .trim()
                .toLowerCase() !== "active"
            ) {
              return;
            }

            setCustomers((current) => {
              const alreadyExists = current.some(
                (customer) =>
                  String(customer.id) ===
                  String(newCustomer.id)
              );

              if (alreadyExists) {
                return current;
              }

              return [...current, newCustomer];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedCustomer =
              payload.new as Customer;

            const isActive =
              String(updatedCustomer.status)
                .trim()
                .toLowerCase() === "active";

            setCustomers((current) => {
              // Remove the record from the active page
              // as soon as its status becomes archived.
              if (!isActive) {
                return current.filter(
                  (customer) =>
                    String(customer.id) !==
                    String(updatedCustomer.id)
                );
              }

              const existingCustomer =
                current.find(
                  (customer) =>
                    String(customer.id) ===
                    String(updatedCustomer.id)
                );

              // If an archived record becomes active,
              // add it to the active page.
              if (!existingCustomer) {
                return [
                  ...current,
                  updatedCustomer,
                ];
              }

              return current.map((customer) =>
                String(customer.id) ===
                String(updatedCustomer.id)
                  ? {
                      ...customer,
                      ...updatedCustomer,

                      // Realtime database payloads do not
                      // include the joined contact record.
                      contact:
                        updatedCustomer.contact ??
                        customer.contact,
                    }
                  : customer
              );
            });
          }

          if (payload.eventType === "DELETE") {
            setCustomers((current) =>
              current.filter(
                (customer) =>
                  String(customer.id) !==
                  String(payload.old.id)
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeCustomers = customers.filter(
    (customer) =>
      String(customer.status)
        .trim()
        .toLowerCase() === "active"
  );

  return (
    <CustomerTable
      customers={activeCustomers}
      activeCount={activeCustomers.length}
    />
  );
}