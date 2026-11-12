import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20L12 4L21 20H16L12 12L8 20H3Z" fill="#3b82f6" />
    </svg>
  );
}

function Avatar({ user }) {
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-accent/30"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-white text-sm">
      {(user?.name || "U").charAt(0).toUpperCase()}
    </div>
  );
}

const NAV_LINKS = [
  { label: "Products",   href: "/products" },
  { label: "Blog",       href: "/blog" },
  { label: "Strategies", href: "/strategies" },
  { label: "Contact",    href: "/contact.html" },
];

const QUICK_LINKS = [
  { emoji: "📚", label: "Browse Guides",        href: "/products",        desc: "Explore all trading guides" },
  { emoji: "📝", label: "Read Blog",             href: "/blog",            desc: "Tips, strategies and market insights" },
  { emoji: "🎬", label: "Video Strategies",      href: "/strategies",      desc: "Watch strategy walkthroughs" },
  { emoji: "📦", label: "Find My Orders",        href: "/find-orders.html", desc: "Track your purchases" },
  { emoji: "🔴", label: "Live Sessions",         href: "/#live",           desc: "Register for the next session" },
  { emoji: "💬", label: "Contact Support",       href: "/contact.html",    desc: "Get help from the team" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [dropOpen, setDropOpen] = useState(false);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("tws_theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("You've been signed out.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2 font-bold text-ink no-underline">
            <Logo />
            <span className="text-lg tracking-tight">TraderWorkStation</span>
          </a>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted hover:text-ink transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right: theme + user menu */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-secondary text-xs px-3 py-2">
              {dark ? "☀️" : "🌙"}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-subtle transition"
              >
                <Avatar user={user} />
                <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span>
                <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {dropOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface shadow-xl">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{user?.name}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <a href="/find-orders.html" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-subtle">
                        📦 My Orders
                      </a>
                      <a href="/contact.html" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-subtle">
                        💬 Support
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
                      >
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Welcome banner */}
        <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar user={user} />
            <div>
              <h1 className="text-2xl font-bold text-ink">
                {greeting()}, {user?.name?.split(" ")[0] || "Trader"}! 👋
              </h1>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary self-start sm:self-auto"
          >
            Sign out
          </button>
        </section>

        {/* Quick links grid */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-ink">Quick access</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((q) => (
              <a
                key={q.label}
                href={q.href}
                className="card group flex items-start gap-4 no-underline transition hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl group-hover:bg-accent/20 transition">
                  {q.emoji}
                </div>
                <div>
                  <div className="font-semibold text-ink group-hover:text-accent transition">{q.label}</div>
                  <div className="mt-0.5 text-xs text-muted">{q.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Account info card */}
        <section className="card">
          <h2 className="mb-4 text-lg font-bold text-ink">Your account</h2>
          <div className="divide-y divide-border">
            {[
              { label: "Name",           value: user?.name },
              { label: "Email",          value: user?.email },
              { label: "Sign-in method", value: "Google" },
              { label: "Session",        value: "Active (7-day cookie)" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-muted">{row.label}</span>
                <span className="text-sm font-medium text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA to main store */}
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <h3 className="text-xl font-bold text-ink">Ready to explore?</h3>
          <p className="mt-2 text-sm text-muted">
            Discover our professional trading guides and join upcoming live sessions.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href="/products" className="btn-primary px-6 py-3">
              Browse Guides →
            </a>
            <a href="/#live" className="btn-secondary px-6 py-3">
              🔴 Live Sessions
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Trader WorkStation. All rights reserved. &nbsp;·&nbsp;
        <a href="/privacy.html" className="hover:text-ink">Privacy</a> &nbsp;·&nbsp;
        <a href="/terms.html" className="hover:text-ink">Terms</a> &nbsp;·&nbsp;
        Trading involves substantial risk. Educational use only.
      </footer>
    </div>
  );
}

