"use client";

import type { Customer } from "../types/customer";

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

// Same category color logic used on CustomerTable
const getCategoryStyle = (category: string) => {
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-orange-50 text-orange-700 border-orange-200",
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

// Calculate deadline information
const getDeadlineInfo = (
  deadline: string | null
) => {
  if (!deadline) {
    return {
      label: "No deadline set",
      daysRemaining: null,
      style:
        "bg-gray-50 text-gray-600 border-gray-200",
    };
  }

  const deadlineDate = new Date(
    `${deadline}T00:00:00`
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const difference =
    deadlineDate.getTime() -
    today.getTime();

  const daysRemaining = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    const daysPast = Math.abs(daysRemaining);

    return {
      label:
        daysPast === 1
          ? "1 day past deadline"
          : `${daysPast} days past deadline`,
      daysRemaining,
      style:
        "bg-gray-50 text-gray-600 border-gray-200",
    };
  }

  if (daysRemaining === 0) {
    return {
      label: "Due today",
      daysRemaining,
      style:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (daysRemaining === 1) {
    return {
      label: "1 day remaining",
      daysRemaining,
      style:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: `${daysRemaining} days remaining`,
      daysRemaining,
      style:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: `${daysRemaining} days remaining`,
    daysRemaining,
    style:
      "bg-slate-50 text-slate-700 border-slate-200",
  };
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  const deadlineInfo =
    getDeadlineInfo(customer.deadline);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-[560px] bg-white shadow-2xl overflow-y-auto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-7 py-6">
          <div className="flex justify-between items-start gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-2">
                Grant Opportunity
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {customer.grantor}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {customer.opportunity_name}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 h-9 w-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 space-y-8">

          {/* Opportunity Details */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-4">
              Opportunity Details
            </h3>

            <div className="space-y-5">
              {/* Maximum Grant */}
              <div>
                <div className="text-sm text-slate-500 mb-1">
                  Maximum Grant
                </div>

                <div className="text-lg font-semibold text-slate-900">
                  {customer.maximum_grant ||
                    "Not specified"}
                </div>
              </div>

              {/* Deadline Box */}
              <div
                className={`rounded-2xl border p-5 ${deadlineInfo.style}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Application Deadline
                    </div>

                    <div className="mt-2 text-xl font-bold">
                      {customer.deadline
                        ? new Date(
                            `${customer.deadline}T00:00:00`
                          ).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Not set"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Countdown
                    </div>

                    <div className="mt-2 text-lg font-bold">
                      {deadlineInfo.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Website */}
              {customer.website_link && (
                <div>
                  <div className="text-sm text-slate-500 mb-2">
                    Website
                  </div>

                  <a
                    href={customer.website_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    Visit Opportunity Website
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-4">
              Categories
            </h3>

            {Array.isArray(
              customer.rfp_categories
            ) &&
            customer.rfp_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customer.rfp_categories.map(
                  (category) => (
                    <span
                      key={category}
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getCategoryStyle(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No categories listed.
              </p>
            )}
          </section>

          {/* Abstract */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">
              Abstract
            </h3>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <p className="text-sm leading-7 text-slate-600">
                {customer.abstract ||
                  "No abstract provided."}
              </p>
            </div>
          </section>

          {/* Additional Information */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">
              Additional Details
            </h3>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap">
                {customer.additional_information ||
                  "No additional details provided."}
              </p>
            </div>
          </section>

          {/* Opportunity Flags */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-4">
              Opportunity Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">
                  Limited Opportunity
                </div>

                <div className="font-semibold text-slate-700">
                  {customer.limited_opportunity ||
                    "Not specified"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">
                  Fellowship Opportunity
                </div>

                <div className="font-semibold text-slate-700">
                  {customer.fellowship_opportunity ||
                    "Not specified"}
                </div>
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-4">
              Attachments
            </h3>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div className="text-sm text-slate-500">
                No attachments available.
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}