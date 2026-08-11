import { createClient } from "@/lib/supabase/server";
import ProspectsRealtime from "./ProspectsRealtime";
import type { Prospect } from "./types";
import type { Customer } from "../types/customer";

export const dynamic = "force-dynamic";

const formatMaximumGrant = (value: number | string | null) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(parsed)
    : String(value);
};

const mapProspectToSharedRecord = (prospect: Prospect): Customer => ({
  id: prospect.id,
  status: "prospects",
  grantor: prospect.grantor_name,
  opportunity_name: (prospect.program_areas ?? []).join(", "),
  maximum_grant: formatMaximumGrant(prospect.grant_maximum),
  deadline: null,
  anticipated_deadline: prospect.rfp_cycle,
  website_link: null,
  abstract: prospect.overview,
  rfp_categories: prospect.categories ?? [],
  additional_information: (prospect.program_areas ?? []).join(", "),
  limited_opportunity: null,
  fellowship_opportunity: null,
  contact_id: prospect.contact_id,
  contact: prospect.contact,
  attachments: [],
  created_at: prospect.created_at,
  grantor_name: prospect.grantor_name,
  overview: prospect.overview,
  categories: prospect.categories,
  program_areas: prospect.program_areas,
  grant_minimum: prospect.grant_minimum,
  grant_maximum: prospect.grant_maximum,
  rfp_cycle: prospect.rfp_cycle,
  updated_at: prospect.updated_at,
});

export default async function ProspectLibraryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospect_library")
    .select(
      `
      *,
      contact:contacts!prospect_library_contact_id_fkey (
        id,
        name,
        email,
        organization
      )
    `,
    )
    .order("grantor_name", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#D4D5D6] p-4 text-[#2F3038] sm:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-[#D9877E] bg-[#F5D9D6] p-5 text-[#742E28] shadow-sm">
          <h1 className="font-bold">
            The Prospect Library could not be loaded
          </h1>
          <p className="mt-2 text-sm leading-6">{error.message}</p>
        </section>
      </main>
    );
  }

  const prospects = ((data as unknown as Prospect[]) ?? []).map(
    mapProspectToSharedRecord,
  );

  return <ProspectsRealtime initialProspects={prospects} />;
}