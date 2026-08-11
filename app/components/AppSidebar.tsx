"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type AppSidebarProps = {
  activePath: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

type CurrentProfile = {
  firstName: string;
  lastName: string;
  email: string;
};

const navigationItems = [
  {
    label: "Active Opportunities",
    icon: "▦",
    href: "/",
  },
  {
    label: "Archived Opportunities",
    icon: "◫",
    href: "/archived",
  },
  {
    label: "Prospect Library",
    icon: "▤",
    href: "/prospect-library",
  },
  {
    label: "Favorites",
    icon: "☆",
    href: "/favorites",
  },
  {
    label: "Subscribe to RFP Alerts",
    icon: "✉",
    href: "/subscribe",
  },
];

export default function AppSidebar({
  activePath,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      setProfile({
        firstName: data?.first_name ?? "",
        lastName: data?.last_name ?? "",
        email: user.email ?? "",
      });
      setLoading(false);
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [mobileOpen, onMobileClose]);

  const displayName = profile
    ? [profile.firstName, profile.lastName]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" ") || "LG Listings User"
    : "";

  const initials = profile
    ? [profile.firstName, profile.lastName]
        .map((value) => value.trim().charAt(0))
        .join("")
        .toUpperCase() || "LG"
    : "LG";

  const renderSidebarContents = (
    isMobile: boolean
  ) => (
    <>
      <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-white/25 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3 px-3">
        <Link
          href="/"
          onClick={isMobile ? onMobileClose : undefined}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2F3038] text-sm font-bold tracking-wide text-white shadow-[0_10px_24px_rgba(38,39,43,0.18)]">
            LG
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-[-0.02em]">
              LG Listings
            </span>
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[#747E85]">
              Funding Intelligence
            </span>
          </span>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B7BBBE] bg-white/70 text-xl text-[#565E64] transition hover:bg-white hover:text-[#2F3038]"
          >
            ×
          </button>
        )}
      </div>

      <nav
        className="relative mt-8 space-y-2"
        aria-label="Primary navigation"
      >
        {navigationItems.map((item) => {
          const isActive = item.href === activePath;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onMobileClose : undefined}
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition duration-200 ${
                isActive
                  ? "bg-white font-semibold text-[#2F3038] shadow-[0_8px_24px_rgba(63,91,108,0.08)]"
                  : "font-medium text-[#565E64] hover:translate-x-0.5 hover:bg-white/70 hover:text-[#2F3038]"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white/60 text-[#444B51]">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                {item.label}
              </span>
              {isActive && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#B7655E]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto space-y-2 border-t border-[#C8CBCC] pt-5">
        {loading ? (
          <div className="h-[62px] animate-pulse rounded-2xl bg-white/40" />
        ) : profile ? (
          <>
            <Link
              href="/account"
              onClick={isMobile ? onMobileClose : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                activePath === "/account"
                  ? "bg-white shadow-[0_8px_24px_rgba(63,91,108,0.08)]"
                  : "hover:bg-white/70"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#2F3038]">
                  {displayName}
                </span>
                <span className="block truncate text-[10px] text-[#778189]">
                  Account
                </span>
              </span>
              {activePath === "/account" && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#B7655E]" />
              )}
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-[#626A70] transition hover:bg-white/70 hover:text-[#2F3038]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white/50 text-sm">
                  ↪
                </span>
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={isMobile ? onMobileClose : undefined}
              className="rounded-xl border border-[#B7BBBE] bg-white/60 px-3 py-2.5 text-center text-xs font-semibold text-[#565E64] transition hover:bg-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={isMobile ? onMobileClose : undefined}
              className="rounded-xl bg-[#2F3038] px-3 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-black"
            >
              Join
            </Link>
          </div>
        )}

        <Link
          href="/help"
          onClick={isMobile ? onMobileClose : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
            activePath === "/help"
              ? "bg-white font-semibold text-[#2F3038] shadow-sm"
              : "font-medium text-[#565E64] hover:bg-white/70 hover:text-[#2F3038]"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C8CBCC] text-sm font-bold">
            ?
          </span>
          Help
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col overflow-hidden border-r border-[#C7B5AE] bg-[#CACDCF] px-4 py-6 lg:flex">
        {renderSidebarContents(false)}
      </aside>

      <div
        className={`fixed inset-0 z-[250] bg-[#15171A]/55 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-[260] flex w-[min(86vw,320px)] flex-col overflow-y-auto border-r border-[#C7B5AE] bg-[#CACDCF] px-4 py-5 shadow-[24px_0_70px_rgba(18,19,22,0.28)] transition-transform duration-300 lg:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {renderSidebarContents(true)}
      </aside>
    </>
  );
}