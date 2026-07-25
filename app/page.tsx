import { supabase } from "@/lib/supabase";
import CustomerTable from "./components/CustomerTable";

export default async function Home() {
  const { data, error } = await supabase
    .from("Personal_BB")
    .select("*");

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  // Category remains hidden from the user,
  // but controls which opportunities are active.
  const active =
    data?.filter(
      (opportunity) =>
        opportunity.Category === "active"
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">
          Big Breakfast
        </h1>

        <nav className="space-y-3">
          <div className="p-3 rounded bg-slate-800">
            Dashboard
          </div>

          <div className="p-3 rounded hover:bg-slate-800 cursor-pointer">
            Customers
          </div>

          <div className="p-3 rounded hover:bg-slate-800 cursor-pointer">
            Inventory
          </div>

          <div className="p-3 rounded hover:bg-slate-800 cursor-pointer">
            Reports
          </div>

          <div className="p-3 rounded hover:bg-slate-800 cursor-pointer">
            Settings
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <CustomerTable
          customers={data ?? []}
          activeCount={active}
        />
      </main>
    </div>
  );
}