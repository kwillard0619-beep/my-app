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

  return (
    <div
      className="fixed inset-0 bg-black/30 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="h-full w-[500px] bg-white shadow-2xl p-6 overflow-y-auto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {customer.grantor || "Grantor"}
            </div>

            <h2 className="text-2xl font-bold">
              {customer.opportunity_name ||
                "Opportunity"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Maximum Grant */}
          <div>
            <div className="text-sm text-gray-500">
              Maximum Grant
            </div>

            <div>
              {customer.maximum_grant ||
                "Not set"}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <div className="text-sm text-gray-500">
              Deadline
            </div>

            <div>
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

          {/* Anticipated Deadline Month */}
          <div>
            <div className="text-sm text-gray-500">
              Anticipated Deadline Month
            </div>

            <div>
              {customer.anticipated_deadline ||
                "Not set"}
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
                className="text-blue-600 hover:underline break-all"
              >
                Visit Website
              </a>
            ) : (
              <div>Not set</div>
            )}
          </div>

          {/* Abstract */}
          <div>
            <div className="text-sm text-gray-500">
              Abstract
            </div>

            <div className="whitespace-pre-wrap">
              {customer.abstract ||
                "Not provided"}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="text-sm text-gray-500">
              Categories
            </div>

            <div>
              {customer.rfp_categories?.length
                ? customer.rfp_categories.join(
                    ", "
                  )
                : "Not set"}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <div className="text-sm text-gray-500">
              Additional Details
            </div>

            <div className="whitespace-pre-wrap">
              {customer.additional_information ||
                "Not provided"}
            </div>
          </div>

          {/* Limited Opportunity */}
          <div>
            <div className="text-sm text-gray-500">
              Limited Opportunity
            </div>

            <div>
              {customer.limited_opportunity ||
                "Not set"}
            </div>
          </div>

          {/* Fellowship Opportunity */}
          <div>
            <div className="text-sm text-gray-500">
              Fellowship Opportunity
            </div>

            <div>
              {customer.fellowship_opportunity ||
                "Not set"}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Attachments
            </div>

            <div className="text-gray-500">
              No attachments available yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}