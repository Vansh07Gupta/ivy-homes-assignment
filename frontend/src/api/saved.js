import { apiFetch } from "./client";

export function getSaved() {
  return apiFetch("/v1/saved");
}

export function addSaved(listingId) {
  return apiFetch("/v1/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listing_id: listingId }),
  });
}

export function removeSaved(listingId) {
  return apiFetch(`/v1/saved/${listingId}`, { method: "DELETE" });
}
