"use client";

import type { Customer } from "../types/customer";

type Props = {
  customer: Customer | null;
  availableCategories?: string[];
  navigationCustomers?: Customer[];
  onNavigate?: (customerId: number) => void;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  availableCategories = [],
  navigationCustomers = [],
  onNavigate,
  onClose,
}: Props) {
  if (!customer) return null;

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
          "font-medium text-[#7B858C]",
      };
    }

    if (daysUntil === 0) {
      return {
        text: "Deadline is today",
        className:
          "font-semibold text-[#B85C5C]",
      };
    }

    if (daysUntil === 1) {
      return {
        text: "1 day remaining",
        className:
          "font-semibold text-[#B85C5C]",
      };
    }

    if (daysUntil <= 30) {
      return {
        text: `${daysUntil} days remaining`,
        className:
          "font-semibold text-[#B07A3E]",
      };
    }

    return {
      text: `${daysUntil} days remaining`,
      className:
        "font-semibold text-[#5F806C]",
    };
  };

  const deadlineCountdown =
    getDeadlineCountdown();

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
  // --------------------------------------------------

  const getCategoryStyle = (
    category: string
  ) => {
    const colors = [
      "bg-[#DCE8EE] text-[#3E5C6D] border-[#B8CCD7]",
      "bg-[#E4DDEB] text-[#665575] border-[#CFC1D9]",
      "bg-[#DCE9E2] text-[#4D6B59] border-[#BCD2C4]",
      "bg-[#EEE5D5] text-[#756044] border-[#DCCBAE]",
      "bg-[#EADDDD] text-[#755656] border-[#D8C1C1]",
      "bg-[#DCE8E9] text-[#4E6B6D] border-[#BCD1D2]",
      "bg-[#E0E1ED] text-[#5A5F78] border-[#C5C7DA]",
      "bg-[#E9DFD6] text-[#715E4D] border-[#D9C6B5]",
    ];

    const categoryIndex =
      availableCategories.findIndex(
        (availableCategory) =>
          availableCategory
            .trim()
            .toLowerCase() ===
          category.trim().toLowerCase()
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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#263B49]/45"
      onClick={onClose}
    >
      {/* Drawer */}

      <div
        className="relative flex h-full w-full max-w-2xl overflow-hidden bg-[#F1F4F5] shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* ==================================================
            LEFT-SIDE NAVIGATION PANEL
        ================================================== */}

        <div className="flex w-14 flex-shrink-0 flex-col items-center border-r border-[#C5D2D9] bg-[#DCE5E9]">

          {/* Top Spacer */}

          <div className="flex-1" />

          {/* Previous Opportunity */}

          <button
            type="button"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            aria-label="Previous opportunity"
            title="Previous opportunity"
            className={`my-1 flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[#687984] transition ${
              hasPrevious
                ? "hover:border-[#B8C9D2] hover:bg-[#F7F9FA] hover:text-[#263B49] hover:shadow-sm"
                : "cursor-not-allowed opacity-25"
            }`}
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
                d="m6 15 6-6 6 6"
              />
            </svg>
          </button>

          {/* Position Indicator */}

          {currentIndex !== -1 &&
            navigationCustomers.length > 0 && (
              <div className="my-2 flex flex-col items-center">
                <div className="h-1 w-1 rounded-full bg-[#8FA6B3]" />

                <span className="mt-2 text-[9px] font-semibold tracking-wide text-[#81929C] [writing-mode:vertical-rl]">
                  {currentIndex + 1} OF{" "}
                  {navigationCustomers.length}
                </span>

                <div className="mt-2 h-1 w-1 rounded-full bg-[#8FA6B3]" />
              </div>
            )}

          {/* Next Opportunity */}

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            aria-label="Next opportunity"
            title="Next opportunity"
            className={`my-1 flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[#687984] transition ${
              hasNext
                ? "hover:border-[#B8C9D2] hover:bg-[#F7F9FA] hover:text-[#263B49] hover:shadow-sm"
                : "cursor-not-allowed opacity-25"
            }`}
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
                d="m6 9 6 6 6-6"
              />
            </svg>
          </button>

          {/* Bottom Spacer */}

          <div className="flex-1" />

        </div>

        {/* ==================================================
            MAIN DRAWER CONTENT
        ================================================== */}

        <div className="min-w-0 flex-1 overflow-y-auto">

          {/* Header */}

          <div className="sticky top-0 z-10 border-b border-[#C5D2D9] bg-[#DCE5E9]/95 px-8 py-8 backdrop-blur">

            <div className="flex items-start justify-between gap-6">

              <div className="min-w-0 pr-4">

                {/* Grantor */}

                <p className="text-lg font-bold uppercase tracking-[0.12em] text-[#6F8FA5] sm:text-xl">
                  {customer.grantor ||
                    "Grant Opportunity"}
                </p>

                {/* Opportunity Name */}

                <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#263B49] sm:text-4xl">
                  {customer.opportunity_name ||
                    "Untitled Opportunity"}
                </h2>

              </div>

              {/* Close Button */}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close opportunity details"
                title="Close"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F7F9FA]/80 text-[#687984] shadow-sm transition hover:bg-white hover:text-[#263B49]"
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

              <div className="rounded-xl border border-[#D1DCE2] bg-[#E8EDEF] p-5">

                <div className="text-sm font-medium text-[#71808A]">
                  Maximum Grant
                </div>

                <div className="mt-2 text-xl font-bold text-[#263B49]">
                  {customer.maximum_grant ||
                    "Not specified"}
                </div>

              </div>

              {/* Deadline */}

              <div className="rounded-xl border border-[#D1DCE2] bg-[#E8EDEF] p-5">

                <div className="text-sm font-medium text-[#71808A]">
                  Deadline
                </div>

                <div className="mt-2 text-xl font-bold text-[#263B49]">
                  {formattedDeadline ||
                    "Not set"}
                </div>

              </div>

            </div>

            {/* Secondary Details */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Website */}

              <div>

                <div className="text-sm font-medium text-[#71808A]">
                  Website
                </div>

                <div className="mt-2">

                  {customer.website_link ? (

                    <a
                      href={
                        customer.website_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#AFC4D0] px-4 py-2.5 text-sm font-semibold text-[#263B49] shadow-sm transition hover:bg-[#9FB8C5] hover:shadow-md"
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

                    <span className="text-[#8A969E]">
                      Not provided
                    </span>

                  )}

                </div>

              </div>

              {/* Deadline Countdown */}

              <div>

                <div className="text-sm font-medium text-[#71808A]">
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

            <div className="my-8 border-t border-[#D1DCE2]" />

            {/* Abstract */}

            <section>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71808A]">
                Abstract
              </h3>

              <div className="mt-3 whitespace-pre-line text-base leading-7 text-[#53636D]">
                {customer.abstract ||
                  "No abstract provided."}
              </div>

            </section>

            {/* Categories */}

            <section className="mt-8">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71808A]">
                Categories
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">

                {Array.isArray(
                  customer.rfp_categories
                ) &&
                customer.rfp_categories
                  .length > 0 ? (

                  customer.rfp_categories.map(
                    (category) => (

                      <span
                        key={category}
                        className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${getCategoryStyle(
                          category
                        )}`}
                      >
                        {category}
                      </span>

                    )
                  )

                ) : (

                  <span className="text-[#8A969E]">
                    No categories listed.
                  </span>

                )}

              </div>

            </section>

            {/* Additional Details */}

            <section className="mt-8">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71808A]">
                Additional Details
              </h3>

              <div className="mt-3 whitespace-pre-line text-base leading-7 text-[#53636D]">
                {customer.additional_information ||
                  "No additional details provided."}
              </div>

            </section>

            {/* Opportunity Information */}

            <section className="mt-8">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71808A]">
                Opportunity Information
              </h3>

              <div className="mt-4 divide-y divide-[#DCE3E7] rounded-xl border border-[#D1DCE2] bg-[#E8EDEF]">

                {/* Limited Opportunity */}

                <div className="flex items-center justify-between gap-4 p-4">

                  <span className="text-sm font-medium text-[#5E6E78]">
                    Limited Opportunity
                  </span>

                  {limitedOpportunity ? (

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        limitedOpportunity ===
                        "Yes"
                          ? "bg-[#DCE9E2] text-[#4D6B59]"
                          : limitedOpportunity ===
                              "No"
                            ? "bg-[#DCE1E4] text-[#4D5960]"
                            : "bg-[#E4E8EA] text-[#5E6A71]"
                      }`}
                    >
                      {limitedOpportunity}
                    </span>

                  ) : (

                    <span className="text-sm text-[#8A969E]">
                      Not specified
                    </span>

                  )}

                </div>

                {/* Fellowship Opportunity */}

                <div className="flex items-center justify-between gap-4 p-4">

                  <span className="text-sm font-medium text-[#5E6E78]">
                    Fellowship Opportunity
                  </span>

                  {fellowshipOpportunity ? (

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        fellowshipOpportunity ===
                        "Yes"
                          ? "bg-[#DCE9E2] text-[#4D6B59]"
                          : fellowshipOpportunity ===
                              "No"
                            ? "bg-[#DCE1E4] text-[#4D5960]"
                            : "bg-[#E4E8EA] text-[#5E6A71]"
                      }`}
                    >
                      {fellowshipOpportunity}
                    </span>

                  ) : (

                    <span className="text-sm text-[#8A969E]">
                      Not specified
                    </span>

                  )}

                </div>

              </div>

            </section>

            {/* Attachments */}

            <section className="mt-8">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71808A]">
                Attachments
              </h3>

              <div className="mt-3 rounded-xl border border-dashed border-[#C8D4DA] bg-[#E8EDEF] p-6 text-center">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="mx-auto h-8 w-8 text-[#8A969E]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m18.375 12.739-7.5 7.5a4.5 4.5 0 0 1-6.364-6.364l9-9a3 3 0 1 1 4.243 4.243l-9 9a1.5 1.5 0 0 1-2.121-2.121l8.25-8.25"
                  />
                </svg>

                <p className="mt-2 text-sm text-[#71808A]">
                  No attachments available.
                </p>

              </div>

            </section>

            {/* Bottom Spacing */}

            <div className="h-8" />

          </div>

        </div>

      </div>
    </div>
  );
}