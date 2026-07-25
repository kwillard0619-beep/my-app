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

  const index = Math.abs(hash) % colors.length;

  return colors[index];
};

export default function CustomerDrawer({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  // Calculate deadline countdown
  const getDeadlineCountdown = () => {
    if (!customer.deadline) {
      return {
        text: "No deadline set",
        style:
          "bg-slate-50 border-slate-100 text-slate-600",
      };
    }

    const deadlineDate = new Date(
      `${customer.deadline}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const difference =
      deadlineDate.getTime() - today.getTime();

    const daysUntil = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      const daysAgo = Math.abs(daysUntil);

      return {
        text: `${daysAgo} ${
          daysAgo === 1 ? "day" : "days"
        } past deadline`,
        style:
          "bg-slate-50 border-slate-200 text-slate-600",
      };
    }

    if (daysUntil === 0) {
      return {
        text: "Deadline is today",
        style:
          "bg-red-50 border-red-200 text-red-700",
      };
    }

    if (daysUntil === 1) {
      return {
        text: "1 day remaining",
        style:
          "bg-red-50 border-red-200 text-red-700",
      };
    }

    if (daysUntil <= 30) {
      return {
        text: `${daysUntil} days remaining`,
        style:
          "bg-amber-50 border-amber-200 text-amber-700",
      };
    }

    return {
      text: `${daysUntil} days remaining`,
      style:
        "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
  };

  const deadlineCountdown =
    getDeadlineCountdown();

  return (
    <div
      className="fixed inset-0 bg-black/30 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="h-full w-[500px] bg-white shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {customer.grantor}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {customer.opportunity_name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="space-y-5">
          {/* Maximum Grant */}
          <div>
            <div className="text-sm text-gray-500">
              Maximum Grant
            </div>

            <div className="font-medium">
              {customer.maximum_grant ||
                "Not specified"}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <div className="text-sm text-gray-500">
              Deadline
            </div>

            <div className="font-medium">
              {customer.deadline
                ? new Date(
                    `${customer.deadline}T00:00:00`
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not set"}
            </div>
          </div>

          {/* Website */}
          <div>
            <div className="text-sm text-gray-500">
              Website
            </div>

            {customer.website_link ? (
              <a
                href={customer.website_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
              >
                Visit Opportunity Website ↗
              </a>
            ) : (
              <div className="text-slate-400">
                Not provided
              </div>
            )}
          </div>

          {/* Deadline Countdown */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Deadline Countdown
            </div>

            <div
              className={`rounded-lg border p-4 font-medium ${deadlineCountdown.style}`}
            >
              {deadlineCountdown.text}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Categories
            </div>

            {Array.isArray(customer.rfp_categories) &&
            customer.rfp_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customer.rfp_categories.map(
                  (category) => (
                    <span
                      key={category}
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getCategoryStyle(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            ) : (
              <div className="text-slate-400">
                No categories listed.
              </div>
            )}
          </div>

          {/* Abstract */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Abstract
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm leading-6 text-slate-600">
              {customer.abstract ||
                "No abstract provided."}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Additional Details
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
              {customer.additional_information ||
                "No additional details provided."}
            </div>
          </div>

          {/* Opportunity Information */}
          <div>
            <div className="text-sm text-gray-500 mb-3">
              Opportunity Information
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">
                  Limited Opportunity
                </div>

                <div className="font-medium text-slate-700">
                  {customer.limited_opportunity ||
                    "Not specified"}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">
                  Fellowship Opportunity
                </div>

                <div className="font-medium text-slate-700">
                  {customer.fellowship_opportunity ||
                    "Not specified"}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Attachments
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
              No attachments available.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}