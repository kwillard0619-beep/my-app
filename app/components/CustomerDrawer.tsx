"use client";

import { useState } from "react";
import type { Customer } from "../types/customer";
import { createClient } from "@/lib/supabase/client";

type DrawerContact = {
  id: number;
  name: string;
  email: string | null;
  organization: string | null;
};

type Props = {
  customer: Customer | null;
  isFavorite?: boolean;
  favoriteDisabled?: boolean;
  onToggleFavorite?: () => void;
  availableCategories?: string[];
  categoryColorMap?: Record<string, string>;
  navigationCustomers?: Customer[];
  onNavigate?: (customerId: number) => void;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  isFavorite = false,
  favoriteDisabled = false,
  onToggleFavorite,
  availableCategories = [],
  categoryColorMap = {},
  navigationCustomers = [],
  onNavigate,
  onClose,
}: Props) {
  const supabase = createClient();

  const [copiedContactField, setCopiedContactField] =
    useState<"name" | "email" | null>(null);

  const [downloadingAttachmentId, setDownloadingAttachmentId] =
    useState<number | null>(null);

  if (!customer) return null;

  const contact = customer.contact as unknown as
    | DrawerContact
    | null
    | undefined;

  const copyContactValue = async (
    value: string,
    field: "name" | "email"
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedContactField(field);

      window.setTimeout(() => {
        setCopiedContactField((current) =>
          current === field ? null : current
        );
      }, 1600);
    } catch (error) {
      console.error("Unable to copy contact information:", error);
    }
  };

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  const currentIndex = navigationCustomers.findIndex(
    (item) =>
      String(item.id) === String(customer.id)
  );

  const hasPrevious =
    currentIndex > 0;

  const hasNext =
    currentIndex !== -1 &&
    currentIndex <
      navigationCustomers.length - 1;

  const handlePrevious = () => {
    if (
      !hasPrevious ||
      !onNavigate
    ) {
      return;
    }

    const previousCustomer =
      navigationCustomers[
        currentIndex - 1
      ];

    if (previousCustomer) {
      onNavigate(
        Number(previousCustomer.id)
      );
    }
  };

  const handleNext = () => {
    if (
      !hasNext ||
      !onNavigate
    ) {
      return;
    }

    const nextCustomer =
      navigationCustomers[
        currentIndex + 1
      ];

    if (nextCustomer) {
      onNavigate(
        Number(nextCustomer.id)
      );
    }
  };

  // --------------------------------------------------
  // Format Deadline
  // --------------------------------------------------

  const formattedDeadline = customer.deadline
    ? new Date(
        `${customer.deadline}T00:00:00`
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // --------------------------------------------------
  // Deadline Countdown
  // --------------------------------------------------

  const getDeadlineCountdown = () => {
    if (!customer.deadline) {
      return {
        text: "No deadline set",
        className: "text-[#8A969E]",
      };
    }

    const deadlineDate = new Date(
      `${customer.deadline}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    const daysUntil = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      const daysAgo = Math.abs(daysUntil);

      return {
        text: `${daysAgo} ${
          daysAgo === 1 ? "day" : "days"
        } past deadline`,
        className:
          "font-bold text-[#424A52]",
      };
    }

    if (daysUntil === 0) {
      return {
        text: "Deadline is today",
        className:
          "font-bold text-[#C21F35]",
      };
    }

    if (daysUntil === 1) {
      return {
        text: "1 day remaining",
        className:
          "font-bold text-[#C21F35]",
      };
    }

    if (daysUntil <= 30) {
      return {
        text: `${daysUntil} days remaining`,
        className:
          "font-bold text-[#A84F0F]",
      };
    }

    return {
      text: `${daysUntil} days remaining`,
      className:
        "font-bold text-[#216B45]",
    };
  };

  const deadlineCountdown =
    getDeadlineCountdown();

  // --------------------------------------------------
  // Attachments
  // --------------------------------------------------

  const attachments = Array.isArray(customer.attachments)
    ? customer.attachments
    : [];

  const getAttachmentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("opportunity-attachments")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const getAttachmentFileName = (
    fileName: string | null,
    filePath: string
  ) => {
    if (fileName?.trim()) {
      return fileName.trim();
    }

    return filePath.split("/").pop() || "Attachment";
  };

  const getAttachmentExtension = (filePath: string) => {
    const fileName = filePath.split("/").pop() || "";
    const lastDot = fileName.lastIndexOf(".");

    if (lastDot === -1 || lastDot === fileName.length - 1) {
      return "FILE";
    }

    return fileName.slice(lastDot + 1).toUpperCase();
  };

  const downloadAttachment = async (
    attachmentId: number,
    filePath: string,
    fileName: string | null
  ) => {
    try {
      setDownloadingAttachmentId(attachmentId);

      const { data, error } = await supabase.storage
        .from("opportunity-attachments")
        .download(filePath);

      if (error) {
        throw error;
      }

      const objectUrl = URL.createObjectURL(data);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = getAttachmentFileName(fileName, filePath);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Unable to download attachment:", error);
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  // --------------------------------------------------
  // Boolean Formatting
  // --------------------------------------------------

  const formatBooleanValue = (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) return null;

    const normalized = String(value)
      .trim()
      .toLowerCase();

    if (
      normalized === "yes" ||
      normalized === "true"
    ) {
      return "Yes";
    }

    if (
      normalized === "no" ||
      normalized === "false"
    ) {
      return "No";
    }

    return String(value);
  };

  const limitedOpportunity =
    formatBooleanValue(
      customer.limited_opportunity
    );

  const fellowshipOpportunity =
    formatBooleanValue(
      customer.fellowship_opportunity
    );

  // --------------------------------------------------
  // Category Colors
  // Uses the same categoryColorMap as the table
  // --------------------------------------------------

  const getCategoryStyle = (
    category: string
  ) => {
    const normalizedCategory =
      category.trim().toLowerCase();

    const matchingCategory =
      Object.keys(categoryColorMap).find(
        (key) =>
          key.trim().toLowerCase() ===
          normalizedCategory
      );

    if (matchingCategory) {
      return categoryColorMap[
        matchingCategory
      ];
    }

    // Fallback for categories that are not
    // present in the shared color map.

    const colors = [
      "border-[#D5A632] bg-[#F2C14E] text-[#171719]",
      "border-[#D9877E] bg-[#EFA39A] text-[#171719]",
      "border-[#8EAEDF] bg-[#AFCBFF] text-[#171719]",
      "border-[#A797D2] bg-[#C7B8EA] text-[#171719]",
      "border-[#7CB8A7] bg-[#9FD4C5] text-[#171719]",
      "border-[#D994B3] bg-[#F3B6D2] text-[#171719]",
      "border-[#C29F64] bg-[#E2C28D] text-[#171719]",
      "border-[#8FAAB1] bg-[#AFC6CC] text-[#171719]",
    ];

    const categoryIndex =
      availableCategories.findIndex(
        (availableCategory) =>
          availableCategory
            .trim()
            .toLowerCase() ===
          normalizedCategory
      );

    if (categoryIndex !== -1) {
      return colors[
        categoryIndex % colors.length
      ];
    }

    let hash = 0;

    for (
      let i = 0;
      i < category.length;
      i++
    ) {
      hash =
        category.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    const index =
      Math.abs(hash) % colors.length;

    return colors[index];
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  const recordPosition =
    currentIndex >= 0
      ? currentIndex + 1
      : 1;

  const recordTotal = Math.max(
    navigationCustomers.length,
    1
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-[#15171A]/60"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="opportunity-drawer-title"
        className="relative flex h-full w-full max-w-[780px] flex-col overflow-hidden border-l border-white/10 bg-[#F4F3F1] shadow-[-24px_0_70px_rgba(18,19,22,0.30)]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Left-side record navigation */}
        <nav
          aria-label="Opportunity navigation"
          className="absolute inset-y-0 left-0 z-30 flex w-16 flex-col items-center border-r border-[#C8CBCC] bg-white/95 py-4 shadow-[8px_0_24px_rgba(47,48,56,0.06)] backdrop-blur"
        >
          <div className="flex-1" />

          <button
            type="button"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            aria-label="Previous opportunity"
            title="Previous opportunity"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
              hasPrevious
                ? "border-[#C8CBCC] bg-[#F4F3F1] text-[#3E454B] hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                : "cursor-not-allowed border-[#DEE0E1] bg-[#F4F3F1] text-[#A0A5A9] opacity-45"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              ↑
            </span>
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
            onClick={handleNext}
            disabled={!hasNext}
            aria-label="Next opportunity"
            title="Next opportunity"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
              hasNext
                ? "border-[#2F3038] bg-[#2F3038] text-white hover:translate-y-0.5 hover:bg-black hover:shadow-md"
                : "cursor-not-allowed border-[#DEE0E1] bg-[#E2E3E3] text-[#A0A5A9] opacity-45"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              ↓
            </span>
          </button>

          <div className="flex-1" />
        </nav>

        {/* Header */}
        <header className="relative ml-16 shrink-0 overflow-hidden bg-[#2F3038] px-6 pb-7 pt-6 text-white sm:px-8 sm:pb-8 sm:pt-7">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border-[38px] border-[#C2A05A]/10" />
          <div className="pointer-events-none absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-[#B7655E]/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0 pr-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4D9DC]">
                  {customer.grantor ||
                    "Grant Opportunity"}
                </p>
                <h2
                  id="opportunity-drawer-title"
                  className="mt-2 text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-[2rem]"
                >
                  {customer.opportunity_name ||
                    "Untitled Opportunity"}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  disabled={favoriteDisabled}
                  aria-label={
                    isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  title={
                    isFavorite
                      ? "Remove from Favorites"
                      : "Add to Favorites"
                  }
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-50 ${
                    isFavorite
                      ? "border-[#C4932D] bg-[#F2C14E] text-[#171719]"
                      : "border-white/20 bg-white/10 text-white hover:border-[#F2C14E] hover:text-[#F2C14E]"
                  }`}
                >
                  {isFavorite ? "★" : "☆"}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close opportunity details"
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:rotate-90 hover:bg-white hover:text-[#2F3038]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

        </header>

        {/* Scrollable details */}
        <div className="ml-16 min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
            {/* Opportunity snapshot */}
            <section aria-labelledby="snapshot-heading">
              <div className="mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                    At a glance
                  </p>
                  <h3
                    id="snapshot-heading"
                    className="mt-1 text-lg font-bold text-[#2F3038]"
                  >
                    Opportunity Snapshot
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#C8CBCC] bg-white p-5 shadow-[0_8px_24px_rgba(47,48,56,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    Maximum Grant
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#2F3038]">
                    {customer.maximum_grant ||
                      "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#C8CBCC] bg-white p-5 shadow-[0_8px_24px_rgba(47,48,56,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    Deadline
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#2F3038]">
                    {formattedDeadline || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    Website
                  </p>
                  {customer.website_link ? (
                    <a
                      href={customer.website_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2F3038] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:shadow-md"
                    >
                      Visit Website
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-[#7D858B]">
                      Not provided
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#C8CBCC] bg-[#E9E9E7] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#778189]">
                    Deadline Countdown
                  </p>
                  <p className={`mt-2 text-sm ${deadlineCountdown.className}`}>
                    {deadlineCountdown.text}
                  </p>
                </div>
              </div>
            </section>

            {/* Abstract */}
            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Overview
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Abstract
              </h3>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#565E64]">
                {customer.abstract ||
                  "No abstract provided."}
              </div>
            </section>

            {/* Categories */}
            <section className="rounded-[22px] border border-[#C8CBCC] bg-[#E9E9E7] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Classification
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Categories
              </h3>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {Array.isArray(
                  customer.rfp_categories
                ) &&
                customer.rfp_categories.length >
                  0 ? (
                  customer.rfp_categories.map(
                    (category) => (
                      <span
                        key={category}
                        className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${getCategoryStyle(
                          category
                        )}`}
                      >
                        {category}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-sm text-[#7D858B]">
                    No categories listed.
                  </span>
                )}
              </div>
            </section>

            {/* Contact */}
<section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
    Point of Contact
  </p>

  <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
    Contact
  </h3>

  <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <div className="rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#778189]">
          Name
        </p>
        {contact?.name && (
          <button
            type="button"
            onClick={() =>
              copyContactValue(contact.name, "name")
            }
            className="rounded-lg border border-[#C8CBCC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#626A70] transition hover:border-[#AEB3B6] hover:text-[#2F3038]"
          >
            {copiedContactField === "name"
              ? "Copied ✓"
              : "Copy"}
          </button>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-[#394147]">
        {contact?.name || "Not provided"}
      </p>
    </div>

    <div className="rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#778189]">
          Email
        </p>
        {contact?.email && (
          <button
            type="button"
            onClick={() =>
              copyContactValue(contact.email as string, "email")
            }
            className="rounded-lg border border-[#C8CBCC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#626A70] transition hover:border-[#AEB3B6] hover:text-[#2F3038]"
          >
            {copiedContactField === "email"
              ? "Copied ✓"
              : "Copy"}
          </button>
        )}
      </div>

      {contact?.email ? (
        <a
          href={`mailto:${contact.email}`}
          className="mt-2 block break-all text-sm font-semibold text-[#8D4D45] underline decoration-[#8D4D45]/30 underline-offset-4 transition hover:text-[#62352F]"
        >
          {contact.email}
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
        {contact?.organization || "Not provided"}
      </p>
    </div>
  </div>
</section>

            {/* Additional information */}
            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Details
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Additional Information
              </h3>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#565E64]">
                {customer.additional_information ||
                  "No additional details provided."}
              </div>
            </section>

            {/* Opportunity flags */}
            <section className="rounded-[22px] border border-[#C8CBCC] bg-[#E9E9E7] p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                Eligibility
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                Opportunity Information
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#C8CBCC] bg-white p-4">
                  <span className="text-sm font-semibold text-[#565E64]">
                    Limited Opportunity
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    limitedOpportunity === "Yes"
                      ? "border border-[#65A87C] bg-[#83C99B] text-[#111214]"
                      : limitedOpportunity === "No"
                        ? "border border-[#9EA4A8] bg-[#BCC1C4] text-[#111214]"
                        : "border border-[#C6C9CB] bg-[#D9DBDC] text-[#303236]"
                  }`}>
                    {limitedOpportunity ||
                      "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#C8CBCC] bg-white p-4">
                  <span className="text-sm font-semibold text-[#565E64]">
                    Fellowship Opportunity
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    fellowshipOpportunity === "Yes"
                      ? "border border-[#65A87C] bg-[#83C99B] text-[#111214]"
                      : fellowshipOpportunity === "No"
                        ? "border border-[#9EA4A8] bg-[#BCC1C4] text-[#111214]"
                        : "border border-[#C6C9CB] bg-[#D9DBDC] text-[#303236]"
                  }`}>
                    {fellowshipOpportunity ||
                      "Not specified"}
                  </span>
                </div>
              </div>
            </section>

            {/* Attachments - intentionally kept as the final drawer section */}
            <section className="rounded-[22px] border border-[#C8CBCC] bg-white p-6 shadow-[0_10px_28px_rgba(47,48,56,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778189]">
                    Documents
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#2F3038]">
                    Attachments
                  </h3>
                </div>

                {attachments.length > 0 && (
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-[#C8CBCC] bg-[#F4F3F1] px-2.5 py-1 text-xs font-bold text-[#626A70]">
                    {attachments.length}
                  </span>
                )}
              </div>

              {attachments.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {attachments.map((attachment) => {
                    if (!attachment.file_path) {
                      return null;
                    }

                    const attachmentUrl = getAttachmentUrl(
                      attachment.file_path
                    );
                    const displayName = getAttachmentFileName(
                      attachment.file_name,
                      attachment.file_path
                    );
                    const extension = getAttachmentExtension(
                      attachment.file_path
                    );
                    const isDownloading =
                      downloadingAttachmentId === attachment.id;

                    return (
                      <div
                        key={attachment.id}
                        className="group flex flex-col gap-4 rounded-2xl border border-[#D7D9DA] bg-[#F4F3F1] p-4 transition hover:border-[#B7BCBF] hover:bg-white hover:shadow-[0_8px_22px_rgba(47,48,56,0.07)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F3038] text-white shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.7}
                              stroke="currentColor"
                              className="h-5 w-5"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m.75 12 3 3m0 0 3-3m-3 3V10.5M6.75 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                              />
                            </svg>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#394147]">
                              {displayName}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A9298]">
                              {extension} document
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pl-[58px] sm:pl-0">
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8CBCC] bg-white px-3 py-2 text-xs font-bold text-[#565E64] transition hover:border-[#9EA4A8] hover:text-[#2F3038]"
                          >
                            Open
                            <span aria-hidden="true">↗</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              downloadAttachment(
                                attachment.id,
                                attachment.file_path as string,
                                attachment.file_name
                              )
                            }
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F3038] px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-wait disabled:translate-y-0 disabled:opacity-55"
                          >
                            {isDownloading ? "Downloading…" : "Download"}
                            {!isDownloading && (
                              <span aria-hidden="true">↓</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#B8C2CA] bg-[#F4F3F1] px-5 py-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E3E3] text-lg text-[#69747C]">
                    ⎘
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#69747C]">
                    No attachments available.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

      </aside>
    </div>
  );
}