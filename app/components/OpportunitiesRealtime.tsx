"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CustomerTable from "./CustomerTable";
import type { Customer } from "../types/customer";

export default function OpportunitiesRealtime({
  initialCustomers,
  activeCount,
}: {
  initialCustomers: Customer[];
  activeCount: number;
}) {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

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
            setCustomers((current) => [
              ...current,
              payload.new as Customer,
            ]);
          }

          if (payload.eventType === "UPDATE") {
            setCustomers((current) =>
              current.map((customer) =>
                customer.id === payload.new.id
                  ? (payload.new as Customer)
                  : customer
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setCustomers((current) =>
              current.filter(
                (customer) =>
                  customer.id !== payload.old.id
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
      customer.Category === "active"
  );

  return (
    <CustomerTable
      customers={customers}
      activeCount={activeCustomers.length}
    />
  );
}