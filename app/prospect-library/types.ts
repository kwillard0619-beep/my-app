export type ProspectContact = {
  id: number;
  name: string | null;
  email: string | null;
  organization: string | null;
};

export type Prospect = {
  id: number;
  grantor_name: string;
  overview: string | null;
  categories: string[] | null;
  program_areas: string[] | null;
  grant_minimum: number | string | null;
  grant_maximum: number | string | null;
  rfp_cycle: string | null;
  contact_id: number | null;
  contact: ProspectContact | null;
  created_at: string;
  updated_at: string;
};