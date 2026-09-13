import { Link } from "react-router-dom";
import { formatINR, formatArea, titleCase } from "../lib/format";

export default function RentalCard({ rental }) {
  return (
    <Link
      to={`/rentals/${rental.listing_id}`}
      className="flex flex-col rounded border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300"
    >
      <span className="font-medium text-gray-900">{rental.apartment_name || rental.title}</span>
      <span className="text-sm text-gray-500">{titleCase(rental.locality)}</span>
      <span className="mt-2 text-lg font-semibold text-gray-900">{formatINR(rental.price)}/mo</span>
      <span className="text-sm text-gray-600">
        {rental.bedroom} BHK · {formatArea(rental.carpet_area)}
      </span>
      <span className="text-xs text-gray-400 mt-1">Deposit {formatINR(rental.deposit)}</span>
    </Link>
  );
}
