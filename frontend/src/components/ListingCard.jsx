import { Link } from "react-router-dom";
import { formatINR, formatArea, titleCase } from "../lib/format";

export default function ListingCard({ listing, saved, onToggleSave }) {
  return (
    <div className="flex flex-col rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/listings/${listing.listing_id}`} className="font-medium text-gray-900 hover:underline">
          {listing.apartment_name || "Unnamed property"}
        </Link>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(listing.listing_id)}
            className={`text-sm ${saved ? "text-amber-500" : "text-gray-300"}`}
            title={saved ? "Remove from saved" : "Save"}
          >
            {saved ? "★" : "☆"}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500">{titleCase(listing.locality)}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{formatINR(listing.price)}</p>
      <p className="text-sm text-gray-600">
        {listing.bedroom} BHK · {listing.bathroom} bath · {formatArea(listing.carpet_area)}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {titleCase(listing.furnishing)} · {titleCase(listing.property_type)}
      </p>
      {!listing.is_live && (
        <span className="mt-2 inline-block w-fit rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          not live
        </span>
      )}
    </div>
  );
}
