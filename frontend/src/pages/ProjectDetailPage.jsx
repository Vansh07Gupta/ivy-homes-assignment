import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useData } from "../context/DataContext";
import ListingCard from "../components/ListingCard";
import BackLink from "../components/BackLink";
import { useSaved } from "../context/SavedContext";
import { formatCrores, formatDate, titleCase } from "../lib/format";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { listings, loading: dataLoading } = useData();
  const { savedIds, toggle } = useSaved();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setProject(null);
    setError(null);
    apiFetch(`/v1/projects/${id}`).then(setProject).catch((err) => setError(err.message));
  }, [id]);

  const liveListings = useMemo(
    () => listings.filter((l) => l.project_id === id && l.is_live),
    [listings, id]
  );

  if (error) return <p className="text-red-600">Could not load this project: {error}</p>;
  if (!project) return <p className="text-gray-500">Loading…</p>;

  const countMismatch = project.total_listings !== liveListings.length;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink fallback="/projects">← Back to projects</BackLink>

      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{project.apartment_name}</h1>
        <p className="text-gray-500">
          {project.developer_name} · {titleCase(project.locality)}
        </p>

        {/* price_min/price_max are documented as integer rupees but are actually crores */}
        <p className="mt-4 text-2xl font-bold text-gray-900">
          {formatCrores(project.price_min)} – {formatCrores(project.price_max)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Status" value={titleCase(project.project_status)} />
          <Field label="Total units" value={project.total_units} />
          <Field label="Towers" value={project.total_towers} />
          <Field label="Floors" value={project.total_floors} />
          <Field label="Area range" value={`${project.min_area_sqft}–${project.max_area_sqft} sqft`} />
          <Field label="Launch" value={formatDate(project.launch_date)} />
          <Field label="Possession" value={formatDate(project.possession_date)} />
          <Field label="RERA" value={project.rera_number} />
        </div>

        {project.amenities?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Amenities</p>
            <p className="text-gray-800">{project.amenities.map(titleCase).join(", ")}</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Live listings ({liveListings.length})
          </h2>
          <span className="text-sm text-gray-500">
            Total listings = {project.total_listings}
            {dataLoading && listings.length === 0 && <span className="ml-2 text-gray-400">(still loading listings…)</span>}
            {!(dataLoading && listings.length === 0) && countMismatch && (
              <span className="ml-2 text-amber-600">(doesn't match)</span>
            )}
          </span>
        </div>

        {liveListings.length === 0 ? (
          <p className="text-gray-500">No live listings from this project right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {liveListings.map((listing) => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                saved={savedIds.has(listing.listing_id)}
                onToggleSave={(lid) => toggle(lid, listing)}
              />
            ))}
          </div>
        )}
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
