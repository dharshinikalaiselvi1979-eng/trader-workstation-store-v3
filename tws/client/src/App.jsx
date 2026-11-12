import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing   from "./pages/Landing";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      {/* 1. Landing Page always starts here */}
      <Route path="/" element={<Landing />} />

      {/* 2. Google Login Page */}
      <Route path="/login" element={<Login />} />

      {/* 3. Protected Dashboard (requires Google login) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
