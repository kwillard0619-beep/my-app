import { createClient } from "@/lib/supabase/server";
import CustomerTable from "../components/CustomerTable";
import type { Customer } from "../types/customer";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("Personal_BB")
    .select(`
      *,
      contact:contacts!Personal_BB_contact_id_fkey (
        id,
        name,
        email,
        organization
      )
    `)
    .eq("status", "archived")
    .order("deadline", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    return (
      <div className="min-h-screen bg-[#D4D5D6] p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <h1 className="font-bold">
            Archived opportunities could not be loaded
          </h1>

          <p className="mt-2 text-sm">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const archivedCustomers =
    (data as unknown as Customer[]) ?? [];

  return (
    <CustomerTable
      customers={archivedCustomers}
      activeCount={archivedCustomers.length}
      mode="archived"
    />
  );
}