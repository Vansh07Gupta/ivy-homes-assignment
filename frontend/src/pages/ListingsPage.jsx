import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useSaved } from "../context/SavedContext";
import { usePagination } from "../hooks/usePagination";
import ListingFilterBar from "../components/ListingFilterBar";
import ListingCard from "../components/ListingCard";
import Pagination from "../components/Pagination";

const EMPTY_FILTERS = { locality: "", bedroom: "", minPrice: "", maxPrice: "", furnishing: "" };

export default function ListingsPage() {
  const { listings, loading } = useData();
  const { savedIds, toggle } = useSaved();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const localities = useMemo(
    () => [...new Set(listings.map((l) => l.locality).filter(Boolean))].sort(),
    [listings]
  );
  const furnishings = useMemo(
    () => [...new Set(listings.map((l) => l.furnishing).filter(Boolean))].sort(),
    [listings]
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.locality && l.locality !== filters.locality) return false;
      if (filters.bedroom && String(l.bedroom) !== filters.bedroom) return false;
      if (filters.furnishing && l.furnishing !== filters.furnishing) return false;
      if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [listings, filters]);

  const { page, setPage, totalPages, pageItems, total } = usePagination(filtered, 20);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Listings</h1>
      <ListingFilterBar filters={filters} onChange={setFilters} localities={localities} furnishings={furnishings} />

      {pageItems.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {loading && listings.length === 0 ? "Loading listings…" : "No listings match these filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              saved={savedIds.has(listing.listing_id)}
              onToggleSave={(id) => toggle(id, listing)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} total={total} />
    </div>
  );
}
