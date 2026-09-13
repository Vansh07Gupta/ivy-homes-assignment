import { useSaved } from "../context/SavedContext";
import ListingCard from "../components/ListingCard";

export default function FavouritesPage() {
  const { saved, savedIds, loading, toggle } = useSaved();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Saved listings</h1>

      {loading && saved.length === 0 && <p className="text-gray-500">Loading…</p>}
      {!loading && saved.length === 0 && <p className="text-gray-500">You haven't saved any listings yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((listing) => (
          <ListingCard
            key={listing.listing_id}
            listing={listing}
            saved={savedIds.has(listing.listing_id)}
            onToggleSave={(id) => toggle(id, listing)}
          />
        ))}
      </div>
    </div>
  );
}
