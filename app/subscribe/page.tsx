"use client";

import Link from "next/link";
import AppSidebar from "../components/AppSidebar";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createCategoryColorMap,
  getCategoryStyle,
} from "../components/categoryColors";

type Category = {
  id: number;
  name: string;
};

type FormStatus =
  | "idle"
  | "submitting"
  | "success"
  | "duplicate"
  | "error";

export default function SubscribePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);
  const [categoriesError, setCategoriesError] =
    useState("");
  const [status, setStatus] =
    useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError("");

      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error loading categories:", error);
        setCategoriesError(
          "We could not load the opportunity categories. Please refresh and try again."
        );
        setCategoriesLoading(false);
        return;
      }

      setCategories(data ?? []);
      setCategoriesLoading(false);
    }

    loadCategories();
  }, [supabase]);

  const categoryColorMap = useMemo(
    () =>
      createCategoryColorMap(
        categories.map((category) => category.name)
      ),
    [categories]
  );

  const resetMessage = () => {
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  };

  const toggleCategory = (category: string) => {
    resetMessage();

    setSelected((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      if (current.length >= 5) {
        setStatus("error");
        setMessage("You may select up to five categories.");
        return current;
      }

      return [...current, category];
    });
  };

  const clearForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelected([]);
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      setStatus("error");
      setMessage("Enter your first and last name to continue.");
      return;
    }

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Enter an email address to continue.");
      return;
    }

    if (selected.length === 0) {
      setStatus("error");
      setMessage("Select at least one opportunity category.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const { error } = await supabase
      .from("subscribers")
      .insert({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        categories: selected,
      });

    if (error) {
      console.error("Subscription error:", error);

      if (error.code === "23505") {
        setStatus("duplicate");
        setMessage(
          "This email is already subscribed to RFP alerts."
        );
        return;
      }

      setStatus("error");
      setMessage(
        "We could not complete your subscription. Please try again."
      );
      return;
    }

    setStatus("success");
    setMessage(
      "You’re subscribed. Watch your inbox for opportunities matching your interests."
    );
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelected([]);
  };

  const statusStyles =
    status === "success"
      ? "border-[#65A87C] bg-[#DDEDE2] text-[#245239]"
      : status === "duplicate"
        ? "border-[#D5A632] bg-[#F7E8B8] text-[#624A0E]"
        : "border-[#D9877E] bg-[#F5D9D6] text-[#742E28]";

  return (
    <main className="min-h-screen bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar activePath="/subscribe" />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                LG
              </span>
              <span className="font-bold">LG Listings</span>
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
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#C2A05A]/10 blur-3xl" />

            <header className="relative overflow-hidden border-b border-white/10 bg-[#2F3038] px-7 py-10 text-white sm:px-10 lg:px-14 lg:py-12">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#B7655E]/25 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-72 rounded-full bg-[#C2A05A]/10 blur-3xl" />

              <div className="relative max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D8CCC7]">
                  Personalized RFP alerts
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                  Bring the right opportunities to your inbox.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D4D9DC] sm:text-base">
                  Choose the funding areas that matter to you. We’ll send a focused weekly roundup when matching opportunities are available.
                </p>
              </div>
            </header>

            <div className="relative grid gap-7 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
              <form
                onSubmit={handleSubmit}
                className="rounded-[26px] border border-[#C8CBCC] bg-white p-6 shadow-[0_14px_36px_rgba(47,48,56,0.08)] sm:p-8"
              >
                <div className="flex flex-col gap-3 border-b border-[#E2E3E3] pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                      Your alert profile
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-[#2F3038]">
                      Select your interests
                    </h2>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-[#D7D9DA] bg-[#F4F3F1] px-3 py-1.5 text-xs font-bold text-[#626A70]">
                    {selected.length} of 5 selected
                  </span>
                </div>

                {(status === "success" ||
                  status === "duplicate" ||
                  status === "error") &&
                  message && (
                    <div
                      role="status"
                      className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${statusStyles}`}
                    >
                      {message}
                    </div>
                  )}

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="subscriber-first-name"
                      className="text-xs font-bold uppercase tracking-[0.15em] text-[#626A70]"
                    >
                      First name
                    </label>
                    <input
                      id="subscriber-first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      placeholder="First name"
                      value={firstName}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        resetMessage();
                      }}
                      className="mt-3 w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] px-4 py-3.5 text-sm text-[#334B59] shadow-inner outline-none transition placeholder:text-[#92999E] focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subscriber-last-name"
                      className="text-xs font-bold uppercase tracking-[0.15em] text-[#626A70]"
                    >
                      Last name
                    </label>
                    <input
                      id="subscriber-last-name"
                      type="text"
                      required
                      autoComplete="family-name"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        resetMessage();
                      }}
                      className="mt-3 w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] px-4 py-3.5 text-sm text-[#334B59] shadow-inner outline-none transition placeholder:text-[#92999E] focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="subscriber-email"
                    className="text-xs font-bold uppercase tracking-[0.15em] text-[#626A70]"
                  >
                    Email address
                  </label>
                  <div className="relative mt-3">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#778189]">
                      ✉
                    </span>
                    <input
                      id="subscriber-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        resetMessage();
                      }}
                      className="w-full rounded-2xl border border-[#D8C3B9] bg-[#F9F8F6] py-3.5 pl-11 pr-4 text-sm text-[#334B59] shadow-inner outline-none transition placeholder:text-[#92999E] focus:border-[#B7655E] focus:bg-white focus:ring-4 focus:ring-[#B7655E]/15"
                    />
                  </div>
                </div>

                <fieldset className="mt-8">
                  <legend className="text-xs font-bold uppercase tracking-[0.15em] text-[#626A70]">
                    Opportunity categories
                  </legend>
                  <p className="mt-2 text-sm leading-6 text-[#778189]">
                    Select between one and five categories. You can change your preferences later.
                  </p>

                  {categoriesLoading ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-12 animate-pulse rounded-2xl bg-[#E8E8E6]"
                        />
                      ))}
                    </div>
                  ) : categoriesError ? (
                    <div className="mt-5 rounded-2xl border border-[#D9877E] bg-[#F5D9D6] p-4 text-sm font-semibold text-[#742E28]">
                      {categoriesError}
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {categories.map((category) => {
                        const isSelected = selected.includes(
                          category.name
                        );
                        const selectionDisabled =
                          selected.length >= 5 && !isSelected;

                        return (
                          <label
                            key={category.id}
                            className={`group flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                              isSelected
                                ? `${getCategoryStyle(
                                    category.name,
                                    categoryColorMap
                                  )} cursor-pointer shadow-[0_6px_18px_rgba(47,48,56,0.10)]`
                                : selectionDisabled
                                  ? "cursor-not-allowed border-[#E2E3E3] bg-[#F4F3F1] text-[#A0A5A9] opacity-55"
                                  : "cursor-pointer border-[#D7D9DA] bg-[#F9F8F6] text-[#4B5359] hover:-translate-y-0.5 hover:border-[#B8BEC1] hover:bg-white hover:shadow-sm"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={selectionDisabled}
                              onChange={() =>
                                toggleCategory(category.name)
                              }
                              className="sr-only"
                            />
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                                isSelected
                                  ? "border-black/25 bg-black/80 text-white"
                                  : "border-[#B9BEC1] bg-white text-transparent group-hover:border-[#8E969B]"
                              }`}
                            >
                              ✓
                            </span>
                            <span className="text-sm font-semibold">
                              {category.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                <div className="mt-8 flex flex-col gap-3 border-t border-[#E2E3E3] pt-6 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={clearForm}
                    disabled={status === "submitting"}
                    className="inline-flex items-center justify-center rounded-xl border border-[#C8CBCC] bg-[#F4F3F1] px-5 py-3.5 text-sm font-semibold text-[#565E64] transition hover:border-[#AEB3B6] hover:bg-white hover:text-[#2F3038] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={
                      status === "submitting" ||
                      categoriesLoading ||
                      Boolean(categoriesError)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F3038] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,48,56,0.18)] transition hover:-translate-y-0.5 hover:bg-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {status === "submitting"
                      ? "Subscribing…"
                      : "Subscribe to RFP Alerts"}
                    {status !== "submitting" && (
                      <span aria-hidden="true">→</span>
                    )}
                  </button>
                </div>
              </form>

              <aside className="overflow-hidden rounded-[26px] border border-white/10 bg-[#2F3038] text-white shadow-[0_16px_38px_rgba(47,48,56,0.18)]">
                <div className="border-b border-white/10 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B7655E] text-lg shadow-lg">
                    ✦
                  </span>
                  <h2 className="mt-5 text-xl font-bold">
                    A smarter weekly scan
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#D4D9DC]">
                    Your alert profile helps reduce noise and surfaces opportunities that fit your work.
                  </p>
                </div>

                <div className="space-y-5 p-6">
                  {[
                    [
                      "01",
                      "Choose your focus",
                      "Select up to five funding categories.",
                    ],
                    [
                      "02",
                      "We match opportunities",
                      "New records are checked against your interests.",
                    ],
                    [
                      "03",
                      "Review your roundup",
                      "Matching RFPs arrive together in one weekly email.",
                    ],
                  ].map(([number, title, description]) => (
                    <div key={number} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-bold text-[#E9D7CF]">
                        {number}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#BFC5C8]">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="m-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-[#C9CED1]">
                  Already subscribed? Submitting the same email will not create another subscription.
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}