import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { usePagination } from "../hooks/usePagination";
import RentalCard from "../components/RentalCard";
import Pagination from "../components/Pagination";
import { titleCase } from "../lib/format";

export default function RentalsPage() {
  const { rentals, loading } = useData();
  const [locality, setLocality] = useState("");
  const [bedroom, setBedroom] = useState("");

  const localities = useMemo(
    () => [...new Set(rentals.map((r) => r.locality).filter(Boolean))].sort(),
    [rentals]
  );

  const filtered = useMemo(
    () =>
      rentals.filter((r) => {
        if (locality && r.locality !== locality) return false;
        if (bedroom && String(r.bedroom) !== bedroom) return false;
        return true;
      }),
    [rentals, locality, bedroom]
  );

  const { page, setPage, totalPages, pageItems, total } = usePagination(filtered, 20);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Rentals</h1>

      <div className="mb-4 flex gap-3 rounded border border-gray-200 bg-white p-4">
        <select value={locality} onChange={(e) => setLocality(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All localities</option>
          {localities.map((l) => (
            <option key={l} value={l}>
              {titleCase(l)}
            </option>
          ))}
        </select>
        <select value={bedroom} onChange={(e) => setBedroom(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Any bedrooms</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} BHK
            </option>
          ))}
        </select>
      </div>

      {pageItems.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {loading && rentals.length === 0 ? "Loading rentals…" : "No rentals match these filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((rental) => (
            <RentalCard key={rental.listing_id} rental={rental} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} total={total} />
    </div>
  );
}
