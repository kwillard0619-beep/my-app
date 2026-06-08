import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("Personal_BB")
    .select("*");

  return (
    <pre>
      {JSON.stringify({ data, error }, null, 2)}
    </pre>
  );
}