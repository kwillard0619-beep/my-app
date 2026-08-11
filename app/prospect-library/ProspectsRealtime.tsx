"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import CustomerTable from "../components/CustomerTable";
import type { Customer } from "../types/customer";

export default function ProspectsRealtime({
  initialProspects,
}: {
  initialProspects: Customer[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("prospect-library-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prospect_library",
        },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return (
    <CustomerTable
      customers={initialProspects}
      activeCount={initialProspects.length}
      mode="prospects"
    />
  );
}