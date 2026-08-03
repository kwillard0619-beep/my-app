"use client";

import Link from "next/link";
import AppSidebar from "../components/AppSidebar";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createCategoryColorMap,
  getCategoryStyle,
} from "../components/categoryColors";

type AccountFormProps = {
  userId: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialOrganization: string;
  initialSubscriberId: number | null;
  initialAlertCategories: string[];
  availableAlertCategories: string[];
};

export default function AccountForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialOrganization,
  initialSubscriberId,
  initialAlertCategories,
  availableAlertCategories,
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
  const [subscriberId, setSubscriberId] =
    useState<number | null>(initialSubscriberId);
  const [alertCategories, setAlertCategories] =
    useState<string[]>(initialAlertCategories);
  const [draftAlertCategories, setDraftAlertCategories] =
    useState<string[]>(initialAlertCategories);
  const [editingAlerts, setEditingAlerts] =
    useState(false);
  const [savingAlerts, setSavingAlerts] =
    useState(false);
  const [alertStatus, setAlertStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [alertMessage, setAlertMessage] =
    useState("");

  const alertCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...availableAlertCategories,
          ...initialAlertCategories,
        ])
      ).sort((first, second) =>
        first.localeCompare(second)
      ),
    [
      availableAlertCategories,
      initialAlertCategories,
    ]
  );

  const categoryColorMap = useMemo(
    () =>
      createCategoryColorMap(
        alertCategoryOptions
      ),
    [alertCategoryOptions]
  );

  const isSubscribed = subscriberId !== null;

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

  const toggleAlertCategory = (
    category: string
  ) => {
    setAlertStatus("idle");
    setAlertMessage("");

    setDraftAlertCategories((current) => {
      if (current.includes(category)) {
        return current.filter(
          (item) => item !== category
        );
      }

      if (current.length >= 5) {
        setAlertStatus("error");
        setAlertMessage(
          "You may select up to five categories."
        );
        return current;
      }

      return [...current, category];
    });
  };

  const startEditingAlerts = () => {
    setDraftAlertCategories(alertCategories);
    setAlertStatus("idle");
    setAlertMessage("");
    setEditingAlerts(true);
  };

  const cancelEditingAlerts = () => {
    setDraftAlertCategories(alertCategories);
    setAlertStatus("idle");
    setAlertMessage("");
    setEditingAlerts(false);
  };

  const saveAlertPreferences = async () => {
    if (subscriberId === null) {
      setAlertStatus("error");
      setAlertMessage(
        "No active subscription was found. Please use the RFP subscription page to sign up."
      );
      return;
    }

    if (draftAlertCategories.length === 0) {
      setAlertStatus("error");
      setAlertMessage(
        "Select at least one category before saving."
      );
      return;
    }

    setSavingAlerts(true);
    setAlertStatus("idle");
    setAlertMessage("");

    const { error } = await supabase
      .from("subscribers")
      .update({
        user_id: userId,
        email,
        categories: draftAlertCategories,
      })
      .eq("id", subscriberId);

    setSavingAlerts(false);

    if (error) {
      console.error(
        "Alert preference update error:",
        error
      );
      setAlertStatus("error");
      setAlertMessage(
        "We could not update your alert preferences. Please try again."
      );
      return;
    }

    setAlertCategories(draftAlertCategories);
    setEditingAlerts(false);
    setAlertStatus("success");
    setAlertMessage(
      "Your RFP alert preferences have been updated."
    );
  };

  const unsubscribeFromAlerts = async () => {
    if (subscriberId === null) return;

    const confirmed = window.confirm(
      "Are you sure you want to unsubscribe from RFP alerts?"
    );

    if (!confirmed) return;

    setSavingAlerts(true);
    setAlertStatus("idle");
    setAlertMessage("");

    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", subscriberId);

    setSavingAlerts(false);

    if (error) {
      console.error(
        "Alert unsubscribe error:",
        error
      );
      setAlertStatus("error");
      setAlertMessage(
        "We could not unsubscribe you. Please try again."
      );
      return;
    }

    setSubscriberId(null);
    setAlertCategories([]);
    setDraftAlertCategories([]);
    setEditingAlerts(false);
    setAlertStatus("success");
    setAlertMessage(
      "You have been unsubscribed from RFP alerts."
    );
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

              <section className="rounded-[26px] border border-[#C8CBCC] bg-white p-6 shadow-[0_14px_36px_rgba(47,48,56,0.08)] sm:p-8 xl:col-start-2">
                <div className="flex flex-col gap-4 border-b border-[#E2E3E3] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                      Email preferences
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">
                      RFP Alert Preferences
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626A70]">
                      Choose up to five funding areas for your focused opportunity alerts.
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                      isSubscribed
                        ? "border-[#65A87C] bg-[#DDEDE2] text-[#245239]"
                        : "border-[#C8CBCC] bg-[#E9E9E7] text-[#626A70]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSubscribed
                          ? "bg-[#3F865B]"
                          : "bg-[#92999E]"
                      }`}
                    />
                    {isSubscribed
                      ? "Alerts active"
                      : "Not subscribed"}
                  </span>
                </div>

                {alertStatus !== "idle" &&
                  alertMessage && (
                    <div
                      role="status"
                      className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        alertStatus === "success"
                          ? "border-[#65A87C] bg-[#DDEDE2] text-[#245239]"
                          : "border-[#D9877E] bg-[#F5D9D6] text-[#742E28]"
                      }`}
                    >
                      {alertMessage}
                    </div>
                  )}

                {!editingAlerts ? (
                  <div className="mt-6">
                    {isSubscribed ? (
                      <>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                            Alert email
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#2F3038]">
                            {email}
                          </p>
                        </div>

                        <div className="mt-6">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                            Selected funding areas
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {alertCategories.length > 0 ? (
                              alertCategories.map(
                                (category) => (
                                  <span
                                    key={category}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(
                                      category,
                                      categoryColorMap
                                    )}`}
                                  >
                                    {category}
                                  </span>
                                )
                              )
                            ) : (
                              <p className="text-sm text-[#778189]">
                                No categories are currently selected.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#C8CBCC] bg-[#F4F3F1] p-5">
                        <h3 className="font-bold text-[#2F3038]">
                          Receive focused RFP alerts
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#626A70]">
                          Use the RFP Alerts subscription page to choose your funding categories and sign up.
                        </p>
                      </div>
                    )}

                    <div className="mt-7 flex flex-col gap-3 border-t border-[#E2E3E3] pt-6 sm:flex-row sm:items-center sm:justify-between">
                      {isSubscribed ? (
                        <button
                          type="button"
                          onClick={unsubscribeFromAlerts}
                          disabled={savingAlerts}
                          className="text-left text-sm font-semibold text-[#9A4039] transition hover:text-[#742E28] disabled:opacity-50"
                        >
                          Unsubscribe from alerts
                        </button>
                      ) : (
                        <span />
                      )}

                      {isSubscribed ? (
                        <button
                          type="button"
                          onClick={startEditingAlerts}
                          className="rounded-xl bg-[#2F3038] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                        >
                          Edit Categories
                        </button>
                      ) : (
                        <Link
                          href="/subscribe"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F3038] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                        >
                          Subscribe to RFP Alerts
                          <span aria-hidden="true">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                          Choose funding areas
                        </p>
                        <p className="mt-1 text-sm text-[#778189]">
                          Select at least one and no more than five categories.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#E9E9E7] px-3 py-1.5 text-xs font-bold text-[#565E64]">
                        {draftAlertCategories.length} of 5
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {alertCategoryOptions.map(
                        (category) => {
                          const selected =
                            draftAlertCategories.includes(
                              category
                            );
                          const limitReached =
                            draftAlertCategories.length >=
                              5 && !selected;

                          return (
                            <button
                              key={category}
                              type="button"
                              disabled={limitReached}
                              onClick={() =>
                                toggleAlertCategory(
                                  category
                                )
                              }
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                selected
                                  ? `${getCategoryStyle(
                                      category,
                                      categoryColorMap
                                    )} shadow-sm ring-2 ring-[#2F3038]/20 ring-offset-2`
                                  : "border-[#C8CBCC] bg-[#F4F3F1] text-[#626A70] hover:border-[#9EA4A7] hover:bg-white"
                              } disabled:cursor-not-allowed disabled:opacity-35`}
                            >
                              {selected && (
                                <span aria-hidden="true">
                                  ✓{" "}
                                </span>
                              )}
                              {category}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {alertCategoryOptions.length ===
                      0 && (
                      <p className="mt-5 rounded-xl border border-dashed border-[#C8CBCC] bg-[#F4F3F1] p-4 text-sm text-[#778189]">
                        No alert categories are currently available.
                      </p>
                    )}

                    <div className="mt-7 flex justify-end gap-3 border-t border-[#E2E3E3] pt-6">
                      <button
                        type="button"
                        onClick={cancelEditingAlerts}
                        disabled={savingAlerts}
                        className="rounded-xl border border-[#C8CBCC] bg-white px-5 py-3 text-sm font-semibold text-[#565E64] transition hover:bg-[#F4F3F1] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAlertPreferences}
                        disabled={
                          savingAlerts ||
                          draftAlertCategories.length ===
                            0
                        }
                        className="rounded-xl bg-[#2F3038] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {savingAlerts
                          ? "Saving…"
                          : "Save Alert Preferences"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}