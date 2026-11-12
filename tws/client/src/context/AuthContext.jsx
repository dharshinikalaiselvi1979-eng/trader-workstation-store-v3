import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { errMsg } from "../api/axios";

const AuthContext = createContext(null);
const STORAGE_KEY = "tws_user";

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(loadUser);
  const [checking, setChecking] = useState(true); // true while verifying session on mount

  // On first render verify the cookie/token against the backend
  useEffect(() => {
    const stored = loadUser();
    if (!stored) { setChecking(false); return; }
    api.get("/auth/me")
      .then(({ data }) => {
        const u = { ...stored, ...data.user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        // Server says session is invalid → clear local state
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  // Called after Google credential is received
  const googleLogin = useCallback(async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    const userData = { ...data.user, token: data.token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore network errors */ }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, checking, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

