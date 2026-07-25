"use client";

import type { Customer } from "../types/customer";

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

const getCategoryStyle = (category: string) => {
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

const getDeadlineCountdown = (
  deadline: string | null
) => {
  if (!deadline) {
    return {
      label: "No deadline set",
      style:
        "bg-slate-100 text-slate-700 border-slate-300",
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
      style:
        "bg-slate-100 text-slate-700 border-slate-300",
    };
  }

  if (daysRemaining === 0) {
    return {
      label: "Due today",
      style:
        "bg-red-100 text-red-800 border-red-300",
    };
  }

  if (daysRemaining === 1) {
    return {
      label: "1 day remaining",
      style:
        "bg-red-100 text-red-800 border-red-300",
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: `${daysRemaining} days remaining`,
      style:
        "bg-amber-100 text-amber-800 border-amber-300",
    };
  }

  return {
    label: `${daysRemaining} days remaining`,
    style:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  const countdown = getDeadlineCountdown(
    customer.deadline
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-[520px] bg-slate-100 shadow-2xl overflow-y-auto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-800 text-white px-7 py-6 shadow-md">

          <div className="flex justify-between items-start gap-6">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300 mb-2">
                Grant Opportunity
              </p>

              <h2 className="text-2xl font-bold">
                {customer.grantor}
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                {customer.opportunity_name}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 h-9 w-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close"
            >
              ✕
            </button>

          </div>

        </div>

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* Maximum Grant */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Maximum Grant
            </div>

            <div className="text-lg font-bold text-slate-900">
              {customer.maximum_grant ||
                "Not specified"}
            </div>

          </div>

          {/* Deadline */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Deadline
            </div>

            <div className="text-lg font-semibold text-slate-900">
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

          {/* Website */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Website
            </div>

            {customer.website_link ? (
              <a
                href={customer.website_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
              >
                Visit Opportunity Website
                <span className="ml-2">
                  ↗
                </span>
              </a>
            ) : (
              <div className="text-slate-500">
                Not provided
              </div>
            )}

          </div>

          {/* Deadline Countdown */}
          <div
            className={`rounded-xl border shadow-sm p-5 ${countdown.style}`}
          >

            <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
              Deadline Countdown
            </div>

            <div className="text-xl font-bold">
              {countdown.label}
            </div>

          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Categories
            </div>

            {Array.isArray(
              customer.rfp_categories
            ) &&
            customer.rfp_categories.length > 0 ? (

              <div className="flex flex-wrap gap-2">

                {customer.rfp_categories.map(
                  (category) => (

                    <span
                      key={category}
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(
                        category
                      )}`}
                    >
                      {category}
                    </span>

                  )
                )}

              </div>

            ) : (

              <div className="text-slate-500">
                No categories listed.
              </div>

            )}

          </div>

          {/* Abstract */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Abstract
            </div>

            <div className="text-sm leading-7 text-slate-700">
              {customer.abstract ||
                "No abstract provided."}
            </div>

          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Additional Details
            </div>

            <div className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
              {customer.additional_information ||
                "No additional details provided."}
            </div>

          </div>

          {/* Opportunity Information */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Opportunity Information
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">

                <div className="text-xs font-medium text-slate-500 mb-2">
                  Limited Opportunity
                </div>

                <div className="font-semibold text-slate-800">
                  {customer.limited_opportunity ||
                    "Not specified"}
                </div>

              </div>

              <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">

                <div className="text-xs font-medium text-slate-500 mb-2">
                  Fellowship Opportunity
                </div>

                <div className="font-semibold text-slate-800">
                  {customer.fellowship_opportunity ||
                    "Not specified"}
                </div>

              </div>

            </div>

          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Attachments
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-100 p-6 text-center text-sm text-slate-500">
              No attachments available.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}