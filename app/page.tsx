import { supabase } from "@/lib/supabase";
import OpportunitiesRealtime from "./components/OpportunitiesRealtime";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
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
    .eq("status", "active");

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  const activeCount = data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-8">
        <OpportunitiesRealtime
          initialCustomers={data ?? []}
          activeCount={activeCount}
        />
      </main>
    </div>
  );
}