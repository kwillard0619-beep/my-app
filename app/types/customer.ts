export type Contact = {
  id: number;
  name: string;
  email: string | null;
  organization: string | null;
};

export type OpportunityAttachment = {
  id: number;
  opportunity_id: number;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
};

export type Customer = {
  id: number;

  // Internal field used for active/archived status
  status: string | null;

  // Opportunity information
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
  attachments?: OpportunityAttachment[];

  // Contact relationship
  contact_id: number | null;
  contact: Contact | null;

  // System field
  created_at: string;
};