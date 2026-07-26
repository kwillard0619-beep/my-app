"use client";

import { useEffect, useMemo } from "react";

type Customer = {
  id: number;
  grantor: string | null;
  opportunity_name: string | null;
  maximum_grant: string | null;
  deadline: string | null;
  anticipated_deadline: string | null;
  abstract: string | null;
  rfp_categories: string[] | null;
};

type CustomerDrawerProps = {
  customer: Customer | null;
  availableCategories: string[];
  navigationCustomers: Customer[];
  onNavigate: (customerId: number) => void;
  onClose: () => void;
};

export default function CustomerDrawer({
  customer,
  availableCategories,
  navigationCustomers,
  onNavigate,
  onClose,
}: CustomerDrawerProps) {
  /*
   * Find the current customer's position in the filtered list.
   */
  const currentIndex = useMemo(() => {
    if (!customer) {
      return -1;
    }

    return navigationCustomers.findIndex(
      (item) => item.id === customer.id
    );
  }, [customer, navigationCustomers]);

  /*
   * Determine whether Previous / Next buttons should be enabled.
   */
  const hasPrevious =
    currentIndex > 0;

  const hasNext =
    currentIndex >= 0 &&
    currentIndex <
      navigationCustomers.length - 1;

  /*
   * Navigate to previous customer.
   */
  const handlePrevious = () => {
    if (!hasPrevious) {
      return;
    }

    const previousCustomer =
      navigationCustomers[
        currentIndex - 1
      ];

    if (previousCustomer) {
      onNavigate(previousCustomer.id);
    }
  };

  /*
   * Navigate to next customer.
   */
  const handleNext = () => {
    if (!hasNext) {
      return;
    }

    const nextCustomer =
      navigationCustomers[
        currentIndex + 1
      ];

    if (nextCustomer) {
      onNavigate(nextCustomer.id);
    }
  };

  /*
   * Close drawer when Escape is pressed.
   */
  useEffect(() => {
    if (!customer) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.key === "ArrowLeft" &&
        hasPrevious
      ) {
        handlePrevious();
      }

      if (
        event.key === "ArrowRight" &&
        hasNext
      ) {
        handleNext();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    customer,
    hasPrevious,
    hasNext,
    currentIndex,
    navigationCustomers,
  ]);

  /*
   * Prevent the background page from scrolling
   * while the drawer is open.
   */
  useEffect(() => {
    if (!customer) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [customer]);

  /*
   * Format deadline.
   */
  const formattedDeadline =
    customer?.deadline
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
      : null;

  /*
   * Determine whether deadline has passed.
   */
  const isPastDeadline =
    customer?.deadline
      ? new Date(
          `${customer.deadline}T00:00:00`
        ) < new Date()
      : false;

  /*
   * If no customer is selected, render nothing.
   */
  if (!customer) {
    return null;
  }

  return (
    <>
      {/* Background Overlay */}

      <div
        className="fixed inset-0 z-[9998] bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}

      <aside
        className="fixed right-0 top-0 z-[9999] flex h-screen w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-[#6F91A8]">
              Funding Opportunity
            </p>

            <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
              {customer.opportunity_name ||
                "Untitled Opportunity"}
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close opportunity details"
            className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
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

        {/* Navigation */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">

          <div className="text-xs font-medium text-slate-500">
            {currentIndex >= 0
              ? `Opportunity ${
                  currentIndex + 1
                } of ${
                  navigationCustomers.length
                }`
              : "Opportunity"}
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>

              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Content */}

        <div className="flex-1 overflow-y-auto">

          <div className="space-y-6 p-6">

            {/* Grantor */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Grantor
              </p>

              <p className="mt-2 text-base font-semibold text-slate-900">
                {customer.grantor ||
                  "Not specified"}
              </p>

            </div>

            {/* Opportunity Name */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Opportunity Name
              </p>

              <p className="mt-2 text-lg font-semibold leading-7 text-slate-900">
                {customer.opportunity_name ||
                  "Not specified"}
              </p>

            </div>

            {/* Grant + Deadline Grid */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Maximum Grant */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Maximum Grant
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {customer.maximum_grant ||
                    "Not specified"}
                </p>

              </div>

              {/* Deadline */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Deadline
                </p>

                {formattedDeadline ? (

                  <div className="mt-2">

                    <p className="font-semibold text-slate-900">
                      {formattedDeadline}
                    </p>

                    {isPastDeadline && (
                      <span className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Past deadline
                      </span>
                    )}

                  </div>

                ) : (

                  <p className="mt-2 font-semibold text-slate-400">
                    Not specified
                  </p>

                )}

              </div>

            </div>

            {/* Anticipated Deadline */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Anticipated Deadline Month
              </p>

              <p className="mt-2 text-base font-semibold text-slate-900">
                {customer.anticipated_deadline ||
                  "Not specified"}
              </p>

            </div>

            {/* Abstract */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Abstract
              </p>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {customer.abstract ||
                    "No abstract provided."}
                </p>

              </div>

            </div>

            {/* Categories */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Categories
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {Array.isArray(
                  customer.rfp_categories
                ) &&
                customer.rfp_categories.length >
                  0 ? (

                  customer.rfp_categories.map(
                    (category) => (
                      <span
                        key={category}
                        className="inline-flex rounded-full border border-[#B8CBD7] bg-[#EEF5F8] px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {category}
                      </span>
                    )
                  )

                ) : (

                  <span className="text-sm text-slate-400">
                    No categories specified.
                  </span>

                )}

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-slate-200 bg-white px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#6F91A8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5F829B]"
          >
            Close
          </button>

        </div>

      </aside>
    </>
  );
}