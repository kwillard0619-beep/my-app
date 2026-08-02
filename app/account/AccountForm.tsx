"use client";

import Link from "next/link";
import AppSidebar from "../components/AppSidebar";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type AccountFormProps = {
  userId: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialOrganization: string;
};

export default function AccountForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialOrganization,
}: AccountFormProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [firstName, setFirstName] =
    useState(initialFirstName);
  const [lastName, setLastName] =
    useState(initialLastName);
  const [organization, setOrganization] =
    useState(initialOrganization);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const displayName =
    [firstName, lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ") || "LG Listings User";

  const initials =
    [firstName, lastName]
      .map((value) => value.trim().charAt(0))
      .join("")
      .toUpperCase() || "LG";

  const clearMessage = () => {
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedFirstName =
      firstName.trim();
    const normalizedLastName =
      lastName.trim();
    const normalizedOrganization =
      organization.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName
    ) {
      setStatus("error");
      setMessage(
        "First and last name are required."
      );
      return;
    }

    setSaving(true);
    setStatus("idle");
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        organization:
          normalizedOrganization || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      console.error(
        "Profile update error:",
        error
      );
      setStatus("error");
      setMessage(
        "We could not save your profile. Please try again."
      );
      return;
    }

    setFirstName(normalizedFirstName);
    setLastName(normalizedLastName);
    setOrganization(normalizedOrganization);
    setStatus("success");
    setMessage("Your profile has been updated.");
  };

  return (
    <main className="min-h-screen bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar activePath="/account" />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                LG
              </span>
              <span className="font-bold">
                LG Listings
              </span>
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#C8CBCC] bg-white px-3 py-2 text-sm font-semibold text-[#565E64]"
            >
              Dashboard
            </Link>
          </div>

          <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden rounded-[30px] border border-white/40 bg-[#F4F3F1] shadow-[0_18px_45px_rgba(47,48,56,0.10)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#D8CCC7]/55 blur-3xl" />

            <header className="relative overflow-hidden border-b border-white/10 bg-[#2F3038] px-7 py-9 text-white sm:px-10 lg:px-14">
              <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#B7655E]/25 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D8CCC7]">
                    Your LG Listings profile
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                    Account Settings
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[#D4D9DC]">
                    Manage the information connected to your funding workspace.
                  </p>
                </div>

                <form
                  action="/auth/signout"
                  method="post"
                >
                  <button
                    type="submit"
                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </header>

            <div className="relative grid gap-7 p-5 sm:p-8 xl:grid-cols-[300px_minmax(0,1fr)] lg:p-10">
              <aside className="h-fit rounded-[24px] border border-[#C8CBCC] bg-[#E9E9E7] p-6">
                <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#2F3038] text-xl font-bold text-white shadow-lg">
                  {initials}
                </span>
                <h2 className="mt-5 text-xl font-bold">
                  {displayName}
                </h2>
                <p className="mt-1 break-all text-sm text-[#626A70]">
                  {email}
                </p>
                {organization && (
                  <p className="mt-3 inline-flex rounded-full border border-[#C8CBCC] bg-white px-3 py-1.5 text-xs font-semibold text-[#565E64]">
                    {organization}
                  </p>
                )}

                <div className="mt-6 border-t border-[#C8CBCC] pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                    Account access
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#626A70]">
                    Your account will securely connect saved opportunities and future alert preferences across devices.
                  </p>
                </div>
              </aside>

              <form
                onSubmit={handleSubmit}
                className="rounded-[26px] border border-[#C8CBCC] bg-white p-6 shadow-[0_14px_36px_rgba(47,48,56,0.08)] sm:p-8"
              >
                <div className="border-b border-[#E2E3E3] pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                    Profile details
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">
                    Personal Information
                  </h2>
                </div>

                {status !== "idle" && message && (
                  <div
                    role="status"
                    className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      status === "success"
                        ? "border-[#65A87C] bg-[#DDEDE2] text-[#245239]"
                        : "border-[#D9877E] bg-[#F5D9D6] text-[#742E28]"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                    >
                      First name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        clearMessage();
                      }}
                      className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] px-4 py-3.5 text-sm outline-none transition focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="last-name"
                      className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                    >
                      Last name
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        clearMessage();
                      }}
                      className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] px-4 py-3.5 text-sm outline-none transition focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="organization"
                    className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                  >
                    Organization
                  </label>
                  <input
                    id="organization"
                    type="text"
                    autoComplete="organization"
                    value={organization}
                    onChange={(event) => {
                      setOrganization(event.target.value);
                      clearMessage();
                    }}
                    className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] px-4 py-3.5 text-sm outline-none transition focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="mt-2.5 w-full cursor-not-allowed rounded-2xl border border-[#D7D9DA] bg-[#E9E9E7] px-4 py-3.5 text-sm text-[#778189]"
                  />
                  <p className="mt-2 text-xs text-[#92999E]">
                    Email changes will be added with account-security controls later.
                  </p>
                </div>

                <div className="mt-8 flex justify-end border-t border-[#E2E3E3] pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F3038] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,48,56,0.18)] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  >
                    {saving
                      ? "Saving…"
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}