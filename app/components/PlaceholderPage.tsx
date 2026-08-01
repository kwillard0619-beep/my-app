import Link from "next/link";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  activePath: string;
};

const navigationItems = [
  {
    label: "Active Opportunities",
    icon: "▦",
    href: "/",
  },
  {
    label: "Archived Opportunities",
    icon: "◫",
    href: "/archived",
  },
  {
    label: "Prospect Library",
    icon: "▤",
    href: "/prospect-library",
  },
  {
    label: "Favorites",
    icon: "☆",
    href: "/favorites",
  },
  {
    label: "Subscribe to RFP Alerts",
    icon: "✉",
    href: "/subscribe",
  },
];

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
  activePath,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[#D4D5D6] text-[#2F3038]">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col overflow-hidden border-r border-[#C7B5AE] bg-[#CACDCF] px-4 py-6 lg:flex">
          <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-white/25 blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3 px-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2F3038] text-sm font-bold tracking-wide text-white shadow-[0_10px_24px_rgba(38,39,43,0.18)]">
              LG
            </span>
            <span>
              <span className="block text-base font-bold tracking-[-0.02em]">
                LG Listings
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#747E85]">
                Funding Intelligence
              </span>
            </span>
          </Link>

          <nav className="relative mt-10 space-y-2" aria-label="Primary navigation">
            {navigationItems.map((item) => {
              const isActive = item.href === activePath;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition duration-200 ${
                    isActive
                      ? "bg-white font-semibold text-[#2F3038] shadow-[0_8px_24px_rgba(63,91,108,0.08)]"
                      : "font-medium text-[#565E64] hover:translate-x-0.5 hover:bg-white/70 hover:text-[#2F3038]"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C8CBCC] bg-white/60 text-[#444B51]">
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#B7655E]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="relative mt-auto border-t border-[#C8CBCC] pt-5">
            <Link
              href="/help"
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                activePath === "/help"
                  ? "bg-white font-semibold text-[#2F3038] shadow-sm"
                  : "font-medium text-[#565E64] hover:bg-white/70 hover:text-[#2F3038]"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C8CBCC] text-sm font-bold">
                ?
              </span>
              Help
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#C8CBCC] bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F3038] text-xs font-bold text-white">
                LG
              </span>
              <span className="font-bold">LG Listings</span>
            </Link>
            <Link href="/" className="rounded-xl border border-[#C8CBCC] bg-white px-3 py-2 text-sm font-semibold text-[#565E64]">
              Dashboard
            </Link>
          </div>

          <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden rounded-[30px] border border-white/40 bg-[#F4F3F1] p-7 shadow-[0_18px_45px_rgba(47,48,56,0.10)] sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#D8CCC7]/55 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#C2A05A]/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#778189]">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#2F3038] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#626A70]">
                {description}
              </p>

              <div className="mt-10 rounded-[24px] border border-[#C8CBCC] bg-white/80 p-7 shadow-[0_12px_30px_rgba(47,48,56,0.07)] backdrop-blur sm:p-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F3038] text-xl text-white">
                  ◇
                </span>
                <h2 className="mt-5 text-xl font-bold text-[#2F3038]">
                  This page is ready for its next feature.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#626A70]">
                  This is a working placeholder. Use the sidebar to continue navigating through LG Listings.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2F3038] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                >
                  Return to Active Opportunities
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}