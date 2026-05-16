import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi";

const AuthContext = createContext(null);
const TOKEN_KEY = "cafeshop_token";
const USER_KEY = "cafeshop_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    setToken(data.token);
    setUser({ fullName: data.fullName, email: data.email, role: data.role });
    return data;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setToken(data.token);
    setUser({ fullName: data.fullName, email: data.email, role: data.role });
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, register, logout }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Chưa có ngữ cảnh đăng nhập.");
  return ctx;
}
