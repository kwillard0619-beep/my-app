"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import type { Prospect } from "./types";

type SortOption =
  | "name-asc"
  | "name-desc"
  | "grant-desc"
  | "updated-desc";

function normalizeList(values: string[] | null) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

function toAmount(value: number | string | null) {
  if (value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function formatCurrency(value: number | string | null) {
  const amount = toAmount(value);
  if (amount === null) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatGrantRange(prospect: Prospect) {
  const minimum = formatCurrency(prospect.grant_minimum);
  const maximum = formatCurrency(prospect.grant_maximum);

  if (minimum && maximum) return `${minimum} – ${maximum}`;
  if (maximum) return `Up to ${maximum}`;
  if (minimum) return `From ${minimum}`;
  return "Range not listed";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ProspectLibrary({
  initialProspects,
}: {
  initialProspects: Prospect[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [prospects, setProspects] =
    useState<Prospect[]>(initialProspects);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("name-asc");
  const [selectedProspectId, setSelectedProspectId] =
    useState<number | null>(null);
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);

  useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  useEffect(() => {
    const channel = supabase
      .channel("prospect-library-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prospect_library",
        },
        (
          _payload: RealtimePostgresChangesPayload<
            Record<string, unknown>
          >
        ) => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  useEffect(() => {
    if (selectedProspectId === null) return;

    if (!prospects.some((prospect) => prospect.id === selectedProspectId)) {
      setSelectedProspectId(null);
    }
  }, [prospects, selectedProspectId]);

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(
          prospects.flatMap((prospect) =>
            normalizeList(prospect.categories)
          )
        )
      ).sort((first, second) => first.localeCompare(second)),
    [prospects]
  );

  const categoryColorMap = useMemo(
    () => createCategoryColorMap(availableCategories),
    [availableCategories]
  );

  const filteredProspects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return prospects
      .filter((prospect) => {
        const categories = normalizeList(prospect.categories);
        const programAreas = normalizeList(prospect.program_areas);

        if (
          selectedCategory !== "all" &&
          !categories.some(
            (category) =>
              category.toLowerCase() === selectedCategory.toLowerCase()
          )
        ) {
          return false;
        }

        if (!normalizedSearch) return true;

        return [
          prospect.grantor_name,
          prospect.overview ?? "",
          ...categories,
          ...programAreas,
          prospect.contact?.name ?? "",
          prospect.contact?.organization ?? "",
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((first, second) => {
        if (sortOption === "name-desc") {
          return second.grantor_name.localeCompare(first.grantor_name);
        }

        if (sortOption === "grant-desc") {
          return (
            (toAmount(second.grant_maximum) ?? -1) -
            (toAmount(first.grant_maximum) ?? -1)
          );
        }

        if (sortOption === "updated-desc") {
          return (
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime()
          );
        }

        return first.grantor_name.localeCompare(second.grantor_name);
      });
  }, [prospects, search, selectedCategory, sortOption]);

  const selectedProspect =
    prospects.find(
      (prospect) => prospect.id === selectedProspectId
    ) ?? null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar
          activePath="/prospect-library"
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
        />

        <section className="min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:mb-5 sm:px-4 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                LG
              </span>
              <span className="font-bold">LG Listings</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavigationOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavigationOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-lg text-[#565E64]"
            >
              ☰
            </button>
          </div>

          <div className="relative min-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[22px] border border-white/40 bg-[#F4F3F1] shadow-[0_18px_45px_rgba(47,48,56,0.10)] sm:min-h-[calc(100vh-3.5rem)] sm:rounded-[30px]">
            <header className="relative overflow-hidden bg-[#2F3038] px-5 py-8 text-white sm:px-10 sm:py-10 lg:px-14">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#B7655E]/25 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-72 rounded-full bg-[#C2A05A]/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D8CCC7]">
                    Funder intelligence
                  </p>
                  <h1 className="mt-3 text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                    Prospect Library
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D4D9DC] sm:text-base">
                    Research potential funders, understand their program interests, and review likely grant ranges before the next opportunity opens.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
                    <span className="block text-2xl font-bold">{prospects.length}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BFC5C8]">
                      Grantors
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
                    <span className="block text-2xl font-bold">{availableCategories.length}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BFC5C8]">
                      Categories
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-3 sm:p-8 lg:p-10">
              <section className="sticky top-3 z-30 rounded-[18px] border border-white/10 bg-[#232429]/95 p-3 text-white shadow-[0_16px_36px_rgba(20,21,24,0.22)] backdrop-blur-xl sm:rounded-[22px] sm:p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_210px_auto]">
                  <label className="relative block">
                    <span className="sr-only">Search prospects</span>
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#AEB5B9]">⌕</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search grantors, programs, or contacts..."
                      className="w-full rounded-xl border border-white/15 bg-white/[0.09] py-3 pl-11 pr-4 text-base text-white outline-none placeholder:text-[#AEB5B9] focus:border-[#D1B270] focus:ring-4 focus:ring-[#D1B270]/10 sm:text-sm"
                    />
                  </label>

                  <select
                    aria-label="Filter by category"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#34353B] px-4 py-3 text-base text-white outline-none focus:border-[#D1B270] sm:text-sm"
                  >
                    <option value="all">All categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Sort prospects"
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value as SortOption)}
                    className="w-full rounded-xl border border-white/15 bg-[#34353B] px-4 py-3 text-base text-white outline-none focus:border-[#D1B270] sm:text-sm"
                  >
                    <option value="name-asc">Grantor A–Z</option>
                    <option value="name-desc">Grantor Z–A</option>
                    <option value="grant-desc">Largest grant first</option>
                    <option value="updated-desc">Recently updated</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("all");
                      setSortOption("name-asc");
                    }}
                    className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
                  >
                    Clear
                  </button>
                </div>
                <p className="mt-3 px-1 text-xs text-[#BFC5C8]">
                  {filteredProspects.length} {filteredProspects.length === 1 ? "prospect" : "prospects"}
                </p>
              </section>

              <section className="mt-6 overflow-hidden rounded-[20px] border border-[#C8CBCC] bg-white shadow-[0_12px_35px_rgba(47,48,56,0.07)] sm:rounded-[24px]">
                {filteredProspects.length === 0 ? (
                  <div className="p-8 text-center sm:p-12">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9E9E7] text-xl">◇</span>
                    <h2 className="mt-4 text-lg font-bold">No prospects match these selections</h2>
                    <p className="mt-2 text-sm text-[#626A70]">Clear the search or category filter to see more grantors.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 bg-[#F4F3F1] p-3 md:hidden">
                      {filteredProspects.map((prospect) => (
                        <button
                          key={prospect.id}
                          type="button"
                          onClick={() => setSelectedProspectId(prospect.id)}
                          className="w-full rounded-2xl border border-[#D2D4D5] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">Grantor</p>
                              <h2 className="mt-1 text-lg font-bold leading-6">{prospect.grantor_name}</h2>
                            </div>
                            <span className="text-lg text-[#778189]">→</span>
                          </div>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#626A70]">
                            {prospect.overview || "No overview is currently available."}
                          </p>
                          <p className="mt-4 text-sm font-bold text-[#2F3038]">{formatGrantRange(prospect)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {normalizeList(prospect.categories).map((category) => (
                              <span key={category} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(category, categoryColorMap)}`}>
                                {category}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[960px] border-collapse text-left">
                        <thead className="bg-[#E9E9E7] text-[10px] font-bold uppercase tracking-[0.16em] text-[#626A70]">
                          <tr>
                            <th className="px-6 py-4">Grantor</th>
                            <th className="px-6 py-4">Overview</th>
                            <th className="px-6 py-4">Grant Range</th>
                            <th className="px-6 py-4">Categories</th>
                            <th className="w-14 px-4 py-4"><span className="sr-only">Open</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E3E3]">
                          {filteredProspects.map((prospect) => (
                            <tr
                              key={prospect.id}
                              onClick={() => setSelectedProspectId(prospect.id)}
                              className="group cursor-pointer bg-white transition hover:bg-[#FAF8F5]"
                            >
                              <td className="px-6 py-5 align-top">
                                <p className="font-bold text-[#2F3038]">{prospect.grantor_name}</p>
                                <p className="mt-1 text-xs text-[#92999E]">Updated {formatDate(prospect.updated_at)}</p>
                              </td>
                              <td className="max-w-md px-6 py-5 align-top text-sm leading-6 text-[#626A70]">
                                <p className="line-clamp-3">{prospect.overview || "No overview is currently available."}</p>
                              </td>
                              <td className="whitespace-nowrap px-6 py-5 align-top text-sm font-bold">{formatGrantRange(prospect)}</td>
                              <td className="px-6 py-5 align-top">
                                <div className="flex max-w-sm flex-wrap gap-1.5">
                                  {normalizeList(prospect.categories).map((category) => (
                                    <span key={category} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(category, categoryColorMap)}`}>
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-5 align-top text-[#92999E] transition group-hover:translate-x-0.5 group-hover:text-[#2F3038]">→</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>

      {selectedProspect && (
        <div
          role="presentation"
          className="fixed inset-0 z-[70] flex justify-end bg-black/35"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProspectId(null);
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-drawer-title"
            className="flex h-[100dvh] w-full max-w-[720px] flex-col overflow-hidden border-l border-white/10 bg-[#F4F3F1] shadow-[-24px_0_70px_rgba(18,19,22,0.30)]"
          >
            <header className="relative overflow-hidden bg-[#2F3038] px-5 py-6 text-white sm:px-8 sm:py-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#B7655E]/25 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">Prospect record</p>
                  <h2 id="prospect-drawer-title" className="mt-2 text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-3xl">
                    {selectedProspect.grantor_name}
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-[#D4D9DC]">{formatGrantRange(selectedProspect)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProspectId(null)}
                  aria-label="Close prospect"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl transition hover:bg-white/20"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-7">
              <div className="space-y-5">
                <section className="rounded-[20px] border border-[#C8CBCC] bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Overview</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#565E64]">
                    {selectedProspect.overview || "No overview is currently available."}
                  </p>
                </section>

                <section className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Categories</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {normalizeList(selectedProspect.categories).length > 0 ? normalizeList(selectedProspect.categories).map((category) => (
                        <span key={category} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(category, categoryColorMap)}`}>
                          {category}
                        </span>
                      )) : <span className="text-sm text-[#92999E]">None listed</span>}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#C8CBCC] bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Program Areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {normalizeList(selectedProspect.program_areas).length > 0 ? normalizeList(selectedProspect.program_areas).map((area) => (
                        <span key={area} className="rounded-full border border-[#C8CBCC] bg-[#E9E9E7] px-3 py-1.5 text-xs font-semibold text-[#565E64]">
                          {area}
                        </span>
                      )) : <span className="text-sm text-[#92999E]">None listed</span>}
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border border-[#C8CBCC] bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">Contact</p>
                  {selectedProspect.contact ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#F4F3F1] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92999E]">Name</p>
                        <p className="mt-1 text-sm font-semibold">{selectedProspect.contact.name || "Not provided"}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F4F3F1] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92999E]">Organization</p>
                        <p className="mt-1 text-sm font-semibold">{selectedProspect.contact.organization || "Not provided"}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F4F3F1] p-4 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92999E]">Email</p>
                        {selectedProspect.contact.email ? (
                          <a href={`mailto:${selectedProspect.contact.email}`} className="mt-1 block break-all text-sm font-semibold text-[#8F4E49] underline decoration-[#8F4E49]/30 underline-offset-4">
                            {selectedProspect.contact.email}
                          </a>
                        ) : <p className="mt-1 text-sm font-semibold">Not provided</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#626A70]">No contact is assigned, or contact information requires a signed-in account.</p>
                  )}
                </section>

                <section className="grid grid-cols-2 gap-3 text-xs text-[#778189]">
                  <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4">
                    <span className="block font-bold uppercase tracking-[0.14em]">Created</span>
                    <span className="mt-1 block">{formatDate(selectedProspect.created_at)}</span>
                  </div>
                  <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4">
                    <span className="block font-bold uppercase tracking-[0.14em]">Updated</span>
                    <span className="mt-1 block">{formatDate(selectedProspect.updated_at)}</span>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}