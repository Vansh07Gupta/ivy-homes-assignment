import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { fetchAllPages } from "../api/client";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);


export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState({
    listings: [],
    rentals: [],
    projects: [],
    loading: false,
    error: null,
    loadedAt: null,
  });

  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [listings, rentals, projects] = await Promise.all([
        fetchAllPages("/v1/listings"),
        fetchAllPages("/v1/rentals"),
        fetchAllPages("/v1/projects"),
      ]);
      setState({ listings, rentals, projects, loading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  return <DataContext.Provider value={{ ...state, reload: load }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
