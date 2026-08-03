"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  createClient,
} from "@/lib/supabase/client";
import CustomerTable from "./CustomerTable";
import type {
  Customer,
} from "../types/customer";
import type {
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

const supabase = createClient();

export default function OpportunitiesRealtime({
  initialCustomers,
}: {
  initialCustomers: Customer[];
  activeCount: number;
}) {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

  // Synchronize local state when the server
  // provides a refreshed opportunity list.
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
        (
          payload: RealtimePostgresChangesPayload<Customer>
        ) => {
          if (payload.eventType === "INSERT") {
            const newCustomer =
              payload.new as Customer;

            // Only show active opportunities.
            const isActive =
              String(newCustomer.status)
                .trim()
                .toLowerCase() === "active";

            if (!isActive) {
              return;
            }

            setCustomers((current) => {
              const alreadyExists =
                current.some(
                  (customer) =>
                    String(customer.id) ===
                    String(newCustomer.id)
                );

              if (alreadyExists) {
                return current;
              }

              return [
                ...current,
                newCustomer,
              ];
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const updatedCustomer =
              payload.new as Customer;

            const isActive =
              String(updatedCustomer.status)
                .trim()
                .toLowerCase() === "active";

            setCustomers((current) => {
              // Remove the opportunity when its
              // status changes to archived.
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

              // Add a record if its status changes
              // from archived back to active.
              if (!existingCustomer) {
                return [
                  ...current,
                  updatedCustomer,
                ];
              }

              // Preserve joined contact information,
              // which is absent from realtime payloads.
              return current.map(
                (customer) =>
                  String(customer.id) ===
                  String(updatedCustomer.id)
                    ? {
                        ...customer,
                        ...updatedCustomer,
                        contact:
                          updatedCustomer.contact ??
                          customer.contact,
                      }
                    : customer
              );
            });

            return;
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
      void supabase.removeChannel(channel);
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