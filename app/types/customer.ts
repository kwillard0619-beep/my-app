export type Customer = {
  id: number;

  // Hidden internal field used to determine active status
  Category: string;

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

  // System field
  created_at: string;
};