import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/axios";

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20L12 4L21 20H16L12 12L8 20H3Z" fill="#3b82f6" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function Login() {
  const { googleLogin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [buttonRendered, setButtonRendered] = useState(false);
  const googleBtnRef = useRef(null);

  const redirectTarget = new URLSearchParams(window.location.search).get("redirect") || "/products";

  // Initialize Google Identity Services once the script has loaded
  useEffect(() => {
    let active = true;

    async function setupAuth() {
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        try {
          const res = await fetch("/api/config");
          const data = await res.json();
          clientId = data.googleClientId;
        } catch {}
      }

      if (!clientId) {
        if (active) setError("Google Client ID is not configured. Check GOOGLE_CLIENT_ID in .env");
        return;
      }

      const initGSI = () => {
        if (!active || !window.google?.accounts?.id) return;
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
            error_callback: (err) => {
              console.warn("GSI error event:", err);
              if (err && (err.type === "origin_mismatch" || String(err).includes("origin"))) {
                setError("Origin " + window.location.origin + " is not registered in Google Cloud Console under 'Authorised JavaScript origins'.");
              }
            }
          });

          const btnEl = document.getElementById("google-signin-btn");
          if (btnEl) {
            btnEl.innerHTML = "";
            window.google.accounts.id.renderButton(btnEl, {
              type: "standard",
              theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
              size: "large",
              text: "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 320,
            });
            if (active) setButtonRendered(true);
          }
        } catch (e) {
          console.error("GSI init exception:", e);
        }
      };

      if (window.google?.accounts?.id) {
        initGSI();
      } else {
        const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
        if (existing) {
          existing.addEventListener("load", initGSI);
        } else {
          const s = document.createElement("script");
          s.src = "https://accounts.google.com/gsi/client";
          s.async = true;
          s.defer = true;
          s.onload = initGSI;
          document.head.appendChild(s);
        }
      }
    }

    setupAuth();
    return () => { active = false; };
  }, []);

  async function handleCredential(response) {
    if (!response?.credential) return;
    setLoading(true);
    setError("");
    try {
      const data = await googleLogin(response.credential);
      toast.success(`Welcome${data.isNewUser ? "" : " back"}, ${data.user.name.split(" ")[0]}! 🎉`);
      const params = new URLSearchParams(window.location.search);
      const target = params.get("redirect") || "/products";
      window.location.assign(target);
    } catch (err) {
      const msg = errMsg(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* ── Left panel (hero) ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-ink lg:flex">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Logo size={36} />
          <span className="text-2xl font-bold tracking-tight">TraderWorkStation</span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h1 className="max-w-md text-5xl font-extrabold leading-tight tracking-tight">
            Trade Smarter.<br />
            <span className="text-accent">Learn from</span><br />
            the Best.
          </h1>
          <p className="mt-5 max-w-sm text-primary-ink/70 text-lg leading-relaxed">
            Professional trading guides, live sessions, and a community of serious traders.
          </p>

          {/* Floating stats */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { v: "8+",      l: "Trading Guides" },
              { v: "Free",    l: "Live Sessions" },
              { v: "10 days", l: "Refund Window" },
              { v: "⚡",     l: "Instant Download" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-primary-ink/10 bg-primary-ink/5 p-4">
                <div className="text-2xl font-bold text-accent">{s.v}</div>
                <div className="mt-0.5 text-xs text-primary-ink/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-primary-ink/50">
          Trading involves substantial risk. Educational use only.
        </p>
      </aside>

      {/* ── Right panel (login form) ── */}
      <main className="flex flex-col items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Logo size={28} />
            <span className="text-lg font-bold tracking-tight">TraderWorkStation</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">Welcome back!</h2>
          <p className="mt-2 text-sm text-muted">
            Sign in with your Google account to continue.
          </p>

          {/* If already signed in, show status & actions without automatically redirecting away */}
          {user && !loading && (
            <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white shadow-md">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  (user.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <p className="font-semibold text-ink">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => window.location.assign(redirectTarget)}
                  className="btn-primary w-full py-3 text-sm font-semibold"
                >
                  Enter Dashboard →
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    toast.success("Signed out successfully");
                  }}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-muted transition hover:bg-surface-hover hover:text-ink"
                >
                  Sign in with a different account
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">{user ? "Or sign in again" : "Continue with Google"}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              <Spinner />
              Authenticating with Google…
            </div>
          )}

          {/* Error message */}
          {error && !loading && (
            <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Official Google Sign-In button (rendered by GSI) */}
          <div
            id="google-signin-btn"
            className="flex justify-center min-h-[44px]"
            aria-label="Sign in with Google"
          />

          {/* Fallback button only if official GSI button hasn't rendered yet */}
          {!loading && !buttonRendered && (
            <button
              type="button"
              className="btn-google mt-3"
              onClick={() => {
                if (window.google?.accounts?.id) {
                  window.google.accounts.id.prompt();
                } else {
                  setError("Google Sign-In script is loading or blocked by ad-blocker. Please refresh.");
                }
              }}
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          )}

          {/* Back to landing */}
          <div className="mt-8 text-center">
            <a href="/" className="text-sm text-muted hover:text-ink">
              ← Back to home
            </a>
          </div>

          {/* Security note */}
          <p className="mt-6 text-center text-xs text-muted">
            🔒 Secure sign-in via Google OAuth 2.0.
            <br />
            We never store your password.
          </p>
        </div>
      </main>
    </div>
  );
}

