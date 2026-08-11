import { createClient } from "@/lib/supabase/server";
import ProspectLibrary from "./ProspectLibrary";
import type { Prospect } from "./types";

export const dynamic = "force-dynamic";

export default async function ProspectLibraryPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospect_library")
    .select(`
      *,
      contact:contacts!prospect_library_contact_id_fkey (
        id,
        name,
        email,
        organization
      )
    `)
    .order("grantor_name", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#D4D5D6] p-4 text-[#2F3038] sm:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-[#D9877E] bg-[#F5D9D6] p-5 text-[#742E28] shadow-sm">
          <h1 className="font-bold">The Prospect Library could not be loaded</h1>
          <p className="mt-2 text-sm leading-6">{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <ProspectLibrary
      initialProspects={(data as unknown as Prospect[]) ?? []}
    />
  );
}