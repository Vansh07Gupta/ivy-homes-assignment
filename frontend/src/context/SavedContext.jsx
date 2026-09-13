import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getSaved, addSaved, removeSaved } from "../api/saved";
import { useAuth } from "./AuthContext";

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  const reload = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const data = await getSaved();
      setSaved(data.results);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) reload();
    else setSaved([]);
  }, [isAuthenticated, reload]);

  const savedIds = useMemo(() => new Set(saved.map((l) => l.listing_id)), [saved]);

  const toggle = useCallback(
    async (listingId, listing) => {
      const wasSaved = savedIds.has(listingId);
      if (wasSaved) {
        setSaved((s) => s.filter((l) => l.listing_id !== listingId));
      } else {
        setSaved((s) => [...s, listing ?? { listing_id: listingId }]);
      }

      try {
        if (wasSaved) await removeSaved(listingId);
        else await addSaved(listingId);
      } catch (err) {
        if (wasSaved) setSaved((s) => [...s, listing ?? { listing_id: listingId }]);
        else setSaved((s) => s.filter((l) => l.listing_id !== listingId));
        console.error("Failed to update saved listing:", err.message);
      }
    },
    [savedIds]
  );

  return (
    <SavedContext.Provider value={{ saved, savedIds, loading, toggle, reload }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}
