"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import AppSidebar from "../components/AppSidebar";

const faqs = [
  {
    question: "What is LG Listings?",
    answer:
      "LG Listings is a funding intelligence workspace for discovering, reviewing, saving, and tracking grant and RFP opportunities in one place.",
  },
  {
    question: "How often are opportunities updated?",
    answer:
      "New opportunities are added as they are identified and reviewed. Opportunities automatically move to the archive after their stated deadline has passed.",
  },
  {
    question: "How do I save an opportunity?",
    answer:
      "Sign in to your account and select the bookmark icon on an opportunity. Saved records appear on the Favorites page, where you can switch between active and archived favorites.",
  },
  {
    question: "What is an anticipated deadline?",
    answer:
      "An anticipated deadline is an estimated future application period based on available information or a prior funding cycle. It is not a confirmed due date and may change.",
  },
  {
    question: "Can I export opportunity information?",
    answer:
      "Yes. Use the Export CSV button in the opportunity directory. The export follows your current search, filters, and sorting and includes the expanded record information available in the drawer.",
  },
  {
    question: "How do RFP email alerts work?",
    answer:
      "Subscribers can select up to five funding categories. When matching active opportunities are available, LG Listings can include them in a focused email roundup.",
  },
  {
    question: "Why did an opportunity move to the archive?",
    answer:
      "Opportunities are archived after their published deadline passes. Archived records remain searchable so you can review historical programs and previous funding cycles.",
  },
  {
    question: "What should I do if opportunity information appears incorrect?",
    answer:
      "Send us the opportunity name and a short description of the issue using the contact form below. Including the grantor and source link will help us review it more quickly.",
  },
];

type FormStatus = "idle" | "sending" | "success" | "error";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        topic: formData.get("topic"),
        message: formData.get("message"),
        website: formData.get("website"),
      }),
    });

    const result = (await response.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !result.success) {
      setStatus("error");
      setFeedback(
        result.error ??
          "We could not send your message. Please try again."
      );
      return;
    }

    form.reset();
    setStatus("success");
    setFeedback(
      "Your message has been sent. We’ll follow up by email."
    );
  }

  return (
    <main className="min-h-screen bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AppSidebar
          activePath="/help"
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() =>
            setMobileNavigationOpen(false)
          }
        />

        <section className="min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:mb-5 sm:px-4 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                  LG
                </span>
                <span className="font-bold">LG Listings</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileNavigationOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileNavigationOpen}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white text-lg font-semibold text-[#565E64] transition hover:border-[#AEB3B6] hover:text-[#2F3038]"
              >
                ☰
              </button>
            </div>

            <header className="relative overflow-hidden rounded-[22px] text-white shadow-[0_18px_45px_rgba(47,48,56,0.16)] sm:rounded-[28px]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2F3038] via-[#3E454B] via-[35%] via-[#66717A] via-[55%] via-[#7A858E] via-[75%] to-[#C2A05A]" />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-[18%] w-[64%] bg-gradient-to-r from-[#3E454B]/20 via-[#6B8797]/30 to-[#C2A05A]/10 blur-[55px]" />
              </div>

              <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] overflow-hidden rounded-r-[28px]">
                <div className="absolute inset-0 bg-gradient-to-l from-[#C2A05A]/20 via-[#9FB9C9]/10 to-transparent blur-[35px]" />
              </div>

              <div className="pointer-events-none absolute right-0 top-0 hidden h-[220px] w-[52%] overflow-hidden rounded-r-[28px] sm:block">
                <div className="absolute inset-0 bg-gradient-to-l from-[#B8CBD5]/35 via-[#8FAEBD]/15 to-transparent blur-[18px]" />
                <div className="absolute right-[-5%] top-1/2 h-[180px] w-[75%] -translate-y-1/2 rounded-full bg-[#E1DFDE]/10 blur-[45px]" />
                <img
                  src="/lg-listings-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute right-8 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-[0.20] mix-blend-multiply blur-[0.15px] xl:right-16 xl:h-36"
                />
              </div>

              <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-8 lg:px-10 lg:pt-9">
                <div className="min-w-0 pr-0 sm:pr-52">
                  <div className="max-w-3xl">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E1DFDE]">
                      LG Listings Support
                    </p>
                    <h1 className="text-[2rem] font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl lg:text-[2.65rem]">
                      How can we help?
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E9E9E7] sm:text-base">
                      Find answers about opportunities, deadlines, favorites,
                      alerts, and exports—or send us a message if you need a
                      hand.
                    </p>
                  </div>
                </div>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#E1DFDE]/60 to-transparent sm:mt-8" />
              </div>
            </header>

            <div className="mt-5 grid items-start gap-5 sm:mt-7 sm:gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
              <section className="rounded-[20px] border border-[#C8CBCC] bg-[#F4F3F1] p-4 shadow-[0_14px_38px_rgba(47,48,56,0.08)] sm:rounded-[28px] sm:p-7">
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                    Common questions
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#626A70]">
                    Select a question to see more information.
                  </p>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    const panelId = `faq-panel-${index}`;

                    return (
                      <article
                        key={faq.question}
                        className={`overflow-hidden rounded-2xl border transition duration-200 ${
                          isOpen
                            ? "border-[#B79A68] bg-white shadow-[0_8px_24px_rgba(47,48,56,0.07)]"
                            : "border-[#D2D4D5] bg-white/65 hover:border-[#B8BCBE] hover:bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() =>
                            setOpenFaq(isOpen ? null : index)
                          }
                          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:gap-5 sm:px-5"
                        >
                          <span className="text-sm font-bold leading-6 text-[#2F3038] sm:text-base">
                            {faq.question}
                          </span>
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2F3038] text-lg text-white transition duration-200 ${
                              isOpen ? "rotate-45" : ""
                            }`}
                            aria-hidden="true"
                          >
                            +
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            id={panelId}
                            className="border-t border-[#E2E3E3] px-4 py-4 text-sm leading-7 text-[#626A70] sm:px-5"
                          >
                            {faq.answer}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="xl:sticky xl:top-7">
                <div className="relative overflow-hidden rounded-[20px] bg-[#2F3038] p-5 text-white shadow-[0_18px_45px_rgba(47,48,56,0.18)] sm:rounded-[28px] sm:p-8">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#B7655E]/20 blur-3xl" />

                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8CCC7]">
                      Contact us
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">
                      Still have a question?
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#D4D9DC]">
                      Tell us what you need help with and include any relevant
                      opportunity details.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="name"
                          className="text-xs font-semibold text-[#ECECEA]"
                        >
                          Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          maxLength={100}
                          autoComplete="name"
                          className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.09] px-4 py-3 text-base text-white outline-none transition placeholder:text-[#AEB6BB] focus:border-[#D1B270] focus:bg-white/[0.13] focus:ring-4 focus:ring-[#D1B270]/15 sm:text-sm"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="text-xs font-semibold text-[#ECECEA]"
                        >
                          Email address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          maxLength={254}
                          autoComplete="email"
                          className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.09] px-4 py-3 text-base text-white outline-none transition placeholder:text-[#AEB6BB] focus:border-[#D1B270] focus:bg-white/[0.13] focus:ring-4 focus:ring-[#D1B270]/15 sm:text-sm"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="topic"
                          className="text-xs font-semibold text-[#ECECEA]"
                        >
                          What can we help with?
                        </label>
                        <select
                          id="topic"
                          name="topic"
                          required
                          defaultValue=""
                          className="mt-2 w-full rounded-xl border border-white/15 bg-[#3C3D44] px-4 py-3 text-base text-white outline-none transition focus:border-[#D1B270] focus:ring-4 focus:ring-[#D1B270]/15 sm:text-sm"
                        >
                          <option value="" disabled>
                            Select a topic
                          </option>
                          <option value="Opportunity information">
                            Opportunity information
                          </option>
                          <option value="Account or favorites">
                            Account or favorites
                          </option>
                          <option value="RFP email alerts">
                            RFP email alerts
                          </option>
                          <option value="Technical issue">
                            Technical issue
                          </option>
                          <option value="General question">
                            General question
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="text-xs font-semibold text-[#ECECEA]"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          minLength={10}
                          maxLength={3000}
                          rows={6}
                          className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white/[0.09] px-4 py-3 text-base leading-6 text-white outline-none transition placeholder:text-[#AEB6BB] focus:border-[#D1B270] focus:bg-white/[0.13] focus:ring-4 focus:ring-[#D1B270]/15 sm:text-sm"
                          placeholder="Share the details of your question..."
                        />
                      </div>

                      {feedback && (
                        <div
                          role="status"
                          className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                            status === "success"
                              ? "border-[#6A9B7D]/40 bg-[#6A9B7D]/20 text-[#DDF3E5]"
                              : "border-[#D17777]/40 bg-[#D17777]/15 text-[#FFE3E3]"
                          }`}
                        >
                          {feedback}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={status === "sending"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D1B270] px-5 py-3.5 text-sm font-bold text-[#25262B] transition hover:-translate-y-0.5 hover:bg-[#DEC180] disabled:cursor-wait disabled:opacity-60"
                      >
                        {status === "sending"
                          ? "Sending message..."
                          : "Send message"}
                        {status !== "sending" && (
                          <span aria-hidden="true">→</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                <p className="mt-4 px-3 text-center text-xs leading-5 text-[#626A70]">
                  Please do not include passwords, financial information, or
                  other sensitive personal data.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}