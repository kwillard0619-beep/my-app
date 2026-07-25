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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Drawer */}
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-8 py-6 backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
                {customer.grantor ||
                  "Grant Opportunity"}
              </p>

              <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
                {customer.opportunity_name ||
                  "Untitled Opportunity"}
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Close opportunity details"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-slate-900"
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
                {formattedDeadline || "Not set"}
              </div>
            </div>
          </div>

          {/* Secondary Details */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Anticipated Deadline */}
            <div>
              <div className="text-sm font-medium text-gray-500">
                Anticipated Deadline Month
              </div>

              <div className="mt-1 text-gray-900">
                {customer.anticipated_deadline ||
                  "Not specified"}
              </div>
            </div>

            {/* Website */}
            <div>
              <div className="text-sm font-medium text-gray-500">
                Website
              </div>

              <div className="mt-1">
                {customer.website_link ? (
                  <a
                    href={customer.website_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-slate-700 underline decoration-gray-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-900"
                  >
                    Visit Website

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
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
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
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
                        ? "bg-amber-100 text-amber-800"
                        : limitedOpportunity ===
                          "No"
                        ? "bg-gray-100 text-gray-700"
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
                        ? "bg-gray-100 text-gray-700"
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