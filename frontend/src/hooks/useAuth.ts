import { useEffect, useState } from "react";
import { api } from "../services/api";

export interface SessionUser {
  id?: number;
  email: string;
  name?: string;
  role?: "ADMIN" | "B2B_USER";
  approvalStatus?: string;
  plan?: string;
}

export const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem("location_token"));
  const [user, setUser] = useState<SessionUser | null>(() => {
    const stored = localStorage.getItem("location_user");
    return stored ? JSON.parse(stored) as SessionUser : null;
  });
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    api.get("/auth/me")
      .then((response) => {
        const nextUser = { ...user, ...response.data.user } as SessionUser;
        setUser(nextUser);
        localStorage.setItem("location_user", JSON.stringify(nextUser));
      })
      .catch(() => {
        localStorage.removeItem("location_token");
        localStorage.removeItem("location_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, [token]);

  const logout = () => {
    localStorage.removeItem("location_token");
    localStorage.removeItem("location_user");
    setToken(null);
    setUser(null);
  };

  return { token, user, checking, isAuthenticated: Boolean(token), isAdmin: user?.role === "ADMIN", logout };
};
