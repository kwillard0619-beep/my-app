"use client";

import {
  useMemo,
} from "react";

import type { Customer } from "../types/customer";

import {
  createCategoryColorMap,
  getCategoryStyle,
} from "./categoryColors";

type CustomerDrawerProps = {
  customer: Customer | null;
  onClose: () => void;
  availableCategories?: string[];
};

export default function CustomerDrawer({
  customer,
  onClose,
  availableCategories = [],
}: CustomerDrawerProps) {
  // --------------------------------------------------
  // Category Color Map
  // --------------------------------------------------

  const categoryColorMap = useMemo(() => {
    return createCategoryColorMap(
      availableCategories
    );
  }, [availableCategories]);

  // --------------------------------------------------
  // No Selected Customer
  // --------------------------------------------------

  if (!customer) {
    return null;
  }

  // --------------------------------------------------
  // Customer Categories
  // --------------------------------------------------

  const customerCategories =
    Array.isArray(
      customer.rfp_categories
    )
      ? customer.rfp_categories.filter(
          (category): category is string =>
            Boolean(
              category &&
                String(category).trim()
            )
        )
      : [];

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="fixed inset-0 z-[300]">

      {/* Backdrop */}

      <button
        type="button"
        aria-label="Close opportunity details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/30 backdrop-blur-[2px]"
      />

      {/* Drawer */}

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">

        {/* Header */}

        <div className="flex items-start justify-between border-b border-slate-200 bg-[#AFC4D4] px-6 py-5">

          <div className="min-w-0 pr-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
              Funding Opportunity
            </p>

            <h2 className="mt-2 text-xl font-bold leading-7 text-slate-900">
              {customer.opportunity_name ||
                "Untitled Opportunity"}
            </h2>

            {customer.grantor && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                {customer.grantor}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white/70 text-xl text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            ×
          </button>

        </div>

        {/* Content */}

        <div className="flex-1 overflow-y-auto">

          <div className="space-y-6 p-6">

            {/* Key Information */}

            <section>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Opportunity Details
              </h3>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* Grantor */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Grantor
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {customer.grantor ||
                      "Not specified"}
                  </p>

                </div>

                {/* Maximum Grant */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Maximum Grant
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {customer.maximum_grant ||
                      "Not specified"}
                  </p>

                </div>

                {/* Deadline */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deadline
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
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
                      : "No specific deadline"}
                  </p>

                </div>

                {/* Anticipated Deadline */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Anticipated Deadline
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {customer.anticipated_deadline ||
                      "Not specified"}
                  </p>

                </div>

              </div>

            </section>

            {/* Categories */}

            <section>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Categories
              </h3>

              {customerCategories.length >
              0 ? (
                <div className="mt-3 flex flex-wrap gap-2">

                  {customerCategories.map(
                    (category) => (
                      <span
                        key={category}
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(
                          category,
                          categoryColorMap
                        )}`}
                      >
                        {category}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No categories specified.
                </p>
              )}

            </section>

            {/* Abstract */}

            <section>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Abstract
              </h3>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {customer.abstract ||
                    "No abstract provided."}
                </p>

              </div>

            </section>

            {/* Additional Information */}

            {customer.additional_information && (
              <section>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Additional Information
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      customer.additional_information
                    }
                  </p>

                </div>

              </section>
            )}

            {/* Limited Opportunity */}

            {customer.limited_opportunity && (
              <section>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Limited Opportunity
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      customer.limited_opportunity
                    }
                  </p>

                </div>

              </section>
            )}

            {/* Fellowship Opportunity */}

            {customer.fellowship_opportunity && (
              <section>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Fellowship Opportunity
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      customer.fellowship_opportunity
                    }
                  </p>

                </div>

              </section>
            )}

            {/* Website */}

            {customer.website_link && (
              <section>

                <a
                  href={
                    customer.website_link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#6F91A8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5F829B]"
                >
                  Visit Opportunity Website
                </a>

              </section>
            )}

          </div>

        </div>

      </aside>

    </div>
  );
}