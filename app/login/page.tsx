"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type FormStatus =
  | "idle"
  | "submitting"
  | "error";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [status, setStatus] =
    useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [nextPath, setNextPath] =
    useState("/account");

  useEffect(() => {
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const requestedNext =
      searchParams.get("next");

    if (requestedNext?.startsWith("/")) {
      setNextPath(requestedNext);
    }

    if (
      searchParams.get("error") ===
      "confirmation"
    ) {
      setStatus("error");
      setMessage(
        "That confirmation link is invalid or has expired. Please try signing in or create a new account."
      );
    }
  }, []);

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

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      setStatus("error");
      setMessage(
        "Enter your email address and password."
      );
      return;
    }

    setStatus("submitting");
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (error) {
      console.error("Login error:", error);
      setStatus("error");

      if (
        error.message
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        setMessage(
          "Confirm your email address before signing in. Check your inbox for the confirmation message."
        );
        return;
      }

      setMessage(
        "The email address or password is incorrect."
      );
      return;
    }

    router.replace(nextPath);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#D4D5D6] px-3 py-3 text-[#2F3038] sm:px-6 sm:py-6 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl overflow-hidden rounded-[22px] border border-white/40 bg-[#F4F3F1] shadow-[0_24px_70px_rgba(47,48,56,0.16)] sm:min-h-[calc(100vh-3rem)] sm:rounded-[32px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#2F3038] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#B7655E]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#C2A05A]/15 blur-3xl" />

          <Link
            href="/"
            className="relative flex items-center gap-3"
          >
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
              Welcome back
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">
              Return to your funding workspace.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#D4D9DC]">
              Sign in to review saved opportunities, monitor upcoming deadlines, and continue building your funding plan.
            </p>

            <div className="mt-9 rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E3C7BC]">
                Your saved workspace
              </p>
              <p className="mt-3 text-sm leading-6 text-[#CDD2D4]">
                Favorites and account preferences are securely connected to your LG Listings profile and available across devices.
              </p>
            </div>
          </div>

          <p className="relative text-xs text-[#AEB5B9]">
            Need an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Create one
            </Link>
          </p>
        </section>

        <section className="relative flex items-center p-5 sm:p-9 lg:p-12 xl:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D8CCC7]/55 blur-3xl" />

          <div className="relative mx-auto w-full max-w-lg">
            <div className="mb-8 flex items-center justify-between gap-3 sm:mb-10 lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                  LG
                </span>
                <span className="font-bold">
                  LG Listings
                </span>
              </Link>
              <Link
                href="/"
                className="shrink-0 text-xs font-semibold text-[#626A70] hover:text-[#2F3038] sm:text-sm"
              >
                Back to dashboard
              </Link>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
              Account access
            </p>
            <h2 className="mt-2 text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-3xl">
              Sign in to LG Listings
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#626A70]">
              Enter the email address and password associated with your account.
            </p>

            {status === "error" && message && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-[#D9877E] bg-[#F5D9D6] px-4 py-3 text-sm font-semibold leading-6 text-[#742E28]"
              >
                {message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                >
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
                  className="mt-2.5 w-full rounded-2xl border border-[#D8C3B9] bg-white px-4 py-3.5 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                />
              </div>

              <div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-[0.14em] text-[#626A70]"
                  >
                    Password
                  </label>
                  <span className="text-xs text-[#92999E]">
                    Password reset coming next
                  </span>
                </div>

                <div className="relative mt-2.5">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value
                      );
                      clearMessage();
                    }}
                    className="w-full rounded-2xl border border-[#D8C3B9] bg-white py-3.5 pl-4 pr-20 text-base outline-none transition focus:border-[#B7655E] focus:ring-4 focus:ring-[#B7655E]/15 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-[#626A70] hover:text-[#2F3038]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F3038] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,48,56,0.18)] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                {status === "submitting"
                  ? "Signing in…"
                  : "Sign In"}
                {status !== "submitting" && (
                  <span aria-hidden="true">→</span>
                )}
              </button>

              <p className="text-center text-sm text-[#626A70] lg:hidden">
                Need an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#2F3038] underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}