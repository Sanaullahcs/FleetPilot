import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { FleetPilotLogo } from "@/components/brand/logo";
import { NavAuthCta, HeroAuthCta } from "@/components/marketing/nav-auth-cta";
import { MarketingContactForm } from "@/components/marketing/contact-form";
import {
  DriverAppSnapshot,
  MarketingDashboardSnapshot,
  MarketingHeroVisual,
  MarketingRadarCard,
  ParentAppSnapshot,
} from "@/components/marketing/marketing-mocks";
import { Reveal } from "@/components/marketing/reveal";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mkt",
  display: "swap",
});

/* ────────────────────────────────────────────────────────────
   FleetPilot marketing landing page
   Minimal, creative, responsive. Server-rendered for SEO.
   ──────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Platform", href: "#platform" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function MarketingLanding() {
  return (
    <main className={`${displayFont.variable} bg-[#FAFBFD] text-slate-900`}>
      <SiteNav />
      <Hero />
      <StatsBand />
      <ProductShowcase />
      <Features />
      <DayTimeline />
      <Personas />
      <MobileApps />
      <Pricing />
      <Comparison />
      <Faq />
      <ContactSection />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

/* ─── Nav ─── */

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <FleetPilotLogo href="/" size={34} subtitle="K-12 transportation" subtitleClassName="hidden md:block text-xs" />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-brand-light/70 hover:text-brand-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <NavAuthCta />
      </div>
    </header>
  );
}

/* ─── Hero ─── */

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden scroll-mt-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-44 left-1/2 h-[36rem] w-[70rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-light via-sky-50/80 to-transparent blur-3xl" />
        <div className="fp-mkt-grid absolute inset-0 opacity-60" />
        <div className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pb-28 lg:pt-24">
        <div>
          <p className="fp-hero-rise inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/90 px-4 py-1.5 text-xs font-semibold text-brand-primary shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live GPS · Web portal · Driver &amp; parent apps
          </p>

          <h1 className="fp-mkt-display fp-hero-rise mt-7 text-balance [animation-delay:90ms]">
            <span className="block">Plan routes, track buses, alert families.</span>
            <span className="block bg-gradient-to-r from-brand-primary via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              One platform for your whole fleet.
            </span>
          </h1>

          <p className="fp-hero-rise mt-6 max-w-xl text-base leading-relaxed text-slate-600 [animation-delay:180ms] sm:text-lg">
            FleetPilot is the K-12 student transportation platform for districts and
            contractors. Plan tiered routes in minutes, track every vehicle in real
            time, and keep parents informed automatically, without enterprise pricing.
          </p>

          <div className="fp-hero-rise mt-9 [animation-delay:270ms]">
            <HeroAuthCta />
          </div>

          <ul className="fp-hero-rise mt-9 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-slate-500 [animation-delay:360ms]">
            <li className="flex items-center gap-2"><CheckDot /> No hardware lock-in</li>
            <li className="flex items-center gap-2"><CheckDot /> Set up in days, not semesters</li>
            <li className="flex items-center gap-2"><CheckDot /> Unlimited parents &amp; schools</li>
          </ul>
        </div>

        <div className="fp-hero-rise flex min-w-0 justify-center lg:justify-end [animation-delay:240ms]">
          <MarketingHeroVisual />
        </div>
      </div>
    </section>
  );
}

function CheckDot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-emerald-500">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Stats band ─── */

function StatsBand() {
  const stats = [
    { value: "< 5 min", label: "to plan a route", sub: "was 15+ with spreadsheets" },
    { value: "15%", label: "fewer miles driven", sub: "auto-optimized sequencing" },
    { value: "< 30 sec", label: "delay alert delivery", sub: "push, SMS, and email" },
    { value: "60%", label: "fewer office calls", sub: "parents see the bus live" },
  ];
  return (
    <section className="border-y border-slate-200/70 bg-white">
      <Reveal>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-slate-100 px-5 py-10 sm:px-8 lg:grid-cols-4 lg:divide-x lg:py-14">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <p className="fp-mkt-num text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1.5 text-sm font-semibold text-slate-800">{s.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ─── Product showcase ─── */

function ProductShowcase() {
  return (
    <section id="product" className="relative scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-light/60 via-sky-50 to-brand-light/60 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Product"
            title="See the whole operation at a glance"
            desc="The dispatch dashboard, live radar, and realtime messaging: three views your team will live in, working together on one platform."
            center
          />
        </Reveal>

        <div className="relative mt-16 min-h-[24rem] pb-8 sm:min-h-[28rem] lg:min-h-[34rem] lg:pb-16">
          {/* Dashboard window, center */}
          <Reveal className="relative z-10 mx-auto max-w-4xl">
            <MarketingDashboardSnapshot size="lg" />
          </Reveal>

          {/* Radar card, left */}
          <Reveal delay={150} className="absolute -left-2 top-10 z-20 hidden w-60 lg:block xl:-left-8 xl:w-64">
            <div className="-rotate-3 transition-transform duration-500 hover:rotate-0">
              <MarketingRadarCard />
            </div>
          </Reveal>

          {/* Chat card, right */}
          <Reveal delay={250} className="absolute -right-2 bottom-6 z-20 hidden w-64 md:block xl:-right-6 xl:w-72">
            <div className="rotate-2 transition-transform duration-500 hover:rotate-0">
              <ChatMock />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ChatMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-brand-primary/15">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-[10px] font-bold text-white">
          TA
        </span>
        <div>
          <p className="text-xs font-bold text-slate-900">T. Alvarez · Driver</p>
          <p className="flex items-center gap-1 text-[10px] text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On route AM-4
          </p>
        </div>
      </div>
      <div className="space-y-2.5 bg-slate-50/60 p-4">
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm">
          Traffic on Maple St, running ~8 min behind.
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand-primary px-3 py-2 text-[11px] text-white shadow-sm">
          Got it. Alerting parents on the route now.
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <CheckDot />
          <p className="text-[10px] font-semibold text-emerald-700">12 parents notified automatically</p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
        <span className="flex-1 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] text-slate-400">Message…</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ─── Features ─── */

const FEATURES = [
  {
    title: "Dispatch board",
    desc: "Today's runs, assignments, and conflicts on one screen. Assign drivers and vehicles in two clicks.",
    Icon: IconBoard,
    tint: "bg-brand-light text-brand-primary",
  },
  {
    title: "Live fleet radar",
    desc: "Real-time GPS for every bus and van, with route context, speed, and instant vehicle detail.",
    Icon: IconRadar,
    tint: "bg-sky-50 text-sky-600",
  },
  {
    title: "Route optimization",
    desc: "OR-Tools powered stop sequencing trims 10-15% of miles. One click, manual override always available.",
    Icon: IconOptimize,
    tint: "bg-violet-50 text-violet-600",
  },
  {
    title: "Parent app & portal",
    desc: "Live ETAs, pickup and dropoff confirmations, and ride history. Fewer calls to your front office.",
    Icon: IconParent,
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Driver app with offline mode",
    desc: "Daily manifests, one-tap stop completion, GPS verification, even without cell coverage.",
    Icon: IconPhone,
    tint: "bg-orange-50 text-orange-600",
  },
  {
    title: "Realtime messaging",
    desc: "Dispatch, schools, drivers, and parents chat in one thread system. No more phone tag.",
    Icon: IconChat,
    tint: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Billing & contractor payroll",
    desc: "Rate cards per mile, hour, or trip. Auto-generated weekly invoices with PDF export.",
    Icon: IconInvoice,
    tint: "bg-amber-50 text-amber-600",
  },
  {
    title: "Complaint center",
    desc: "Parents, drivers, and schools file issues in-app. Track, assign, and resolve with full history.",
    Icon: IconShieldCheck,
    tint: "bg-rose-50 text-rose-600",
  },
  {
    title: "Smart notifications",
    desc: "Delay alerts, pickup confirmations, and document expiry warnings across push, SMS, and email.",
    Icon: IconBell,
    tint: "bg-indigo-50 text-indigo-600",
  },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-slate-200/70 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="The platform"
            title="Everything a transportation office needs"
            desc="Purpose-built for K-12 mixed fleets: buses, vans, and wheelchair vehicles, from morning tiers to field trips."
            wide
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <article className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-primary/30 hover:shadow-premium">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${f.tint}`}>
                  <f.Icon />
                </span>
                <h3 className="fp-mkt-heading mt-4 text-[15px] font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Day timeline ─── */

const TIMELINE = [
  {
    time: "6:30 AM",
    who: "Dispatcher",
    text: "Opens the board, reviews auto-generated runs, publishes manifests. Drivers get push notifications instantly.",
    accent: "border-brand-primary/30 bg-brand-light text-brand-primary",
  },
  {
    time: "7:00 AM",
    who: "Driver",
    text: "Starts the run from the mobile app. Navigates stop to stop, taps complete, and parents are notified automatically.",
    accent: "border-orange-200 bg-orange-50 text-orange-600",
  },
  {
    time: "7:15 AM",
    who: "Parent",
    text: "Sees the bus 5 minutes away on the live map, then gets the confirmation: \u201cEmma was picked up at 7:27 AM.\u201d",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-600",
  },
  {
    time: "11:00 PM",
    who: "FleetPilot",
    text: "Generates contractor billing for every completed run and flags anything that needs review. Zero spreadsheets.",
    accent: "border-sky-200 bg-sky-50 text-sky-600",
  },
];

function DayTimeline() {
  return (
    <section className="relative overflow-hidden">
      <div className="fp-mkt-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="A school day with FleetPilot"
            desc="From the first manifest to automatic billing at night. The platform runs the busywork so your team runs the fleet."
          />
        </Reveal>
        <ol className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          <span className="absolute left-[1.4rem] top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-brand-primary/30 via-slate-200 to-transparent lg:left-0 lg:top-[1.4rem] lg:h-px lg:w-full lg:bg-gradient-to-r" aria-hidden />
          {TIMELINE.map((t, i) => (
            <li key={t.time} className="list-none">
              <Reveal delay={i * 120} className="relative pl-14 lg:pl-0 lg:pt-12">
                <span className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border text-xs font-bold shadow-sm lg:-top-1 ${t.accent}`}>
                  {t.time.split(" ")[0]}
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.time} · {t.who}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── Personas ─── */

const PERSONAS = [
  {
    role: "Dispatch & admins",
    headline: "Run the whole operation from one screen",
    points: ["Drag-and-drop route planning", "Conflict-checked assignments", "Live radar with route context", "Billing, reports, and user roles"],
    accent: "from-brand-primary to-brand-dark",
  },
  {
    role: "Drivers",
    headline: "A manifest that works even offline",
    points: ["Today's runs and full schedule", "One-tap stop completion with GPS", "Delay reporting that alerts parents", "Earnings visibility for contractors"],
    accent: "from-orange-500 to-amber-600",
  },
  {
    role: "Parents",
    headline: "Know where the bus is, always",
    points: ["Live map with arrival estimates", "Pickup & dropoff confirmations", "Instant delay alerts", "Message the school or driver"],
    accent: "from-emerald-500 to-teal-600",
  },
  {
    role: "Schools",
    headline: "Your campus, fully in view",
    points: ["Today's runs and live radar, school-scoped", "Manage students and parent links", "Driver roster serving your campus", "Complaints and realtime messaging"],
    accent: "from-sky-500 to-cyan-600",
  },
];

function Personas() {
  return (
    <section id="platform" className="scroll-mt-20 border-t border-slate-200/70 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Built for every seat"
            title="One platform, four happy roles"
            desc="Each role gets a focused portal. Nobody wades through screens that aren't theirs."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {PERSONAS.map((p, i) => (
            <Reveal key={p.role} delay={(i % 2) * 120}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-premium">
                <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.accent}`} aria-hidden />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{p.role}</p>
                <h3 className="fp-mkt-heading mt-2 text-xl font-bold text-slate-900">{p.headline}</h3>
                <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <CheckDot />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Mobile apps ─── */

function MobileApps() {
  return (
    <section className="border-t border-slate-200/70 bg-gradient-to-b from-white via-brand-light/30 to-white">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-24">
        <Reveal>
          <p className="fp-mkt-eyebrow">Mobile apps</p>
          <h2 className="fp-mkt-h2 mt-4">Native apps for drivers and parents, included</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
            No per-seat app fees. Drivers get manifests, navigation, and offline stop
            completion. Parents get live tracking, confirmations, and alerts on iOS
            and Android.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <StoreBadge kind="apple" />
            <StoreBadge kind="play" />
            <span className="text-xs text-slate-400">Coming to both stores at launch</span>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mx-auto flex w-fit max-w-full items-end justify-center gap-4 sm:gap-5">
            <DriverAppSnapshot className="fp-mkt-float -rotate-2" />
            <ParentAppSnapshot className="fp-mkt-float-delayed rotate-2" raised />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StoreBadge({ kind }: { kind: "apple" | "play" }) {
  return (
    <span className="inline-flex cursor-default items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.02]">
      {kind === "apple" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.02 12.73c.02-2.08 1.7-3.08 1.77-3.13-.96-1.4-2.46-1.59-2.99-1.61-1.27-.13-2.49.75-3.14.75-.65 0-1.66-.73-2.73-.71-1.4.02-2.7.82-3.42 2.08-1.46 2.54-.37 6.3 1.05 8.37.7 1.01 1.53 2.14 2.62 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.63.68 2.72.66 1.12-.02 1.83-1.03 2.52-2.05.8-1.16 1.13-2.29 1.15-2.35-.03-.01-2.21-.85-2.23-3.37zm-2.08-6.17c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.54.63-1.01 1.64-.88 2.61.93.07 1.88-.47 2.46-1.21z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85c-.5-.24-.84-.76-.84-1.35z" />
          <path fill="#34A853" d="M16.81 15.12L6.05 21.34l8.49-8.49 2.27 2.27z" />
          <path fill="#FBBC04" d="M20.16 10.81c.34.27.59.69.59 1.19 0 .5-.22.9-.57 1.18L17.89 14.5 15.39 12l2.5-2.5 2.27 1.31z" />
          <path fill="#EA4335" d="M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
        </svg>
      )}
      <span className="text-left leading-none">
        <span className="block text-[9px] uppercase tracking-wide text-white/60">
          {kind === "apple" ? "Download on the" : "Get it on"}
        </span>
        <span className="block text-sm font-semibold">
          {kind === "apple" ? "App Store" : "Google Play"}
        </span>
      </span>
    </span>
  );
}

/* ─── Pricing ─── */

const PLANS = [
  {
    name: "Starter",
    price: "$199",
    period: "/month",
    blurb: "For small operators getting off spreadsheets.",
    fleet: "Up to 10 vehicles",
    features: [
      "Dispatch board & route planning",
      "Live fleet radar (GPS)",
      "Driver & parent mobile apps",
      "Realtime messaging & alerts",
      "Complaint center",
      "Email support",
    ],
    cta: "Start free pilot",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$449",
    period: "/month",
    blurb: "For growing fleets that want automation.",
    fleet: "Up to 50 vehicles",
    features: [
      "Everything in Starter",
      "Route optimization (save 10-15% miles)",
      "Billing & contractor payroll",
      "On-demand trip requests",
      "Reports & on-time analytics",
      "Priority support",
    ],
    cta: "Start free pilot",
    highlight: true,
  },
  {
    name: "District",
    price: "Custom",
    period: "",
    blurb: "For districts and multi-fleet contractors.",
    fleet: "Unlimited vehicles",
    features: [
      "Everything in Growth",
      "Multi-school & multi-district",
      "SIS imports & data migration",
      "White-label option",
      "99.9% uptime SLA",
      "Dedicated onboarding",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Enterprise power, without the enterprise invoice"
            desc="Flat monthly pricing by fleet size. Unlimited dispatchers, schools, parents, and students on every plan. Two months free with annual billing."
            center
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <article
                className={`relative flex h-full flex-col rounded-3xl border bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                  p.highlight
                    ? "border-brand-primary shadow-premium lg:-translate-y-3 lg:hover:-translate-y-4"
                    : "border-slate-200/80 shadow-sm hover:shadow-premium"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-primary to-indigo-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    Most popular
                  </span>
                )}
                <h3 className="fp-mkt-heading text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.blurb}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="fp-mkt-num text-[2.6rem] font-bold leading-none tracking-tight text-slate-900">{p.price}</span>
                  {p.period && <span className="text-sm text-slate-400">{p.period}</span>}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-primary">{p.fleet}</p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckDot />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                    p.highlight
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lg"
                      : "border border-slate-300 text-slate-700 hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                  }`}
                >
                  {p.cta}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 text-center text-sm text-slate-400">
            30-day pilot on your real routes · No setup fees · Cancel anytime
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Comparison ─── */

const COMPARE_ROWS: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Live GPS tracking", false, true, true],
  ["Parent & driver mobile apps", false, true, "Extra cost"],
  ["Route optimization", false, true, true],
  ["Contractor billing & payroll", false, true, "Rare"],
  ["Realtime messaging & complaints", false, true, false],
  ["Setup time", "Weeks of spreadsheets", "Days", "6-12 months"],
  ["Typical cost", "Hidden labor hours", "From $199/mo", "$20k+ / year"],
];

function Comparison() {
  return (
    <section className="border-y border-slate-200/70 bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Why FleetPilot"
            title="The mid-market sweet spot"
            desc="More capable than spreadsheets and basic trackers. Faster and far more affordable than enterprise suites like Traversa or BusPlanner."
            center
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="pb-3 text-left font-medium text-slate-400" />
                  <th className="pb-3 text-center font-semibold text-slate-500">Basic tools</th>
                  <th className="rounded-t-2xl bg-brand-light/60 pb-3 pt-3 text-center font-bold text-brand-primary">FleetPilot</th>
                  <th className="pb-3 text-center font-semibold text-slate-500">Enterprise suites</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(([label, a, b, c], i) => (
                  <tr key={label}>
                    <td className="border-t border-slate-100 py-3.5 pr-4 font-medium text-slate-700">{label}</td>
                    <td className="border-t border-slate-100 px-3 py-3.5 text-center text-slate-500"><CompareCell v={a} /></td>
                    <td className={`border-t border-brand-light bg-brand-light/60 px-3 py-3.5 text-center font-semibold text-slate-800 ${i === COMPARE_ROWS.length - 1 ? "rounded-b-2xl" : ""}`}>
                      <CompareCell v={b} positive />
                    </td>
                    <td className="border-t border-slate-100 px-3 py-3.5 text-center text-slate-500"><CompareCell v={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CompareCell({ v, positive }: { v: boolean | string; positive?: boolean }) {
  if (typeof v === "string") return <>{v}</>;
  if (v)
    return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden className={`inline ${positive ? "text-emerald-500" : "text-slate-400"}`}>
        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="inline text-slate-300">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ─── FAQ ─── */

const FAQS = [
  {
    q: "How long does setup take?",
    a: "Most fleets are live within a week. Import your students, schools, and routes from CSV, invite your drivers, and parents join with a secure child-link code. Our team helps with migration on Growth and District plans.",
  },
  {
    q: "Do we need new GPS hardware?",
    a: "No. Drivers' phones provide GPS through the driver app out of the box. If you already run Samsara or similar telematics, we can integrate with your existing hardware.",
  },
  {
    q: "Are the mobile apps really included?",
    a: "Yes. The driver and parent apps for iOS and Android are part of every plan, with no per-seat or per-download fees. Unlimited parents can track their children at no extra cost.",
  },
  {
    q: "How does contractor billing work?",
    a: "You define rate cards per mile, per hour, per trip, or flat daily. When runs are completed, FleetPilot generates billing items automatically and rolls them into weekly invoices with PDF export. Contractors see their earnings in their own portal.",
  },
  {
    q: "Can schools see only their own students?",
    a: "Yes. School staff get a scoped portal: their students, parents, routes, today's runs, and live radar limited to vehicles serving their campus. Districts can run many schools under one organization.",
  },
  {
    q: "Is our data secure?",
    a: "Every organization's data is isolated with role-based access control. All traffic is encrypted in transit, JWT-authenticated, and we never sell or share student data. You own your data and can export it anytime.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            desc="Everything districts and contractors usually ask before a pilot."
            center
          />
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group rounded-2xl border border-slate-200/80 bg-white px-6 py-1 transition-shadow duration-300 open:shadow-md open:shadow-brand-primary/5 hover:border-slate-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 group-open:rotate-45 group-open:bg-brand-light group-open:text-brand-primary">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-16 px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            eyebrow="Contact"
            title="Talk with our team"
            desc="Questions about pricing, pilots, or migrating from your current system? Send a note and a FleetPilot specialist will follow up within one business day."
          />
          <ul className="mt-8 space-y-4 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <CheckDot />
              <span>Demo walkthroughs for districts and contractors</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckDot />
              <span>Pilot planning and spreadsheet import help</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckDot />
              <span>Direct line to the FleetPilot platform team</span>
            </li>
          </ul>
        </Reveal>
        <Reveal>
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            <MarketingContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-20 sm:px-8 lg:pb-28">
      <Reveal>
        <div className="fp-mkt-radar relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 lg:py-20">
          <div className="fp-mkt-radar-grid absolute inset-0" aria-hidden />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
          <div className="relative">
            <h2 className="fp-mkt-h2 !text-white">Ready to run a calmer fleet?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
              Pilot FleetPilot on your real routes for 30 days. Bring your spreadsheets;
              we&apos;ll handle the import.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-brand-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
              >
                Start free pilot
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60"
              >
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── Footer ─── */

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="grid w-full gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <FleetPilotLogo size={34} subtitle="K-12 transportation platform" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            Plan routes, track every bus live, and keep parents informed. The modern
            operations platform for student transportation.
          </p>
        </div>
        <FooterCol
          title="Platform"
          links={[
            ["Home", "#home"],
            ["Features", "#features"],
            ["Product", "#product"],
            ["Pricing", "#pricing"],
            ["Contact", "#contact"],
            ["FAQ", "#faq"],
          ]}
        />
        <FooterCol
          title="Portals"
          links={[
            ["Sign in", "/login"],
            ["Create account", "/signup"],
            ["Driver portal", "/login"],
            ["Parent portal", "/login"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["Contact sales", "#contact"],
            ["Support", "/login"],
            ["Privacy", "#"],
            ["Terms", "#"],
          ]}
        />
      </div>
      <div className="border-t border-slate-100">
        <p className="w-full px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} FleetPilot. Built for safer, smarter student transportation.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("#") ? (
              <a href={href} className="text-slate-600 transition-colors duration-200 hover:text-brand-primary">{label}</a>
            ) : (
              <Link href={href} className="text-slate-600 transition-colors duration-200 hover:text-brand-primary">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Shared ─── */

function SectionHeading({
  eyebrow,
  title,
  desc,
  center,
  wide,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  center?: boolean;
  wide?: boolean;
}) {
  const widthClass = wide ? "max-w-none" : "max-w-2xl";
  return (
    <div className={center ? `mx-auto ${widthClass} text-center` : widthClass}>
      <p className="fp-mkt-eyebrow">{eyebrow}</p>
      <h2 className={`fp-mkt-h2 mt-4${wide ? " lg:whitespace-nowrap" : ""}`}>{title}</h2>
      <p className={`mt-4 text-base leading-relaxed text-slate-600${wide ? " lg:whitespace-nowrap" : ""}`}>{desc}</p>
    </div>
  );
}

/* ─── Feature icons ─── */

function IconBoard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 7.5h15M7 10.5h2.5M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconRadar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10V4.5M10 10l4 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconOptimize() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 15c4-1 4-8 9-8 3 0 3.5 2.5 6 2.5M14 6l3.5 3.5L14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconParent() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 16c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5M12 13.5c.5-1.2 1.4-2 2.7-2 1.6 0 2.8 1.4 2.8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="6" y="2.5" width="8" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14a1 1 0 011 1v7a1 1 0 01-1 1H7l-3.5 3V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 9h7M7 11.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconInvoice() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 2.5h10a1 1 0 011 1v14l-3-1.8-3 1.8-3-1.8-3 1.8v-14a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 7h5M8 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconShieldCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2.5l6.5 2.5V10c0 4-2.8 6.8-6.5 8-3.7-1.2-6.5-4-6.5-8V5l6.5-2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 3a4 4 0 00-4 4v2c0 .6-.2 1.1-.6 1.5L4 12.3a1.2 1.2 0 001 2h10a1.2 1.2 0 001-2l-1.4-1.8c-.4-.4-.6-.9-.6-1.5V7a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
