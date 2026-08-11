"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import AppSidebar from "../components/AppSidebar";
import {
  createCategoryColorMap,
  getCategoryStyle,
} from "../components/categoryColors";
import ProspectDrawer from "./ProspectDrawer";
import type { Prospect } from "./types";

type SortField =
  "grantor_name" | "grant_minimum" | "grant_maximum" | "updated_at";
type SortDirection = "asc" | "desc";
type SortRule = { id: number; field: SortField; direction: SortDirection };
type AdvancedField =
  "grantor" | "category" | "program_area" | "rfp_cycle" | "contact";
type AdvancedRule = {
  id: number;
  field: AdvancedField;
  operator: "is" | "is_not";
  value: string;
};

const SORT_LABELS: Record<SortField, string> = {
  grantor_name: "Grantor",
  grant_minimum: "Minimum Grant",
  grant_maximum: "Maximum Grant",
  updated_at: "Updated Date",
};

const list = (values: string[] | null) =>
  (values ?? []).map((value) => value.trim()).filter(Boolean);

const amount = (value: number | string | null) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const currency = (value: number | string | null) => {
  const parsed = amount(value);
  return parsed === null
    ? null
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(parsed);
};

const grantRange = (prospect: Prospect) => {
  const minimum = currency(prospect.grant_minimum);
  const maximum = currency(prospect.grant_maximum);
  if (minimum && maximum) return `${minimum} – ${maximum}`;
  if (maximum) return `Up to ${maximum}`;
  if (minimum) return `From ${minimum}`;
  return "Range not listed";
};

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const csvCell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function ProspectLibrary({
  initialProspects,
}: {
  initialProspects: Prospect[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [prospects, setProspects] = useState(initialProspects);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [quickCategories, setQuickCategories] = useState<string[]>([]);
  const [quickPrograms, setQuickPrograms] = useState<string[]>([]);
  const [minimumGrant, setMinimumGrant] = useState("");
  const [maximumGrant, setMaximumGrant] = useState("");
  const [advancedRules, setAdvancedRules] = useState<AdvancedRule[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { id: 1, field: "grantor_name", direction: "asc" },
  ]);
  const [panel, setPanel] = useState<"quick" | "advanced" | "sort" | null>(
    null,
  );

  useEffect(() => setProspects(initialProspects), [initialProspects]);

  useEffect(() => {
    const channel = supabase
      .channel("prospect-library-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prospect_library" },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          router.refresh(),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [router, supabase]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(prospects.flatMap((item) => list(item.categories))),
      ).sort(),
    [prospects],
  );
  const programs = useMemo(
    () =>
      Array.from(
        new Set(prospects.flatMap((item) => list(item.program_areas))),
      ).sort(),
    [prospects],
  );
  const categoryColorMap = useMemo(
    () => createCategoryColorMap(categories),
    [categories],
  );
  const largestProspect = useMemo(
    () =>
      [...prospects]
        .filter((prospect) => amount(prospect.grant_maximum) !== null)
        .sort(
          (first, second) =>
            (amount(second.grant_maximum) ?? 0) -
            (amount(first.grant_maximum) ?? 0),
        )[0] ?? null,
    [prospects],
  );
  const categoryCoverage = useMemo(() => {
    const counts = new Map<string, number>();
    prospects.forEach((prospect) =>
      list(prospect.categories).forEach((category) =>
        counts.set(category, (counts.get(category) ?? 0) + 1),
      ),
    );
    return Array.from(counts, ([category, count]) => ({ category, count }))
      .sort(
        (first, second) =>
          second.count - first.count ||
          first.category.localeCompare(second.category),
      )
      .slice(0, 3);
  }, [prospects]);
  const recentlyUpdated = useMemo(
    () =>
      [...prospects]
        .sort(
          (first, second) =>
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime(),
        )
        .slice(0, 3),
    [prospects],
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const min = minimumGrant === "" ? null : Number(minimumGrant);
    const max = maximumGrant === "" ? null : Number(maximumGrant);

    const rows = prospects.filter((prospect) => {
      const prospectCategories = list(prospect.categories);
      const prospectPrograms = list(prospect.program_areas);
      if (
        query &&
        ![
          prospect.grantor_name,
          prospect.overview ?? "",
          prospect.rfp_cycle ?? "",
          prospect.contact?.name ?? "",
          prospect.contact?.organization ?? "",
          ...prospectCategories,
          ...prospectPrograms,
        ].some((value) => value.toLowerCase().includes(query))
      )
        return false;
      if (
        quickCategories.length &&
        !quickCategories.some((value) => prospectCategories.includes(value))
      )
        return false;
      if (
        quickPrograms.length &&
        !quickPrograms.some((value) => prospectPrograms.includes(value))
      )
        return false;
      if (min !== null && (amount(prospect.grant_maximum) ?? -Infinity) < min)
        return false;
      if (max !== null && (amount(prospect.grant_minimum) ?? Infinity) > max)
        return false;

      return advancedRules.every((rule) => {
        let matches = false;
        if (rule.field === "grantor")
          matches = prospect.grantor_name
            .toLowerCase()
            .includes(rule.value.toLowerCase());
        if (rule.field === "category")
          matches = prospectCategories.includes(rule.value);
        if (rule.field === "program_area")
          matches = prospectPrograms.includes(rule.value);
        if (rule.field === "rfp_cycle")
          matches = (prospect.rfp_cycle ?? "")
            .toLowerCase()
            .includes(rule.value.toLowerCase());
        if (rule.field === "contact")
          matches =
            rule.value === "assigned"
              ? Boolean(prospect.contact_id)
              : !prospect.contact_id;
        return rule.operator === "is" ? matches : !matches;
      });
    });

    return [...rows].sort((first, second) => {
      for (const rule of sortRules) {
        let comparison = 0;
        if (rule.field === "grantor_name")
          comparison = first.grantor_name.localeCompare(second.grantor_name);
        if (rule.field === "grant_minimum")
          comparison =
            (amount(first.grant_minimum) ?? Infinity) -
            (amount(second.grant_minimum) ?? Infinity);
        if (rule.field === "grant_maximum")
          comparison =
            (amount(first.grant_maximum) ?? Infinity) -
            (amount(second.grant_maximum) ?? Infinity);
        if (rule.field === "updated_at")
          comparison =
            new Date(first.updated_at).getTime() -
            new Date(second.updated_at).getTime();
        if (comparison)
          return rule.direction === "asc" ? comparison : -comparison;
      }
      return 0;
    });
  }, [
    prospects,
    search,
    quickCategories,
    quickPrograms,
    minimumGrant,
    maximumGrant,
    advancedRules,
    sortRules,
  ]);

  const selected =
    prospects.find((prospect) => prospect.id === selectedId) ?? null;
  const selectedIndex = selected
    ? filtered.findIndex((prospect) => prospect.id === selected.id)
    : -1;
  const navigateProspect = (direction: -1 | 1) => {
    const nextProspect = filtered[selectedIndex + direction];
    if (nextProspect) setSelectedId(nextProspect.id);
  };
  const quickCount =
    quickCategories.length +
    quickPrograms.length +
    Number(Boolean(minimumGrant)) +
    Number(Boolean(maximumGrant));

  const toggle = (value: string, setter: Dispatch<SetStateAction<string[]>>) =>
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  const exportCsv = () => {
    const headers = [
      "Grantor",
      "Overview",
      "Categories",
      "Program Areas",
      "Grant Minimum",
      "Grant Maximum",
      "RFP Cycle",
      "Contact Name",
      "Contact Email",
      "Contact Organization",
      "Created At",
      "Updated At",
    ];
    const rows = filtered.map((prospect) => [
      prospect.grantor_name,
      prospect.overview,
      list(prospect.categories).join("; "),
      list(prospect.program_areas).join("; "),
      prospect.grant_minimum,
      prospect.grant_maximum,
      prospect.rfp_cycle,
      prospect.contact?.name,
      prospect.contact?.email,
      prospect.contact?.organization,
      prospect.created_at,
      prospect.updated_at,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `prospect-library-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const addAdvancedRule = () =>
    setAdvancedRules((current) => [
      ...current,
      {
        id: Date.now(),
        field: "category",
        operator: "is",
        value: categories[0] ?? "",
      },
    ]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar
          activePath="/prospect-library"
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
        />
        <section className="min-w-0 flex-1 py-4 sm:py-6">
          <div className="mx-auto max-w-[1680px] px-3 sm:px-5 lg:px-6">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/75 px-4 py-3 backdrop-blur lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                  LG
                </span>
                <span className="font-bold">LG Listings</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavigationOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-lg"
                aria-label="Open navigation"
              >
                ☰
              </button>
            </div>

            <header className="relative overflow-visible rounded-[28px] text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2F3038] via-[#3E454B] via-[35%] via-[#66717A] via-[55%] via-[#7A858E] via-[75%] to-[#C2A05A]" />
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                <div className="absolute inset-y-0 left-[18%] w-[64%] bg-gradient-to-r from-[#3E454B]/20 via-[#6B8797]/30 to-[#C2A05A]/10 blur-[55px]" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] overflow-hidden rounded-r-[28px]">
                <div className="absolute inset-0 bg-gradient-to-l from-[#C2A05A]/20 via-[#9FB9C9]/10 to-transparent blur-[35px]" />
              </div>
              <div className="pointer-events-none absolute right-0 top-0 hidden h-[220px] w-[52%] overflow-hidden rounded-r-[28px] sm:block">
                <div className="absolute inset-0 bg-gradient-to-l from-[#B8CBD5]/35 via-[#8FAEBD]/15 to-transparent blur-[18px]" />
                <div className="absolute right-[-5%] top-1/2 h-[180px] w-[75%] -translate-y-1/2 rounded-full bg-[#E1DFDE]/10 blur-[45px]" />
                <img
                  src="/lg-listings-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute right-8 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-[0.20] mix-blend-multiply blur-[0.15px] xl:right-16 xl:h-36"
                />
              </div>
              <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-8 lg:px-10 lg:pt-9">
                <div className="max-w-3xl sm:pr-52">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E1DFDE]">
                    Prospect Research Workspace
                  </p>
                  <h1 className="text-[2rem] font-bold leading-[1.08] tracking-[-0.025em] sm:text-4xl lg:text-[2.65rem]">
                    Prospect Library
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E9E9E7] sm:text-base">
                    Research potential funders, compare program interests, and
                    understand giving patterns before the next opportunity
                    opens.
                  </p>
                </div>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#E1DFDE]/60 to-transparent sm:mt-8" />
              </div>
            </header>

            <div className="h-6 sm:h-8" />

            <section className="mb-7">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                  Prospect pulse
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">
                  Your funding landscape
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#626A70]">
                  Explore the strongest funding range, category concentration,
                  and recently updated research.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.72fr_1.18fr_1.1fr]">
                <article className="group relative min-h-[210px] overflow-hidden rounded-[26px] bg-[#2F3038] p-6 text-white shadow-[0_16px_40px_rgba(47,48,56,0.16)]">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#B7655E]/25 blur-3xl transition duration-500 group-hover:scale-110" />
                  <div className="relative flex h-full flex-col">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg">
                      $
                    </span>
                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4D9DC]">
                      Largest potential grant
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-[-0.05em]">
                      {largestProspect
                        ? currency(largestProspect.grant_maximum)
                        : "—"}
                    </p>
                    {largestProspect ? (
                      <button
                        type="button"
                        onClick={() => setSelectedId(largestProspect.id)}
                        className="mt-auto flex items-center justify-between gap-3 pt-4 text-left text-xs leading-5 text-[#BFC5C8] transition hover:text-white"
                      >
                        <span className="line-clamp-2">
                          {largestProspect.grantor_name}
                        </span>
                        <span>→</span>
                      </button>
                    ) : (
                      <p className="mt-auto pt-4 text-xs text-[#BFC5C8]">
                        No grant ranges are currently listed.
                      </p>
                    )}
                  </div>
                </article>

                <article className="relative flex min-h-[210px] flex-col overflow-hidden rounded-[26px] border border-[#C8CBCC] bg-white p-6 shadow-[0_14px_36px_rgba(47,48,56,0.08)]">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#E5D4CB]/70 blur-3xl" />
                  <div className="relative flex flex-1 flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                      Category coverage
                    </p>
                    <h3 className="mt-1 text-lg font-bold">
                      Leading Funding Interests
                    </h3>
                    <div className="mt-3 flex flex-1 flex-col gap-3">
                      {categoryCoverage.map(({ category, count }) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            toggle(category, setQuickCategories);
                            setPanel("quick");
                          }}
                          className="group/category flex w-full items-center gap-3 rounded-xl border border-[#D7D9DA] bg-[#F4F3F1] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                          <span
                            className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-xs font-bold ${getCategoryStyle(category, categoryColorMap)}`}
                          >
                            {count}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-bold">
                            {category}
                          </span>
                          <span className="text-[#69747C] opacity-40 transition group-hover/category:opacity-100">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="min-h-[210px] rounded-[26px] border border-[#C8CBCC] bg-[#E9E9E7] p-6 shadow-[0_12px_30px_rgba(47,48,56,0.06)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                        Fresh research
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        Recently Updated
                      </h3>
                    </div>
                    <span className="rounded-full border border-[#C8CBCC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#626A70]">
                      {recentlyUpdated.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {recentlyUpdated.map((prospect) => (
                      <button
                        key={prospect.id}
                        type="button"
                        onClick={() => setSelectedId(prospect.id)}
                        className="group/recent flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/70 px-3 py-2.5 text-left transition hover:border-[#C8CBCC] hover:bg-white hover:shadow-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2F3038] text-[10px] font-bold text-white">
                          {prospect.grantor_name
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((word) => word.charAt(0).toUpperCase())
                            .join("")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">
                            {prospect.grantor_name}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-[#778189]">
                            {dateLabel(prospect.updated_at)}
                          </span>
                        </span>
                        <span className="text-[#778189] opacity-40 transition group-hover/recent:opacity-100">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="sticky top-2 z-30 isolate mb-6 overflow-visible rounded-[22px] border border-white/15 bg-black/85 px-3 py-4 shadow-[0_18px_42px_rgba(18,19,22,0.34)] backdrop-blur-xl sm:top-0 sm:mb-8 sm:rounded-[26px] sm:px-7 sm:py-5">
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#D45D3B]/20 blur-3xl" />
              <div className="relative mb-4 hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">
                  Search and refine
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  Explore potential funders
                </h2>
              </div>
              <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7B8791]">
                    ⌕
                  </span>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && setSearch(searchInput.trim())
                    }
                    placeholder="Search grantors, programs, categories, key words..."
                    className="w-full rounded-2xl border border-[#D8C3B9] bg-white py-3.5 pl-11 pr-12 text-base text-[#334B59] shadow-[0_5px_18px_rgba(63,91,108,0.07)] outline-none transition placeholder:text-[#778189] focus:border-[#7E9FB5] focus:ring-4 focus:ring-[#AF915A]/30 sm:text-sm"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                      }}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#778189] transition hover:text-[#4B5359]"
                      aria-label="Clear search"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDF2F5] text-sm font-bold hover:bg-[#DDE8EE]">
                        ×
                      </span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => setPanel(panel === "quick" ? null : "quick")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${panel === "quick" ? "border-[#8D7070] bg-white text-[#2F3038] shadow-sm" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    Quick Filter{" "}
                    {quickCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B7655E] px-1.5 text-xs text-white">
                        {quickCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPanel(panel === "advanced" ? null : "advanced")
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${panel === "advanced" ? "border-[#8D7070] bg-white text-[#2F3038] shadow-sm" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    Advanced{" "}
                    {advancedRules.length > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B7655E] px-1.5 text-xs text-white">
                        {advancedRules.length}
                      </span>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(panel === "sort" ? null : "sort")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 xl:min-w-[210px] xl:w-auto"
                >
                  <span>Sort by</span>
                  <span
                    className={`transition ${panel === "sort" ? "rotate-180" : ""}`}
                  >
                    ⌄
                  </span>
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!filtered.length}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white px-5 py-3 text-sm font-semibold text-[#2F3038] shadow-sm transition hover:bg-[#F3EDE9] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span aria-hidden="true">⇩</span>Export CSV
                </button>
              </div>

              {panel === "quick" && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[72dvh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:left-6 sm:right-6 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Quick Filters</h3>
                      <p className="mt-1 text-sm text-[#626A70]">
                        Selections within a section use OR; sections combine
                        with AND.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCategories([]);
                        setQuickPrograms([]);
                        setMinimumGrant("");
                        setMaximumGrant("");
                      }}
                      className="text-sm font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-5 grid gap-6 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Categories
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            type="button"
                            key={category}
                            onClick={() => toggle(category, setQuickCategories)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${quickCategories.includes(category) ? getCategoryStyle(category, categoryColorMap) : "border-[#C8CBCC] bg-white"}`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Program Areas
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {programs.map((program) => (
                          <button
                            type="button"
                            key={program}
                            onClick={() => toggle(program, setQuickPrograms)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${quickPrograms.includes(program) ? "border-[#8FAAB1] bg-[#AFC6CC]" : "border-[#C8CBCC] bg-white"}`}
                          >
                            {program}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Grant Range
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          min="0"
                          value={minimumGrant}
                          onChange={(event) =>
                            setMinimumGrant(event.target.value)
                          }
                          placeholder="Minimum"
                          className="min-w-0 rounded-xl border border-[#C8CBCC] px-3 py-2 text-base sm:text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          value={maximumGrant}
                          onChange={(event) =>
                            setMaximumGrant(event.target.value)
                          }
                          placeholder="Maximum"
                          className="min-w-0 rounded-xl border border-[#C8CBCC] px-3 py-2 text-base sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {panel === "advanced" && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[72dvh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:left-6 sm:right-6 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Advanced Filters</h3>
                      <p className="mt-1 text-sm text-[#626A70]">
                        All rules combine with AND.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdvancedRules([])}
                      className="text-sm font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {advancedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="grid gap-2 rounded-xl border border-[#D7D9DA] bg-white p-3 sm:grid-cols-[1fr_130px_1fr_auto]"
                      >
                        <select
                          value={rule.field}
                          onChange={(event) =>
                            setAdvancedRules((current) =>
                              current.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      field: event.target
                                        .value as AdvancedField,
                                      value: "",
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border p-2 text-sm"
                        >
                          <option value="grantor">Grantor</option>
                          <option value="category">Category</option>
                          <option value="program_area">Program Area</option>
                          <option value="rfp_cycle">RFP Cycle</option>
                          <option value="contact">Contact</option>
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(event) =>
                            setAdvancedRules((current) =>
                              current.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      operator: event.target.value as
                                        "is" | "is_not",
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border p-2 text-sm"
                        >
                          <option value="is">is</option>
                          <option value="is_not">is not</option>
                        </select>
                        {rule.field === "category" ? (
                          <select
                            value={rule.value}
                            onChange={(event) =>
                              setAdvancedRules((current) =>
                                current.map((item) =>
                                  item.id === rule.id
                                    ? { ...item, value: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border p-2 text-sm"
                          >
                            {categories.map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        ) : rule.field === "program_area" ? (
                          <select
                            value={rule.value}
                            onChange={(event) =>
                              setAdvancedRules((current) =>
                                current.map((item) =>
                                  item.id === rule.id
                                    ? { ...item, value: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border p-2 text-sm"
                          >
                            {programs.map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        ) : rule.field === "contact" ? (
                          <select
                            value={rule.value}
                            onChange={(event) =>
                              setAdvancedRules((current) =>
                                current.map((item) =>
                                  item.id === rule.id
                                    ? { ...item, value: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border p-2 text-sm"
                          >
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                          </select>
                        ) : (
                          <input
                            value={rule.value}
                            onChange={(event) =>
                              setAdvancedRules((current) =>
                                current.map((item) =>
                                  item.id === rule.id
                                    ? { ...item, value: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border p-2 text-base sm:text-sm"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setAdvancedRules((current) =>
                              current.filter((item) => item.id !== rule.id),
                            )
                          }
                          className="rounded-lg px-3 text-sm font-semibold text-[#9A4039]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addAdvancedRule}
                    className="mt-4 w-full rounded-xl border border-dashed border-[#C8CBCC] px-4 py-2.5 text-sm font-semibold"
                  >
                    + Add Filter
                  </button>
                </div>
              )}

              {panel === "sort" && (
                <div className="absolute right-0 top-full z-50 mt-3 w-full max-w-[460px] rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:p-5">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">Stackable Sort</h3>
                      <p className="mt-1 text-xs text-[#626A70]">
                        Rules apply from top to bottom.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSortRules([
                          { id: 1, field: "grantor_name", direction: "asc" },
                        ])
                      }
                      className="text-xs font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {sortRules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className="grid grid-cols-[1fr_110px_auto] gap-2 rounded-xl border bg-white p-3"
                      >
                        <select
                          value={rule.field}
                          onChange={(event) =>
                            setSortRules((current) =>
                              current.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      field: event.target.value as SortField,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="min-w-0 rounded-lg border p-2 text-sm"
                        >
                          {(Object.keys(SORT_LABELS) as SortField[]).map(
                            (field) => (
                              <option key={field} value={field}>
                                {SORT_LABELS[field]}
                              </option>
                            ),
                          )}
                        </select>
                        <select
                          value={rule.direction}
                          onChange={(event) =>
                            setSortRules((current) =>
                              current.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      direction: event.target
                                        .value as SortDirection,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border p-2 text-sm"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                        <div className="flex">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              setSortRules((current) => {
                                const copy = [...current];
                                [copy[index - 1], copy[index]] = [
                                  copy[index],
                                  copy[index - 1],
                                ];
                                return copy;
                              })
                            }
                            className="px-2 disabled:opacity-20"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSortRules((current) =>
                                current.filter((item) => item.id !== rule.id),
                              )
                            }
                            disabled={sortRules.length === 1}
                            className="px-2 text-[#9A4039] disabled:opacity-20"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {sortRules.length < 4 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSortRules((current) => [
                          ...current,
                          {
                            id: Date.now(),
                            field:
                              (
                                [
                                  "grantor_name",
                                  "grant_minimum",
                                  "grant_maximum",
                                  "updated_at",
                                ] as SortField[]
                              ).find(
                                (field) =>
                                  !current.some((item) => item.field === field),
                              ) ?? "updated_at",
                            direction: "asc",
                          },
                        ])
                      }
                      className="mt-4 w-full rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold"
                    >
                      + Add Sort Level
                    </button>
                  )}
                </div>
              )}
              <p className="mt-3 text-xs text-[#BFC5C8]">
                {filtered.length}{" "}
                {filtered.length === 1 ? "prospect" : "prospects"}
              </p>
            </section>

            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7B8791]">
                Prospect directory
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-[#2F3038]">
                Prospect Library
              </h2>
            </div>

            <section className="relative z-0 min-h-[560px] overflow-hidden rounded-[24px] border border-[#C8CBCC] bg-[#F4F3F1] shadow-[0_12px_35px_rgba(63,91,108,0.07)]">
              {!filtered.length ? (
                <div className="p-10 text-center">
                  <h2 className="font-bold">
                    No prospects match these filters
                  </h2>
                  <p className="mt-2 text-sm text-[#626A70]">
                    Clear or adjust the current search and filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 bg-[#F4F3F1] p-3 md:hidden">
                    {filtered.map((prospect) => (
                      <button
                        type="button"
                        key={prospect.id}
                        onClick={() => setSelectedId(prospect.id)}
                        className={`w-full rounded-[20px] border p-4 text-left shadow-sm transition duration-200 active:scale-[0.995] ${selectedId === prospect.id ? "border-[#2F3038] bg-[#F2D9D5] shadow-[inset_5px_0_0_#2F3038,0_10px_26px_rgba(47,48,56,0.10)]" : "border-[#D1D3D4] bg-white hover:-translate-y-0.5 hover:border-[#AEB3B6] hover:shadow-md"}`}
                      >
                        <div className="flex justify-between gap-3">
                          <h2 className="text-lg font-bold">
                            {prospect.grantor_name}
                          </h2>
                          <span>→</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {list(prospect.program_areas).map((area) => (
                            <span
                              key={area}
                              className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-2.5 py-1 text-[11px] font-semibold"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl border border-[#D7D9DA] bg-[#F4F3F1] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#778189]">
                              Minimum Grant
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-[#3E454B]">
                              {currency(prospect.grant_minimum) ||
                                "Not specified"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-[#D7D9DA] bg-[#F4F3F1] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#778189]">
                              Maximum Grant
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-[#3E454B]">
                              {currency(prospect.grant_maximum) ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {list(prospect.categories).map((category) => (
                            <span
                              key={category}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggle(category, setQuickCategories);
                                setPanel("quick");
                              }}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(category, categoryColorMap)}`}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-[#2F3038] text-white">
                        <tr>
                          <th className="border-b border-white/10 p-5 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                            Grantor
                          </th>
                          <th className="border-b border-white/10 p-5 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                            Program Areas
                          </th>
                          <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                            Minimum Grant
                          </th>
                          <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                            Maximum Grant
                          </th>
                          <th className="border-b border-white/10 p-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                            Categories
                          </th>
                          <th className="border-b border-white/10 p-5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D7D9DA]">
                        {filtered.map((prospect, index) => (
                          <tr
                            key={prospect.id}
                            onClick={() => setSelectedId(prospect.id)}
                            className={`group cursor-pointer transition-all duration-200 ${selectedId === prospect.id ? "bg-[#F2D9D5] shadow-[inset_6px_0_0_#2F3038,0_8px_24px_rgba(47,48,56,0.10)]" : index % 2 === 0 ? "bg-[#F4F3F1] hover:bg-white" : "bg-[#ECEDEE] hover:bg-white"}`}
                          >
                            <td className="border-l-4 border-transparent p-5 align-top text-left transition-colors group-hover:border-[#C2A05A]">
                              <div className="flex min-w-[170px] items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-xs font-bold tracking-wide text-[#444B51] shadow-sm">
                                  {prospect.grantor_name
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((word) => word.charAt(0).toUpperCase())
                                    .join("") || "—"}
                                </span>
                                <span className="block font-semibold leading-5 text-[#3E454B]">
                                  {prospect.grantor_name || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="p-5 align-top text-left">
                              <div className="flex max-w-md flex-wrap gap-1.5">
                                {list(prospect.program_areas).map((area) => (
                                  <span
                                    key={area}
                                    className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-2.5 py-1 text-[11px] font-semibold"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-5 align-top text-center">
                              <div className="inline-flex min-w-[120px] flex-col rounded-xl border border-[#C8CBCC] bg-white px-4 py-3 shadow-sm">
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#778189]">
                                  From
                                </span>
                                <span className="mt-1 text-sm font-bold text-[#3E454B]">
                                  {currency(prospect.grant_minimum) ||
                                    "Not specified"}
                                </span>
                              </div>
                            </td>
                            <td className="p-5 align-top text-center">
                              <div className="inline-flex min-w-[120px] flex-col rounded-xl border border-[#C8CBCC] bg-white px-4 py-3 shadow-sm">
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#778189]">
                                  Up to
                                </span>
                                <span className="mt-1 text-sm font-bold text-[#3E454B]">
                                  {currency(prospect.grant_maximum) ||
                                    "Not specified"}
                                </span>
                              </div>
                            </td>
                            <td className="p-5 align-top">
                              <div className="flex max-w-sm flex-wrap gap-1.5">
                                {list(prospect.categories).map((category) => (
                                  <button
                                    type="button"
                                    key={category}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggle(category, setQuickCategories);
                                      setPanel("quick");
                                    }}
                                    title="Add to Quick Filters"
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${getCategoryStyle(category, categoryColorMap)}`}
                                  >
                                    {category}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-5 transition group-hover:translate-x-0.5">
                              →
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <div className="mt-4 flex justify-start">
              <div className="inline-flex items-center gap-3 rounded-xl border border-[#C8CBCC] bg-[#E8D7C8] px-5 py-3 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#B7655E]" />
                <span className="text-sm font-semibold text-[#4B5359]">
                  <span className="font-bold text-[#2F3038]">
                    {filtered.length}
                  </span>{" "}
                  {filtered.length === 1 ? "Prospect" : "Prospects"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ProspectDrawer
        prospect={selected}
        categoryColorMap={categoryColorMap}
        navigationProspects={filtered}
        onNavigate={setSelectedId}
        onClose={() => setSelectedId(null)}
      />
    </main>
  );
}