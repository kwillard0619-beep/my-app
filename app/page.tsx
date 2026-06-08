import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("Personal_BB")
    .select("*");

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Customer Portal</h1>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((person, index) => (
            <tr key={index}>
              <td>{person.Name}</td>
              <td>{person.Category}</td>
              <td>
                {new Date(person.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}