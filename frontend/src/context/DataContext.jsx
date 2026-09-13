import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchAllPages } from "../api/client";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

// The assignment's own advice: pull the whole (city-scoped) dataset down
// once and filter/paginate/browse it locally, rather than trusting the
// server's documented filters - several of which are quietly ignored.
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

  const load = useCallback(async () => {
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
