import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("Personal_BB")
    .select("*");

  return (
  <>
    <h1>Customer Portal</h1>
    <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
  </>
);