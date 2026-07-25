export type Customer = {
  id: number;

  // Hidden field used to determine if the opportunity is active
  Category: string;

  // Visible opportunity fields
  grantor: string;
  opportunity_name: string;
  maximum_grant: string | null;
  deadline: string | null;
  anticipated_deadline: string | null;
  abstract: string | null;
  rfp_categories: string[];

  // System field
  created_at: string;
};