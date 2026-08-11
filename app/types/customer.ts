export type Contact = {
  id: number;
  name: string | null;
  email: string | null;
  organization: string | null;
};

export type OpportunityAttachment = {
  id: number;
  opportunity_id: number | null;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
};

export type Customer = {
  id: number;
  status: string;
  grantor: string;
  opportunity_name: string;
  maximum_grant: string | null;
  deadline: string | null;
  anticipated_deadline: string | null;
  website_link: string | null;
  abstract: string | null;
  rfp_categories: string[];
  additional_information: string | null;
  limited_opportunity: string | null;
  fellowship_opportunity: string | null;
  contact_id: number | null;
  contact: Contact | null;
  attachments?: OpportunityAttachment[] | null;
  created_at: string;

  // Prospect Library fields. These are populated only in prospect mode.
  grantor_name?: string;
  overview?: string | null;
  categories?: string[] | null;
  program_areas?: string[] | null;
  grant_minimum?: number | string | null;
  grant_maximum?: number | string | null;
  rfp_cycle?: string | null;
  updated_at?: string;
};