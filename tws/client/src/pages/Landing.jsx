import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* SVG logo matching the existing TWS brand */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20L12 4L21 20H16L12 12L8 20H3Z" fill="#3b82f6" />
    </svg>
  );
}

const STATS = [
  { label: "Trading Guides",    value: "8+" },
  { label: "Live Sessions",     value: "Free" },
  { label: "Money-back Window", value: "10 days" },
  { label: "Instant Download",  value: "✓" },
];

const FEATURES = [
  {
    icon: "📊",
    title: "Professional Guides",
    desc: "Practical trading strategies crafted by seasoned market professionals.",
  },
  {
    icon: "🎯",
    title: "Risk Management",
    desc: "Learn to protect your capital and trade with discipline and precision.",
  },
  {
    icon: "🔴",
    title: "Live Sessions",
    desc: "Join free live market sessions and trade alongside the community.",
  },
  {
    icon: "⚡",
    title: "Instant Access",
    desc: "Download everything immediately after purchase. No waiting.",
  },
];

export default function Landing() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  // Landing page always stays here — user must explicitly click "Get Started" to navigate
  return (
    <div className="min-h-screen bg-bg">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2.5 font-bold text-ink no-underline">
            <Logo size={28} />
            <span className="text-lg tracking-tight">TraderWorkStation</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/products" className="hidden text-sm font-medium text-muted hover:text-ink sm:inline">
              Products
            </a>
            <a href="/blog" className="hidden text-sm font-medium text-muted hover:text-ink sm:inline">
              Blog
            </a>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Background gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Professional Trading Resources
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Trade Smarter.{" "}
            <span className="text-accent">Learn from</span>
            <br />
            the Market's Best.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Download clear, practical trading guides, join live sessions, and master the
            markets. Every purchase backed by our 10-day money-back guarantee.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              id="getStartedBtn"
              onClick={() => navigate("/login")}
              className="btn-primary px-8 py-4 text-base"
            >
              Get Started — Sign In with Google
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a
              href="/products"
              className="btn-secondary px-8 py-4 text-base"
            >
              Browse Guides
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl font-bold text-accent">{s.value}</div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-ink">
            Everything you need to trade with confidence
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-base font-semibold text-ink">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="card border-accent/30 bg-accent/5">
            <h2 className="text-3xl font-bold text-ink">Ready to level up your trading?</h2>
            <p className="mt-3 text-muted">
              Sign in with Google to access your dashboard, track your orders, and unlock all features.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary mt-6 px-8 py-3.5 text-base"
            >
              Sign In with Google
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Logo size={18} />
              <span>© {new Date().getFullYear()} Trader WorkStation. All rights reserved.</span>
            </div>
            <p className="text-xs text-muted">
              Trading involves substantial risk of loss. Educational use only, not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
