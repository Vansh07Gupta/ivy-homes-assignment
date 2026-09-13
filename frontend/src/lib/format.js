export function formatINR(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
export function formatCrores(crores) {
  if (crores == null) return "—";
  return formatINR(crores * 1e7);
}

export function formatArea(sqft) {
  if (sqft == null) return "—";
  return `${sqft.toLocaleString("en-IN")} sqft`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function titleCase(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
