import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerTable from "../components/CustomerTable";
import type { Customer } from "../types/customer";

type FavoriteRow = {
  opportunity_id: number;
};

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/favorites");
  }

  // Load the signed-in user's favorite opportunity IDs.
  const {
    data: favoriteRows,
    error: favoritesError,
  } = await supabase
    .from("favorites")
    .select("opportunity_id")
    .eq("user_id", userId);

  if (favoritesError) {
    console.error(
      "Error loading favorite IDs:",
      favoritesError
    );
  }

  const favorites =
    (favoriteRows ?? []) as FavoriteRow[];

  const favoriteIds = favorites.map(
    (favorite) => favorite.opportunity_id
  );

  let customers: Customer[] = [];

  // Load the full opportunity records for the favorites.
  if (favoriteIds.length > 0) {
    const {
      data: opportunityRows,
      error: opportunitiesError,
    } = await supabase
      .from("Personal_BB")
      .select(`
        *,
        contact:contacts!Personal_BB_contact_id_fkey (
          id,
          name,
          email,
          organization
        ),
        attachments:opportunity_attachments (
          id,
          opportunity_id,
          file_name,
          file_path,
          created_at
        )
      `)
      .in("id", favoriteIds);

    if (opportunitiesError) {
      console.error(
        "Error loading favorite opportunities:",
        opportunitiesError
      );
    } else {
      customers =
        (opportunityRows as unknown as Customer[]) ??
        [];
    }
  }

  const activeCount = customers.filter(
    (customer) =>
      String(customer.status)
        .trim()
        .toLowerCase() === "active"
  ).length;

  return (
    <CustomerTable
      customers={customers}
      activeCount={activeCount}
      mode="favorites"
    />
  );
}