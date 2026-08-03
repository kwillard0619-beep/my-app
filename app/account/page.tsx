import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";

type SubscriberRow = {
  id: number;
  categories: string[] | null;
};

type CategoryRow = {
  id: number;
  name: string;
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  const [profileResult, categoriesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name, last_name, organization"
        )
        .eq("id", userId)
        .single(),
      supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  if (profileResult.error) {
    console.error(
      "Error loading account profile:",
      profileResult.error
    );
  }

  if (categoriesResult.error) {
    console.error(
      "Error loading alert categories:",
      categoriesResult.error
    );
  }

  const {
    data: userSubscriber,
    error: userSubscriberError,
  } = await supabase
    .from("subscribers")
    .select("id, categories")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (userSubscriberError) {
    console.error(
      "Error loading subscription by user ID:",
      userSubscriberError
    );
  }

  let subscriber =
    (userSubscriber as SubscriberRow | null) ??
    null;

  // Older public subscriptions may not have a user_id.
  // Match those records by the authenticated email so
  // users can claim them when saving their preferences.
  if (!subscriber && email) {
    const {
      data: emailSubscriber,
      error: emailSubscriberError,
    } = await supabase
      .from("subscribers")
      .select("id, categories")
      .is("user_id", null)
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (emailSubscriberError) {
      console.error(
        "Error loading subscription by email:",
        emailSubscriberError
      );
    }

    subscriber =
      (emailSubscriber as SubscriberRow | null) ??
      null;
  }

  const categoryRows =
    (categoriesResult.data ?? []) as CategoryRow[];

  const availableAlertCategories = categoryRows
    .map((category) => category.name.trim())
    .filter(Boolean);

  const initialAlertCategories = Array.isArray(
    subscriber?.categories
  )
    ? subscriber.categories.filter(
        (category): category is string =>
          typeof category === "string" &&
          category.trim().length > 0
      )
    : [];

  return (
    <AccountForm
      userId={userId}
      email={email}
      initialFirstName={
        profileResult.data?.first_name ?? ""
      }
      initialLastName={
        profileResult.data?.last_name ?? ""
      }
      initialOrganization={
        profileResult.data?.organization ?? ""
      }
      initialSubscriberId={subscriber?.id ?? null}
      initialAlertCategories={initialAlertCategories}
      availableAlertCategories={
        availableAlertCategories
      }
    />
  );
}