"use client";

import Link from "next/link";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type FormStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

export default function SignupPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [firstName, setFirstName] =
    useState("");
  const [lastName, setLastName] =
    useState("");
  const [organization, setOrganization] =
    useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [status, setStatus] =
    useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const clearMessage = () => {
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
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
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail
    ) {
      setStatus("error");
      setMessage(
        "Enter your first name, last name, and email address."
      );
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage(
        "Your password must contain at least eight characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("The passwords do not match.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const { data, error } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name:
              normalizedFirstName,
            last_name:
              normalizedLastName,
            organization:
              normalizedOrganization || null,
          },
        },
      });

    if (error) {
      console.error("Signup error:", error);
      setStatus("error");
      setMessage(
        error.message ||
          "We could not create your account. Please try again."
      );
      return;
    }

    if (data.session) {
      window.location.assign("/account");
      return;
    }

    setStatus("success");
    setMessage(
      "Check your inbox for a confirmation link. After confirming your email, you’ll be signed in to LG Listings."
    );
    setPassword("");
    setConfirmPassword("");
  };

  if (status === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#D4D5D6] px-3 py-3 text-[#2F3038] sm:px-4 sm:py-10">
        <section className="relative w-full max-w-xl overflow-hidden rounded-[22px] border border-white/50 bg-[#F4F3F1] p-5 text-center shadow-[0_22px_60px_rgba(47,48,56,0.16)] sm:rounded-[30px] sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#D8CCC7]/70 blur-3xl" />

          <div className="relative">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F3038] text-xl font-bold text-white shadow-lg">
              ✓
            </span>
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-[#778189]">
              Account created
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-3xl">
              Confirm your email
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#626A70]">
              {message}
            </p>

            <div className="mt-8 rounded-2xl border border-[#D7D9DA] bg-white p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#778189]">
                Confirmation sent to
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-[#2F3038]">
                {email.trim().toLowerCase()}
              </p>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#2F3038] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Go to Login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-[#C8CBCC] bg-white px-6 py-3 text-sm font-semibold text-[#565E64] transition hover:border-[#AEB3B6] hover:text-[#2F3038]"
              >
                Browse Opportunities
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D4D5D6] px-3 py-3 text-[#2F3038] sm:px-6 sm:py-6 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl overflow-hidden rounded-[22px] border border-white/40 bg-[#F4F3F1] shadow-[0_24px_70px_rgba(47,48,56,0.16)] sm:min-h-[calc(100vh-3rem)] sm:rounded-[32px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#2F3038] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#B7655E]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#C2A05A]/15 blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#2F3038] shadow-lg">
              LG
            </span>
            <span>
              <span className="block text-lg font-bold">
                LG Listings
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BFC5C8]">
                Funding Intelligence
              </span>
            </span>
          </Link>

          <div className="relative py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E3C7BC]">
              Your funding workspace
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">
              Save opportunities. Plan what comes next.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#D4D9DC]">
              Create an account to bookmark RFPs, organize upcoming deadlines, and build a funding plan around the opportunities that matter most.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Save active and archived opportunities",
                "Track bookmarked deadlines in one calendar",
                "Access your funding plan from any device",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#E4E7E8]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-[#E8C4B7]">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-[#AEB5B9]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              Sign in
            </Link>
          </p>
        </section>

        <section className="relative p-5 sm:p-9 lg:p-12 xl:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D8CCC7]/55 blur-3xl" />

          <div className="relative mx-auto max-w-xl">
            <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                  LG
                </span>
                <span className="font-bold">LG Listings</span>
              </Link>
              <Link href="/" className="shrink-0 text-xs font-semibold text-[#626A70] hover:text-[#2F3038] sm:text-sm">
                Back to dashboard
              </Link>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
              Create your account
            </p>
            <h2 className="mt-2 text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-3xl">
              Get started with LG Listings
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#626A70]">
              Enter your information below. We’ll send an email to confirm your address.
            </p>

            {status === "error" && message && (
              <div role="alert" className="mt-6 rounded-2xl border border-[#D9877E] bg-[#F5D9D6] px-4 py-3 text-sm font-semibold text-[#742E28]">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
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
                    className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="last-name" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
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
                    className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organization" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                  Organization <span className="font-medium normal-case tracking-normal text-[#92999E]">(optional)</span>
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
                  className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessage();
                  }}
                  className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearMessage();
                    }}
                    className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearMessage();
                    }}
                    className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-[#778189]">
                Use at least eight characters. Your password is handled securely by Supabase and is never stored by LG Listings.
              </p>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F3038] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,48,56,0.18)] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                {status === "submitting" ? "Creating account…" : "Create Account"}
                {status !== "submitting" && <span aria-hidden="true">→</span>}
              </button>

              <p className="text-center text-sm text-[#626A70] lg:hidden">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#2F3038] underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}