"use client";

import type { Customer } from "../types/customer";

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  // Format the deadline for display
  const formattedDeadline = customer.deadline
    ? new Date(
        `${customer.deadline}T00:00:00`
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Calculate deadline countdown
  const getDeadlineCountdown = () => {
    if (!customer.deadline) {
      return {
        text: "No deadline set",
        className: "text-gray-400",
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
          "font-medium text-gray-500",
      };
    }

    if (daysUntil === 0) {
      return {
        text: "Deadline is today",
        className:
          "font-semibold text-red-600",
      };
    }

    if (daysUntil === 1) {
      return {
        text: "1 day remaining",
        className:
          "font-semibold text-red-600",
      };
    }

    if (daysUntil <= 30) {
      return {
        text: `${daysUntil} days remaining`,
        className:
          "font-semibold text-amber-600",
      };
    }

    return {
      text: `${daysUntil} days remaining`,
      className:
        "font-semibold text-emerald-600",
    };
  };

  const deadlineCountdown =
    getDeadlineCountdown();

  // Convert enum values into a consistent Yes/No display
  const formatBooleanValue = (
    value: string | null | undefined
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

  // Match category colors with the main table
  const getCategoryStyle = (
    category: string
  ) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-emerald-100 text-emerald-800 border-emerald-300",
      "bg-amber-100 text-amber-800 border-amber-300",
      "bg-rose-100 text-rose-800 border-rose-300",
      "bg-cyan-100 text-cyan-800 border-cyan-300",
      "bg-indigo-100 text-indigo-800 border-indigo-300",
      "bg-orange-100 text-orange-800 border-orange-300",
    ];

    let hash = 0;

    for (let i = 0; i < category.length; i++) {
      hash =
        category.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    const index =
      Math.abs(hash) % colors.length;

    return colors[index];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Drawer */}
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#C7D6E0] bg-[#EEF4F7]/95 px-8 py-8 backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 pr-4">
              {/* Grantor */}
              <p className="text-lg font-bold uppercase tracking-[0.12em] text-[#6F8FA5] sm:text-xl">
                {customer.grantor ||
                  "Grant Opportunity"}
              </p>

              {/* Opportunity Name */}
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {customer.opportunity_name ||
                  "Untitled Opportunity"}
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Close opportunity details"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/70 text-gray-500 shadow-sm transition hover:bg-white hover:text-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6"
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

        {/* Content */}
        <div className="px-8 py-8">
          {/* Key Opportunity Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Maximum Grant */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm font-medium text-gray-500">
                Maximum Grant
              </div>

              <div className="mt-2 text-xl font-bold text-slate-900">
                {customer.maximum_grant ||
                  "Not specified"}
              </div>
            </div>

            {/* Deadline */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm font-medium text-gray-500">
                Deadline
              </div>

              <div className="mt-2 text-xl font-bold text-slate-900">
                {formattedDeadline ||
                  "Not set"}
              </div>
            </div>
          </div>

          {/* Secondary Details */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Website */}
            <div>
              <div className="text-sm font-medium text-gray-500">
                Website
              </div>

              <div className="mt-2">
                {customer.website_link ? (
                  <a
                    href={customer.website_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#AFC4D4] px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#9FB7C8] hover:shadow-md"
                  >
                    Visit Website

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H11"
                      />
                    </svg>
                  </a>
                ) : (
                  <span className="text-gray-400">
                    Not provided
                  </span>
                )}
              </div>
            </div>

            {/* Deadline Countdown */}
            <div>
              <div className="text-sm font-medium text-gray-500">
                Deadline Countdown
              </div>

              <div className="mt-2">
                <span
                  className={
                    deadlineCountdown.className
                  }
                >
                  {deadlineCountdown.text}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-gray-200" />

          {/* Abstract */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Abstract
            </h3>

            <div className="mt-3 text-base leading-7 text-gray-700 whitespace-pre-line">
              {customer.abstract ||
                "No abstract provided."}
            </div>
          </section>

          {/* Categories */}
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Categories
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {Array.isArray(
                customer.rfp_categories
              ) &&
              customer.rfp_categories.length > 0 ? (
                customer.rfp_categories.map(
                  (category) => (
                    <span
                      key={category}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${getCategoryStyle(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                  )
                )
              ) : (
                <span className="text-gray-400">
                  No categories listed.
                </span>
              )}
            </div>
          </section>

          {/* Additional Details */}
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Additional Details
            </h3>

            <div className="mt-3 text-base leading-7 text-gray-700 whitespace-pre-line">
              {customer.additional_information ||
                "No additional details provided."}
            </div>
          </section>

          {/* Opportunity Information */}
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Opportunity Information
            </h3>

            <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
              {/* Limited Opportunity */}
              <div className="flex items-center justify-between gap-4 p-4">
                <span className="text-sm font-medium text-gray-600">
                  Limited Opportunity
                </span>

                {limitedOpportunity ? (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      limitedOpportunity ===
                      "Yes"
                        ? "bg-emerald-100 text-emerald-800"
                        : limitedOpportunity ===
                          "No"
                        ? "bg-slate-200 text-black"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {limitedOpportunity}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    Not specified
                  </span>
                )}
              </div>

              {/* Fellowship Opportunity */}
              <div className="flex items-center justify-between gap-4 p-4">
                <span className="text-sm font-medium text-gray-600">
                  Fellowship Opportunity
                </span>

                {fellowshipOpportunity ? (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      fellowshipOpportunity ===
                      "Yes"
                        ? "bg-emerald-100 text-emerald-800"
                        : fellowshipOpportunity ===
                          "No"
                        ? "bg-slate-200 text-black"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {fellowshipOpportunity}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    Not specified
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Attachments
            </h3>

            <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mx-auto h-8 w-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.5 7.5a4.5 4.5 0 0 1-6.364-6.364l9-9a3 3 0 1 1 4.243 4.243l-9 9a1.5 1.5 0 0 1-2.121-2.121l8.25-8.25"
                />
              </svg>

              <p className="mt-2 text-sm text-gray-500">
                No attachments available.
              </p>
            </div>
          </section>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}