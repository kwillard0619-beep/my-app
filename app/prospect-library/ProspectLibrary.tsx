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
import { createCategoryColorMap, getCategoryStyle } from "../components/categoryColors";
import type { Prospect } from "./types";

type SortField = "grantor_name" | "grant_minimum" | "grant_maximum" | "updated_at";
type SortDirection = "asc" | "desc";
type SortRule = { id: number; field: SortField; direction: SortDirection };
type AdvancedField = "grantor" | "category" | "program_area" | "rfp_cycle" | "contact";
type AdvancedRule = { id: number; field: AdvancedField; operator: "is" | "is_not"; value: string };

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

export default function ProspectLibrary({ initialProspects }: { initialProspects: Prospect[] }) {
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
  const [panel, setPanel] = useState<"quick" | "advanced" | "sort" | null>(null);

  useEffect(() => setProspects(initialProspects), [initialProspects]);

  useEffect(() => {
    const channel = supabase
      .channel("prospect-library-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prospect_library" },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => router.refresh()
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [router, supabase]);

  const categories = useMemo(
    () => Array.from(new Set(prospects.flatMap((item) => list(item.categories)))).sort(),
    [prospects]
  );
  const programs = useMemo(
    () => Array.from(new Set(prospects.flatMap((item) => list(item.program_areas)))).sort(),
    [prospects]
  );
  const categoryColorMap = useMemo(() => createCategoryColorMap(categories), [categories]);
  const largestProspect = useMemo(
    () =>
      [...prospects]
        .filter((prospect) => amount(prospect.grant_maximum) !== null)
        .sort(
          (first, second) =>
            (amount(second.grant_maximum) ?? 0) -
            (amount(first.grant_maximum) ?? 0)
        )[0] ?? null,
    [prospects]
  );
  const categoryCoverage = useMemo(() => {
    const counts = new Map<string, number>();
    prospects.forEach((prospect) =>
      list(prospect.categories).forEach((category) =>
        counts.set(category, (counts.get(category) ?? 0) + 1)
      )
    );
    return Array.from(counts, ([category, count]) => ({ category, count }))
      .sort((first, second) => second.count - first.count || first.category.localeCompare(second.category))
      .slice(0, 3);
  }, [prospects]);
  const recentlyUpdated = useMemo(
    () =>
      [...prospects]
        .sort(
          (first, second) =>
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime()
        )
        .slice(0, 3),
    [prospects]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const min = minimumGrant === "" ? null : Number(minimumGrant);
    const max = maximumGrant === "" ? null : Number(maximumGrant);

    const rows = prospects.filter((prospect) => {
      const prospectCategories = list(prospect.categories);
      const prospectPrograms = list(prospect.program_areas);
      if (query && ![
        prospect.grantor_name,
        prospect.overview ?? "",
        prospect.rfp_cycle ?? "",
        prospect.contact?.name ?? "",
        prospect.contact?.organization ?? "",
        ...prospectCategories,
        ...prospectPrograms,
      ].some((value) => value.toLowerCase().includes(query))) return false;
      if (quickCategories.length && !quickCategories.some((value) => prospectCategories.includes(value))) return false;
      if (quickPrograms.length && !quickPrograms.some((value) => prospectPrograms.includes(value))) return false;
      if (min !== null && (amount(prospect.grant_maximum) ?? -Infinity) < min) return false;
      if (max !== null && (amount(prospect.grant_minimum) ?? Infinity) > max) return false;

      return advancedRules.every((rule) => {
        let matches = false;
        if (rule.field === "grantor") matches = prospect.grantor_name.toLowerCase().includes(rule.value.toLowerCase());
        if (rule.field === "category") matches = prospectCategories.includes(rule.value);
        if (rule.field === "program_area") matches = prospectPrograms.includes(rule.value);
        if (rule.field === "rfp_cycle") matches = (prospect.rfp_cycle ?? "").toLowerCase().includes(rule.value.toLowerCase());
        if (rule.field === "contact") matches = rule.value === "assigned" ? Boolean(prospect.contact_id) : !prospect.contact_id;
        return rule.operator === "is" ? matches : !matches;
      });
    });

    return [...rows].sort((first, second) => {
      for (const rule of sortRules) {
        let comparison = 0;
        if (rule.field === "grantor_name") comparison = first.grantor_name.localeCompare(second.grantor_name);
        if (rule.field === "grant_minimum") comparison = (amount(first.grant_minimum) ?? Infinity) - (amount(second.grant_minimum) ?? Infinity);
        if (rule.field === "grant_maximum") comparison = (amount(first.grant_maximum) ?? Infinity) - (amount(second.grant_maximum) ?? Infinity);
        if (rule.field === "updated_at") comparison = new Date(first.updated_at).getTime() - new Date(second.updated_at).getTime();
        if (comparison) return rule.direction === "asc" ? comparison : -comparison;
      }
      return 0;
    });
  }, [prospects, search, quickCategories, quickPrograms, minimumGrant, maximumGrant, advancedRules, sortRules]);

  const selected = prospects.find((prospect) => prospect.id === selectedId) ?? null;
  const selectedIndex = selected
    ? filtered.findIndex((prospect) => prospect.id === selected.id)
    : -1;
  const navigateProspect = (direction: -1 | 1) => {
    const nextProspect = filtered[selectedIndex + direction];
    if (nextProspect) setSelectedId(nextProspect.id);
  };
  const quickCount = quickCategories.length + quickPrograms.length + Number(Boolean(minimumGrant)) + Number(Boolean(maximumGrant));

  const toggle = (value: string, setter: Dispatch<SetStateAction<string[]>>) =>
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const exportCsv = () => {
    const headers = ["Grantor", "Overview", "Categories", "Program Areas", "Grant Minimum", "Grant Maximum", "RFP Cycle", "Contact Name", "Contact Email", "Contact Organization", "Created At", "Updated At"];
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
    const blob = new Blob([[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lg-listings-prospect-library.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const addAdvancedRule = () => setAdvancedRules((current) => [...current, {
    id: Date.now(), field: "category", operator: "is", value: categories[0] ?? "",
  }]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar activePath="/prospect-library" mobileOpen={mobileNavigationOpen} onMobileClose={() => setMobileNavigationOpen(false)} />
        <section className="min-w-0 flex-1 py-4 sm:py-6">
          <div className="mx-auto max-w-[1680px] px-3 sm:px-5 lg:px-6">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/75 px-4 py-3 backdrop-blur lg:hidden">
              <Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">LG</span><span className="font-bold">LG Listings</span></Link>
              <button type="button" onClick={() => setMobileNavigationOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-lg" aria-label="Open navigation">☰</button>
            </div>

            <header className="relative overflow-hidden rounded-[22px] text-white shadow-[0_18px_45px_rgba(47,48,56,0.16)] sm:rounded-[28px]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2F3038] via-[#3E454B] via-[35%] via-[#66717A] via-[55%] via-[#7A858E] via-[75%] to-[#C2A05A]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden sm:block"><div className="absolute inset-0 bg-gradient-to-l from-[#C2A05A]/20 via-[#9FB9C9]/10 to-transparent blur-[35px]" /><img src="/lg-listings-logo.png" alt="" aria-hidden="true" className="absolute right-8 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-20 mix-blend-multiply xl:right-16 xl:h-36" /></div>
              <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-8 lg:px-10 lg:pt-9">
                <div className="max-w-3xl sm:pr-52">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E1DFDE]">Prospect Research Workspace</p>
                  <h1 className="text-[2rem] font-bold leading-[1.08] tracking-[-0.025em] sm:text-4xl lg:text-[2.65rem]">Prospect Library</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E9E9E7] sm:text-base">Research potential funders, compare program interests, and understand giving patterns before the next opportunity opens.</p>
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
                  Explore the strongest funding range, category concentration, and recently updated research.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_1fr]">
                <article className="group relative min-h-[250px] overflow-hidden rounded-[24px] border border-[#C8CBCC] bg-white p-5 shadow-[0_12px_34px_rgba(47,48,56,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(47,48,56,0.11)] sm:p-6">
                  <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#D8CCC7]/65 blur-3xl" />
                  <div className="relative flex h-full flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                      Largest potential grant
                    </p>
                    {largestProspect ? (
                      <>
                        <h3 className="mt-5 text-xl font-bold leading-7">
                          {largestProspect.grantor_name}
                        </h3>
                        <p className="mt-3 text-2xl font-bold tracking-[-0.025em] text-[#8F4E49]">
                          {grantRange(largestProspect)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedId(largestProspect.id)}
                          className="mt-auto flex w-full items-center justify-between rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] px-4 py-3 text-left text-sm font-semibold transition hover:border-[#B7655E] hover:bg-white"
                        >
                          Open prospect
                          <span aria-hidden="true">→</span>
                        </button>
                      </>
                    ) : (
                      <p className="mt-5 text-sm text-[#778189]">No grant ranges are currently listed.</p>
                    )}
                  </div>
                </article>

                <article className="min-h-[250px] rounded-[24px] border border-[#C8CBCC] bg-[#E9E9E7] p-5 shadow-[0_12px_34px_rgba(47,48,56,0.06)] sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                    Category coverage
                  </p>
                  <h3 className="mt-2 text-lg font-bold">Leading funding interests</h3>
                  <div className="mt-5 space-y-3">
                    {categoryCoverage.map(({ category, count }) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          toggle(category, setQuickCategories);
                          setPanel("quick");
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${getCategoryStyle(category, categoryColorMap)}`}
                      >
                        <span>{category}</span>
                        <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs font-bold">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="min-h-[250px] rounded-[24px] border border-[#C8CBCC] bg-white p-5 shadow-[0_12px_34px_rgba(47,48,56,0.07)] sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                    Recently updated
                  </p>
                  <h3 className="mt-2 text-lg font-bold">Latest prospect research</h3>
                  <div className="mt-5 space-y-2.5">
                    {recentlyUpdated.map((prospect) => (
                      <button
                        key={prospect.id}
                        type="button"
                        onClick={() => setSelectedId(prospect.id)}
                        className="group/recent flex w-full items-center gap-3 rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] px-3.5 py-3 text-left transition hover:border-[#B7655E] hover:bg-white"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2F3038] text-[10px] font-bold text-white">
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
                          <span className="mt-0.5 block text-[10px] text-[#778189]">
                            {dateLabel(prospect.updated_at)}
                          </span>
                        </span>
                        <span className="text-[#778189] opacity-40 transition group-hover/recent:translate-x-0.5 group-hover/recent:opacity-100">→</span>
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="sticky top-2 z-30 isolate mb-6 overflow-visible rounded-[22px] border border-white/15 bg-black/85 px-3 py-4 shadow-[0_18px_42px_rgba(18,19,22,0.34)] backdrop-blur-xl sm:top-0 sm:mb-8 sm:rounded-[26px] sm:px-7 sm:py-5">
              <div className="relative mb-4 hidden sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">Search and refine</p><h2 className="mt-1 text-xl font-bold text-white">Explore potential funders</h2></div>
              <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7B8791]">⌕</span>
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && setSearch(searchInput.trim())} placeholder="Search grantors, programs, categories, key words..." className="w-full rounded-2xl border border-[#D8C3B9] bg-white py-3.5 pl-11 pr-12 text-base text-[#334B59] outline-none focus:ring-4 focus:ring-[#AF915A]/30 sm:text-sm" />
                  {searchInput && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute inset-y-0 right-0 w-12 text-[#778189]" aria-label="Clear search">×</button>}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button type="button" onClick={() => setPanel(panel === "quick" ? null : "quick")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${panel === "quick" ? "bg-white text-[#2F3038]" : "border-white/20 bg-white/10 text-white"}`}>Quick Filter {quickCount > 0 && <span className="ml-1 rounded-full bg-[#B7655E] px-2 py-0.5 text-xs text-white">{quickCount}</span>}</button>
                  <button type="button" onClick={() => setPanel(panel === "advanced" ? null : "advanced")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${panel === "advanced" ? "bg-white text-[#2F3038]" : "border-white/20 bg-white/10 text-white"}`}>Advanced {advancedRules.length > 0 && <span className="ml-1 rounded-full bg-[#B7655E] px-2 py-0.5 text-xs text-white">{advancedRules.length}</span>}</button>
                </div>
                <button type="button" onClick={() => setPanel(panel === "sort" ? null : "sort")} className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white">Sort by ({sortRules.length})</button>
                <button type="button" onClick={exportCsv} disabled={!filtered.length} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2F3038] disabled:opacity-40">Export CSV</button>
              </div>

              {panel === "quick" && <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[72dvh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:left-6 sm:right-6 sm:p-6">
                <div className="flex items-center justify-between"><div><h3 className="font-bold">Quick Filters</h3><p className="mt-1 text-sm text-[#626A70]">Selections within a section use OR; sections combine with AND.</p></div><button type="button" onClick={() => { setQuickCategories([]); setQuickPrograms([]); setMinimumGrant(""); setMaximumGrant(""); }} className="text-sm font-semibold">Clear</button></div>
                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  <div><p className="text-xs font-bold uppercase tracking-wider">Categories</p><div className="mt-3 flex flex-wrap gap-2">{categories.map((category) => <button type="button" key={category} onClick={() => toggle(category, setQuickCategories)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${quickCategories.includes(category) ? getCategoryStyle(category, categoryColorMap) : "border-[#C8CBCC] bg-white"}`}>{category}</button>)}</div></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider">Program Areas</p><div className="mt-3 flex flex-wrap gap-2">{programs.map((program) => <button type="button" key={program} onClick={() => toggle(program, setQuickPrograms)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${quickPrograms.includes(program) ? "border-[#8FAAB1] bg-[#AFC6CC]" : "border-[#C8CBCC] bg-white"}`}>{program}</button>)}</div></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider">Grant Range</p><div className="mt-3 grid grid-cols-2 gap-3"><input type="number" min="0" value={minimumGrant} onChange={(event) => setMinimumGrant(event.target.value)} placeholder="Minimum" className="min-w-0 rounded-xl border border-[#C8CBCC] px-3 py-2 text-base sm:text-sm" /><input type="number" min="0" value={maximumGrant} onChange={(event) => setMaximumGrant(event.target.value)} placeholder="Maximum" className="min-w-0 rounded-xl border border-[#C8CBCC] px-3 py-2 text-base sm:text-sm" /></div></div>
                </div>
              </div>}

              {panel === "advanced" && <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[72dvh] overflow-y-auto rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:left-6 sm:right-6 sm:p-6">
                <div className="flex items-center justify-between"><div><h3 className="font-bold">Advanced Filters</h3><p className="mt-1 text-sm text-[#626A70]">All rules combine with AND.</p></div><button type="button" onClick={() => setAdvancedRules([])} className="text-sm font-semibold">Clear</button></div>
                <div className="mt-4 space-y-3">{advancedRules.map((rule) => <div key={rule.id} className="grid gap-2 rounded-xl border border-[#D7D9DA] bg-white p-3 sm:grid-cols-[1fr_130px_1fr_auto]">
                  <select value={rule.field} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, field: event.target.value as AdvancedField, value: "" } : item))} className="rounded-lg border p-2 text-sm"><option value="grantor">Grantor</option><option value="category">Category</option><option value="program_area">Program Area</option><option value="rfp_cycle">RFP Cycle</option><option value="contact">Contact</option></select>
                  <select value={rule.operator} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, operator: event.target.value as "is" | "is_not" } : item))} className="rounded-lg border p-2 text-sm"><option value="is">is</option><option value="is_not">is not</option></select>
                  {rule.field === "category" ? <select value={rule.value} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} className="rounded-lg border p-2 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select> : rule.field === "program_area" ? <select value={rule.value} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} className="rounded-lg border p-2 text-sm">{programs.map((value) => <option key={value}>{value}</option>)}</select> : rule.field === "contact" ? <select value={rule.value} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} className="rounded-lg border p-2 text-sm"><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select> : <input value={rule.value} onChange={(event) => setAdvancedRules((current) => current.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} className="rounded-lg border p-2 text-base sm:text-sm" />}
                  <button type="button" onClick={() => setAdvancedRules((current) => current.filter((item) => item.id !== rule.id))} className="rounded-lg px-3 text-sm font-semibold text-[#9A4039]">Remove</button>
                </div>)}</div>
                <button type="button" onClick={addAdvancedRule} className="mt-4 w-full rounded-xl border border-dashed border-[#C8CBCC] px-4 py-2.5 text-sm font-semibold">+ Add Filter</button>
              </div>}

              {panel === "sort" && <div className="absolute right-0 top-full z-50 mt-3 w-full max-w-[460px] rounded-2xl border border-[#C8CBCC] bg-[#F4F3F1] p-4 text-[#2F3038] shadow-2xl sm:p-5"><div className="flex justify-between"><div><h3 className="font-bold">Stackable Sort</h3><p className="mt-1 text-xs text-[#626A70]">Rules apply from top to bottom.</p></div><button type="button" onClick={() => setSortRules([{ id: 1, field: "grantor_name", direction: "asc" }])} className="text-xs font-semibold">Reset</button></div><div className="mt-4 space-y-2">{sortRules.map((rule, index) => <div key={rule.id} className="grid grid-cols-[1fr_110px_auto] gap-2 rounded-xl border bg-white p-3"><select value={rule.field} onChange={(event) => setSortRules((current) => current.map((item) => item.id === rule.id ? { ...item, field: event.target.value as SortField } : item))} className="min-w-0 rounded-lg border p-2 text-sm">{(Object.keys(SORT_LABELS) as SortField[]).map((field) => <option key={field} value={field}>{SORT_LABELS[field]}</option>)}</select><select value={rule.direction} onChange={(event) => setSortRules((current) => current.map((item) => item.id === rule.id ? { ...item, direction: event.target.value as SortDirection } : item))} className="rounded-lg border p-2 text-sm"><option value="asc">Ascending</option><option value="desc">Descending</option></select><div className="flex"><button type="button" disabled={index === 0} onClick={() => setSortRules((current) => { const copy = [...current]; [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]; return copy; })} className="px-2 disabled:opacity-20">↑</button><button type="button" onClick={() => setSortRules((current) => current.filter((item) => item.id !== rule.id))} disabled={sortRules.length === 1} className="px-2 text-[#9A4039] disabled:opacity-20">×</button></div></div>)}</div>{sortRules.length < 4 && <button type="button" onClick={() => setSortRules((current) => [...current, { id: Date.now(), field: (["grantor_name", "grant_minimum", "grant_maximum", "updated_at"] as SortField[]).find((field) => !current.some((item) => item.field === field)) ?? "updated_at", direction: "asc" }])} className="mt-4 w-full rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold">+ Add Sort Level</button>}</div>}
              <p className="mt-3 text-xs text-[#BFC5C8]">{filtered.length} {filtered.length === 1 ? "prospect" : "prospects"}</p>
            </section>

            <section className="overflow-hidden rounded-[20px] border border-[#C8CBCC] bg-white shadow-sm sm:rounded-[24px]">
              {!filtered.length ? <div className="p-10 text-center"><h2 className="font-bold">No prospects match these filters</h2><p className="mt-2 text-sm text-[#626A70]">Clear or adjust the current search and filters.</p></div> : <>
                <div className="space-y-3 bg-[#F4F3F1] p-3 md:hidden">{filtered.map((prospect) => <button type="button" key={prospect.id} onClick={() => setSelectedId(prospect.id)} className={`w-full rounded-[20px] border p-4 text-left shadow-sm transition duration-200 active:scale-[0.995] ${selectedId === prospect.id ? "border-[#2F3038] bg-[#F2D9D5] shadow-[inset_5px_0_0_#2F3038,0_10px_26px_rgba(47,48,56,0.10)]" : "border-[#D1D3D4] bg-white hover:-translate-y-0.5 hover:border-[#AEB3B6] hover:shadow-md"}`}><div className="flex justify-between gap-3"><h2 className="text-lg font-bold">{prospect.grantor_name}</h2><span>→</span></div><div className="mt-3 flex flex-wrap gap-2">{list(prospect.program_areas).map((area) => <span key={area} className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-2.5 py-1 text-[11px] font-semibold">{area}</span>)}</div><p className="mt-4 text-sm font-bold">{grantRange(prospect)}</p><div className="mt-3 flex flex-wrap gap-2">{list(prospect.categories).map((category) => <span key={category} onClick={(event) => { event.stopPropagation(); toggle(category, setQuickCategories); setPanel("quick"); }} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(category, categoryColorMap)}`}>{category}</span>)}</div></button>)}</div>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#E9E9E7] text-[10px] font-bold uppercase tracking-[0.16em] text-[#626A70]"><tr><th className="px-6 py-4">Grantor</th><th className="px-6 py-4">Program Areas</th><th className="px-6 py-4">Grant Range</th><th className="px-6 py-4">Categories</th><th /></tr></thead><tbody className="divide-y divide-[#E2E3E3]">{filtered.map((prospect, index) => <tr key={prospect.id} onClick={() => setSelectedId(prospect.id)} className={`group cursor-pointer transition-all duration-200 ${selectedId === prospect.id ? "bg-[#F2D9D5] shadow-[inset_6px_0_0_#2F3038,0_8px_24px_rgba(47,48,56,0.10)]" : index % 2 === 0 ? "bg-[#F4F3F1] hover:bg-white hover:shadow-[inset_4px_0_0_#B7655E]" : "bg-white hover:bg-[#FAF8F5] hover:shadow-[inset_4px_0_0_#B7655E]"}`}><td className="px-6 py-5 align-top font-bold">{prospect.grantor_name}</td><td className="px-6 py-5 align-top"><div className="flex max-w-md flex-wrap gap-1.5">{list(prospect.program_areas).map((area) => <span key={area} className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-2.5 py-1 text-[11px] font-semibold">{area}</span>)}</div></td><td className="whitespace-nowrap px-6 py-5 align-top text-sm font-bold">{grantRange(prospect)}</td><td className="px-6 py-5 align-top"><div className="flex max-w-sm flex-wrap gap-1.5">{list(prospect.categories).map((category) => <button type="button" key={category} onClick={(event) => { event.stopPropagation(); toggle(category, setQuickCategories); setPanel("quick"); }} title="Add to Quick Filters" className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${getCategoryStyle(category, categoryColorMap)}`}>{category}</button>)}</div></td><td className="px-4 py-5 transition group-hover:translate-x-0.5">→</td></tr>)}</tbody></table></div>
              </>}
            </section>
          </div>
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-[70] flex justify-end bg-black/35" onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}><aside role="dialog" aria-modal="true" className="relative flex h-[100dvh] w-full max-w-[720px] flex-col overflow-hidden bg-[#F4F3F1] shadow-2xl">
        <nav aria-label="Prospect navigation" className="absolute inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-white/10 bg-[#25262B] py-5 text-white sm:flex">
          <button type="button" onClick={() => navigateProspect(-1)} disabled={selectedIndex <= 0} aria-label="Previous prospect" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-25">↑</button>
          <div className="my-auto -rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] text-[#BFC5C8]">{selectedIndex + 1} of {filtered.length}</div>
          <button type="button" onClick={() => navigateProspect(1)} disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1} aria-label="Next prospect" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-25">↓</button>
        </nav>
        <header className="bg-[#2F3038] px-5 py-6 text-white sm:ml-16 sm:px-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">Prospect record</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{selected.grantor_name}</h2></div><button type="button" onClick={() => setSelectedId(null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl">×</button></div></header><div className="flex-1 space-y-5 overflow-y-auto p-4 pb-24 sm:ml-16 sm:p-7">
        <section className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Overview</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#565E64]">{selected.overview || "No overview is currently available."}</p></section>
        <section className="grid gap-5 sm:grid-cols-2"><div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Categories</p><div className="mt-3 flex flex-wrap gap-2">{list(selected.categories).map((category) => <span key={category} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(category, categoryColorMap)}`}>{category}</span>)}</div></div><div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Program Areas</p><div className="mt-3 flex flex-wrap gap-2">{list(selected.program_areas).map((area) => <span key={area} className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-3 py-1.5 text-xs font-semibold">{area}</span>)}</div></div></section>
        <section className="grid gap-5 sm:grid-cols-2"><div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">RFP Cycle</p><p className="mt-3 text-sm font-semibold">{selected.rfp_cycle || "Not yet documented"}</p></div><div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Grant Range</p><p className="mt-3 text-lg font-bold">{grantRange(selected)}</p></div></section>
        <section className="rounded-[20px] border border-[#C8CBCC] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Contact</p>{selected.contact ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#F4F3F1] p-4"><div className="flex justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-[#92999E]">Full Name</p>{selected.contact.name && <button type="button" onClick={() => copyText(selected.contact!.name!)} className="text-xs font-semibold">Copy</button>}</div><p className="mt-1 text-sm font-semibold">{selected.contact.name || "Not provided"}</p></div><div className="rounded-2xl bg-[#F4F3F1] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#92999E]">Organization</p><p className="mt-1 text-sm font-semibold">{selected.contact.organization || "Not provided"}</p></div><div className="rounded-2xl bg-[#F4F3F1] p-4 sm:col-span-2"><div className="flex justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-[#92999E]">Email</p>{selected.contact.email && <button type="button" onClick={() => copyText(selected.contact!.email!)} className="text-xs font-semibold">Copy</button>}</div>{selected.contact.email ? <a href={`mailto:${selected.contact.email}`} className="mt-1 block break-all text-sm font-semibold text-[#8F4E49] underline">{selected.contact.email}</a> : <p className="mt-1 text-sm">Not provided</p>}</div></div> : <p className="mt-3 text-sm text-[#626A70]">No contact is assigned, or contact information requires a signed-in account.</p>}</section>
        <section className="grid grid-cols-2 gap-3 text-xs text-[#778189]"><div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4"><b className="block uppercase tracking-wider">Created</b><span className="mt-1 block">{dateLabel(selected.created_at)}</span></div><div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4"><b className="block uppercase tracking-wider">Updated</b><span className="mt-1 block">{dateLabel(selected.updated_at)}</span></div></section>
      </div>
      <nav aria-label="Prospect navigation" className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[#C8CBCC] bg-white/95 px-4 py-3 shadow-[0_-10px_28px_rgba(47,48,56,0.10)] backdrop-blur sm:hidden">
        <button type="button" onClick={() => navigateProspect(-1)} disabled={selectedIndex <= 0} className="rounded-xl border border-[#C8CBCC] px-4 py-2 text-sm font-semibold disabled:opacity-30">← Previous</button>
        <span className="text-xs font-bold text-[#778189]">{selectedIndex + 1} of {filtered.length}</span>
        <button type="button" onClick={() => navigateProspect(1)} disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1} className="rounded-xl border border-[#C8CBCC] px-4 py-2 text-sm font-semibold disabled:opacity-30">Next →</button>
      </nav>
      </aside></div>}
    </main>
  );
}