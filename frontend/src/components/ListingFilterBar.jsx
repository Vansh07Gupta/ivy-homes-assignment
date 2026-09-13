import { titleCase } from "../lib/format";

export default function ListingFilterBar({ filters, onChange, localities, furnishings }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
      <select value={filters.locality} onChange={set("locality")} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
        <option value="">All localities</option>
        {localities.map((l) => (
          <option key={l} value={l}>
            {titleCase(l)}
          </option>
        ))}
      </select>

      <select value={filters.bedroom} onChange={set("bedroom")} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
        <option value="">Any bedrooms</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} BHK
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Min price"
        value={filters.minPrice}
        onChange={set("minPrice")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />

      <input
        type="number"
        placeholder="Max price"
        value={filters.maxPrice}
        onChange={set("maxPrice")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />

      <select value={filters.furnishing} onChange={set("furnishing")} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
        <option value="">Any furnishing</option>
        {furnishings.map((f) => (
          <option key={f} value={f}>
            {titleCase(f)}
          </option>
        ))}
      </select>

      <button
        onClick={() => onChange({ locality: "", bedroom: "", minPrice: "", maxPrice: "", furnishing: "" })}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        Clear filters
      </button>
    </div>
  );
}
