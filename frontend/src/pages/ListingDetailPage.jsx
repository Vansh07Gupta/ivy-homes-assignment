import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useSaved } from "../context/SavedContext";
import BackLink from "../components/BackLink";
import { formatINR, formatArea, formatDate, titleCase } from "../lib/format";

export default function ListingDetailPage() {
  const { id } = useParams();
  const { savedIds, toggle } = useSaved();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setListing(null);
    setError(null);
    // /v1/listing/{id} (singular, as documented) 404s - the real path is plural.
    apiFetch(`/v1/listings/${id}`)
      .then(setListing)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-600">Could not load this listing: {error}</p>;
  if (!listing) return <p className="text-gray-500">Loading…</p>;

  const saved = savedIds.has(listing.listing_id);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink fallback="/listings">← Back to listings</BackLink>

      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{listing.apartment_name}</h1>
            <p className="text-gray-500">{titleCase(listing.locality)}</p>
          </div>
          <button
            onClick={() => toggle(listing.listing_id, listing)}
            className={`rounded border px-3 py-1.5 text-sm ${
              saved ? "border-amber-400 bg-amber-50 text-amber-600" : "border-gray-300 text-gray-600"
            }`}
          >
            {saved ? "★ Saved" : "☆ Save"}
          </button>
        </div>

        <p className="mt-4 text-3xl font-bold text-gray-900">{formatINR(listing.price)}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Bedrooms" value={listing.bedroom} />
          <Field label="Bathrooms" value={listing.bathroom} />
          <Field label="Balcony" value={listing.balcony} />
          <Field label="Floor" value={`${listing.floor} / ${listing.total_floors}`} />
          <Field label="Carpet area" value={formatArea(listing.carpet_area)} />
          <Field label="Super built-up" value={formatArea(listing.super_built_up_area)} />
          <Field label="Furnishing" value={titleCase(listing.furnishing)} />
          <Field label="Facing" value={titleCase(listing.facing_direction)} />
          <Field label="Property type" value={titleCase(listing.property_type)} />
          <Field label="Parking" value={listing.covered_parking} />
          <Field label="Posted" value={formatDate(listing.posted_at)} />
          <Field label="Verified" value={listing.is_verified ? "Yes" : "No"} />
        </div>

        <p className="mt-6 text-sm text-gray-700">{listing.description}</p>

        <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <p>
            Posted by {listing.posted_by_name} ({titleCase(listing.posted_by)}) · {listing.posted_by_contact}
          </p>
          {listing.project_id && <p className="mt-1">Part of project {listing.project_id}</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-gray-800">{value ?? "—"}</p>
    </div>
  );
}
