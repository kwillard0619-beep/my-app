import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("Personal_BB")
    .select("*");

  const total = data?.length ?? 0;
  const active = data?.filter((p) => p.Category === "active").length ?? 0;
  const pending = data?.filter((p) => p.Category === "pending").length ?? 0;

  if (error) {
    return <div>Error: {error.message}</div>;
  }

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
        <h2 className="text-3xl font-bold mb-6">
          Customer Dashboard
        </h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-gray-500">Total Customers</div>
            <div className="text-3xl font-bold">{total}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-gray-500">Active</div>
            <div className="text-3xl font-bold">{active}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-gray-500">Pending</div>
            <div className="text-3xl font-bold">{pending}</div>
          </div>
        </div>

        {/* Customer Table */}
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
              {data?.map((person) => (
                <tr
                  key={person.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4">{person.Name}</td>
                  <td className="p-4">{person.Category}</td>
                  <td className="p-4">
                    {new Date(
                      person.created_at
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}