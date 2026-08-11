"use client";

import { useState } from "react";
import type { Prospect } from "./types";

type Props = {
  prospect: Prospect | null;
  categoryColorMap: Record<string, string>;
  navigationProspects: Prospect[];
  onNavigate: (prospectId: number) => void;
  onClose: () => void;
};

const values = (items: string[] | null) =>
  (items ?? []).map((item) => item.trim()).filter(Boolean);

const numberValue = (value: number | string | null) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const currency = (value: number | string | null) => {
  const parsed = numberValue(value);
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
  return "Not specified";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};

export default function ProspectDrawer({
  prospect,
  categoryColorMap,
  navigationProspects,
  onNavigate,
  onClose,
}: Props) {
  const [copiedContactField, setCopiedContactField] = useState<
    "name" | "email" | null
  >(null);

  if (!prospect) return null;

  const currentIndex = navigationProspects.findIndex(
    (item) => String(item.id) === String(prospect.id),
  );
  const hasPrevious = currentIndex > 0;
  const hasNext =
    currentIndex !== -1 && currentIndex < navigationProspects.length - 1;
  const recordPosition = currentIndex >= 0 ? currentIndex + 1 : 1;
  const recordTotal = Math.max(navigationProspects.length, 1);

  const navigate = (offset: -1 | 1) => {
    const next = navigationProspects[currentIndex + offset];
    if (next) onNavigate(next.id);
  };

  const copyContactValue = async (value: string, field: "name" | "email") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedContactField(field);
      window.setTimeout(
        () =>
          setCopiedContactField((current) =>
            current === field ? null : current,
          ),
        1600,
      );
    } catch (error) {
      console.error("Unable to copy contact information:", error);
    }
  };

  const categoryStyle = (category: string) => {
    const key = Object.keys(categoryColorMap).find(
      (candidate) =>
        candidate.trim().toLowerCase() === category.trim().toLowerCase(),
    );
    return key
      ? categoryColorMap[key]
      : "border-[#9EA4A8] bg-[#BCC1C4] text-[#171719]";
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-[#15171A]/60"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-drawer-title"
        className="relative flex h-[100dvh] w-full max-w-[780px] flex-col overflow-hidden border-l border-white/10 bg-[#F4F3F1] shadow-[-24px_0_70px_rgba(18,19,22,0.30)]"
        onClick={(event) => event.stopPropagation()}
      >
        <nav
          aria-label="Prospect navigation"
          className="absolute inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-[#C8CBCC] bg-white/95 py-4 shadow-[8px_0_24px_rgba(47,48,56,0.06)] backdrop-blur sm:flex"
        >
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={!hasPrevious}
            aria-label="Previous prospect"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${hasPrevious ? "border-[#C8CBCC] bg-[#F4F3F1] text-[#3E454B] hover:-translate-y-0.5 hover:bg-white hover:shadow-md" : "cursor-not-allowed border-[#DEE0E1] bg-[#F4F3F1] text-[#A0A5A9] opacity-45"}`}
          >
            <span className="text-xl">↑</span>
          </button>
          <div className="my-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#778189]">
              Record
            </p>
            <p className="mt-1 text-xs font-bold text-[#2F3038]">
              {recordPosition}
            </p>
            <div className="mx-auto my-1 h-px w-5 bg-[#C8CBCC]" />
            <p className="text-[10px] font-semibold text-[#778189]">
              {recordTotal}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(1)}
            disabled={!hasNext}
            aria-label="Next prospect"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${hasNext ? "border-[#2F3038] bg-[#2F3038] text-white hover:translate-y-0.5 hover:bg-black hover:shadow-md" : "cursor-not-allowed border-[#DEE0E1] bg-[#E2E3E3] text-[#A0A5A9] opacity-45"}`}
          >
            <span className="text-xl">↓</span>
          </button>
          <div className="flex-1" />
        </nav>

        <header className="relative ml-0 shrink-0 overflow-hidden bg-[#2F3038] px-4 pb-5 pt-5 text-white sm:ml-16 sm:px-8 sm:pb-8 sm:pt-7">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border-[38px] border-[#C2A05A]/10" />
          <div className="pointer-events-none absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-[#B7655E]/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0 pr-1 sm:pr-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4D9DC]">
                Prospect Library
              </p>
              <h2
                id="prospect-drawer-title"
                className="mt-2 text-xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-[2rem]"
              >
                {prospect.grantor_name || "Unnamed Grantor"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close prospect details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:rotate-90 hover:bg-white hover:text-[#2F3038]"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </header>

        <div className="ml-0 min-h-0 flex-1 overflow-y-auto pb-24 sm:ml-16 sm:pb-0">
          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-8 sm:py-8">
            <section aria-labelledby="prospect-snapshot-heading">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                  At a glance
                </p>
                <h3
                  id="prospect-snapshot-heading"
                  className="mt-1 text-lg font-bold text-[#2F3038]"
                >
                  Prospect Snapshot
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#C8CBCC] bg-white p-5 shadow-[0_8px_24px_rgba(47,48,56,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    Grant Range
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#2F3038]">
                    {grantRange(prospect)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#C8CBCC] bg-white p-5 shadow-[0_8px_24px_rgba(47,48,56,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    RFP Cycle
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#2F3038]">
                    {prospect.rfp_cycle || "Not documented"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Overview
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Grantor Profile
              </h3>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#565E64]">
                {prospect.overview || "No overview provided."}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#C8CBCC] bg-[#E9E9E7] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Classification
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Categories
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {values(prospect.categories).length ? (
                  values(prospect.categories).map((category) => (
                    <span
                      key={category}
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${categoryStyle(category)}`}
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#7D858B]">
                    No categories listed.
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Funding focus
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Program Areas
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {values(prospect.program_areas).length ? (
                  values(prospect.program_areas).map((area) => (
                    <span
                      key={area}
                      className="inline-flex rounded-full border border-[#C8CBCC] bg-[#F4F3F1] px-4 py-2 text-sm font-semibold text-[#394147] shadow-sm"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#7D858B]">
                    No program areas listed.
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Point of Contact
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">Contact</h3>
              {prospect.contact ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#778189]">
                        Name
                      </p>
                      {prospect.contact.name && (
                        <button
                          type="button"
                          onClick={() =>
                            copyContactValue(prospect.contact!.name!, "name")
                          }
                          className="rounded-lg border border-[#C8CBCC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#626A70] transition hover:text-[#2F3038]"
                        >
                          {copiedContactField === "name" ? "Copied ✓" : "Copy"}
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#394147]">
                      {prospect.contact.name || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#778189]">
                        Email
                      </p>
                      {prospect.contact.email && (
                        <button
                          type="button"
                          onClick={() =>
                            copyContactValue(prospect.contact!.email!, "email")
                          }
                          className="rounded-lg border border-[#C8CBCC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#626A70] transition hover:text-[#2F3038]"
                        >
                          {copiedContactField === "email" ? "Copied ✓" : "Copy"}
                        </button>
                      )}
                    </div>
                    {prospect.contact.email ? (
                      <a
                        href={`mailto:${prospect.contact.email}`}
                        className="mt-2 block break-all text-sm font-semibold text-[#8D4D45] underline decoration-[#8D4D45]/30 underline-offset-4"
                      >
                        {prospect.contact.email}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-[#9AA0A5]">
                        Not provided
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#778189]">
                      Organization
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#394147]">
                      {prospect.contact.organization || "Not provided"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#7D858B]">
                  No contact is assigned, or contact information requires a
                  signed-in account.
                </p>
              )}
            </section>

            <section className="grid grid-cols-2 gap-3 text-xs text-[#778189]">
              <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4">
                <b className="block uppercase tracking-wider">Created</b>
                <span className="mt-1 block">
                  {formatDate(prospect.created_at)}
                </span>
              </div>
              <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-4">
                <b className="block uppercase tracking-wider">Updated</b>
                <span className="mt-1 block">
                  {formatDate(prospect.updated_at)}
                </span>
              </div>
            </section>
          </div>
        </div>

        <nav
          aria-label="Prospect navigation"
          className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[#C8CBCC] bg-white/95 px-4 py-3 shadow-[0_-10px_28px_rgba(47,48,56,0.10)] backdrop-blur sm:hidden"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={!hasPrevious}
            className={`flex min-w-[92px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${hasPrevious ? "border-[#C8CBCC] bg-[#F4F3F1] text-[#3E454B]" : "cursor-not-allowed border-[#DEE0E1] bg-[#F4F3F1] text-[#A0A5A9] opacity-45"}`}
          >
            ← Previous
          </button>
          <div className="px-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#778189]">
              Record
            </p>
            <p className="mt-0.5 text-xs font-bold text-[#2F3038]">
              {recordPosition} / {recordTotal}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(1)}
            disabled={!hasNext}
            className={`flex min-w-[92px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${hasNext ? "border-[#2F3038] bg-[#2F3038] text-white" : "cursor-not-allowed border-[#DEE0E1] bg-[#E2E3E3] text-[#A0A5A9] opacity-45"}`}
          >
            Next →
          </button>
        </nav>
      </aside>
    </div>
  );
}