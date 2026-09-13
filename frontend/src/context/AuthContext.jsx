import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAuthState, subscribe, login as storeLogin, logout as storeLogout } from "../api/authStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getAuthState());

  useEffect(() => subscribe(setAuth), []);

  const login = useCallback((email, password) => storeLogin(email, password), []);
  const logout = useCallback(() => storeLogout(), []);

  const value = {
    isAuthenticated: !!auth,
    user: auth?.user ?? null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
