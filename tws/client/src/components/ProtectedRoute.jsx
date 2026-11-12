import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Spinner shown while verifying cookie session on mount */
function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
    </div>
  );
}

/** Wraps routes that require authentication */
export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  if (checking) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Wraps routes that should NOT be accessible when logged in */
export function GuestRoute() {
  const { user, checking } = useAuth();
  if (checking) return <Spinner />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

