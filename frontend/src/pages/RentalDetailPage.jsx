import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import BackLink from "../components/BackLink";
import { formatINR, formatArea, formatDate, titleCase } from "../lib/format";

export default function RentalDetailPage() {
  const { id } = useParams();
  const [rental, setRental] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRental(null);
    setError(null);
    apiFetch(`/v1/rentals/${id}`).then(setRental).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-600">Could not load this rental: {error}</p>;
  if (!rental) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink fallback="/rentals">← Back to rentals</BackLink>

      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{rental.apartment_name || rental.title}</h1>
        <p className="text-gray-500">{titleCase(rental.locality)}</p>

        <p className="mt-4 text-3xl font-bold text-gray-900">{formatINR(rental.price)}/mo</p>
        <p className="text-sm text-gray-600">Deposit {formatINR(rental.deposit)} · Maintenance {formatINR(rental.maintenance)}/mo</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Bedrooms" value={rental.bedroom} />
          <Field label="Bathrooms" value={rental.bathroom} />
          <Field label="Floor" value={`${rental.floor} / ${rental.total_floors}`} />
          <Field label="Carpet area" value={formatArea(rental.carpet_area)} />
          <Field label="Super built-up" value={formatArea(rental.super_builtup_area)} />
          <Field label="Furnishing" value={titleCase(rental.furnishing)} />
          <Field label="Facing" value={titleCase(rental.facing_direction)} />
          <Field label="Property type" value={titleCase(rental.property_type)} />
          <Field label="Posted" value={formatDate(rental.posted_at)} />
        </div>

        <p className="mt-6 text-sm text-gray-700">{rental.description}</p>

        <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <p>
            Posted by {rental.posted_by_name} ({titleCase(rental.posted_by)}) · {rental.posted_by_contact}
          </p>
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
