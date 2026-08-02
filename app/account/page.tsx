import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";

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

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "first_name, last_name, organization"
      )
      .eq("id", userId)
      .single();

  if (profileError) {
    console.error(
      "Error loading account profile:",
      profileError
    );
  }

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  return (
    <AccountForm
      userId={userId}
      email={email}
      initialFirstName={
        profile?.first_name ?? ""
      }
      initialLastName={
        profile?.last_name ?? ""
      }
      initialOrganization={
        profile?.organization ?? ""
      }
    />
  );
}