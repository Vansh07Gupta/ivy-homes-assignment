import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { formatINR, titleCase } from "../lib/format";
import insights from "../data/insights.json";

function median(nums) {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function InsightsPage() {
  const { listings, loading } = useData();

  // /v1/analytics/summary does not exist (404), so this is computed live
  // from the fully-paginated /v1/listings dataset instead.
  const live = useMemo(() => {
    const prices = listings.map((l) => l.price).filter(Boolean);
    const pricePerSqft = listings
      .filter((l) => l.carpet_area > 0)
      .map((l) => l.price / l.carpet_area);

    const byLocality = {};
    const byBhk = {};
    for (const l of listings) {
      if (l.locality) {
        (byLocality[l.locality] ??= []).push(l.price);
      }
      if (l.bedroom != null) {
        byBhk[l.bedroom] = (byBhk[l.bedroom] || 0) + 1;
      }
    }

    const localityStats = Object.entries(byLocality)
      .map(([locality, ps]) => ({ locality, count: ps.length, medianPrice: median(ps) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const bhkStats = Object.entries(byBhk)
      .map(([bedroom, count]) => ({ bedroom, count }))
      .sort((a, b) => a.bedroom - b.bedroom);

    return {
      totalListings: listings.length,
      medianPrice: median(prices),
      medianPricePerSqft: median(pricePerSqft),
      localityStats,
      bhkStats,
    };
  }, [listings]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Insights</h1>

      <section className="mb-6 rounded border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">City summary</h2>
        <p className="mb-3 text-xs text-gray-400">
          /v1/analytics/summary is documented but returns 404 - these numbers are computed from the
          full listings dataset instead.
          {loading && listings.length === 0 && " Still loading…"}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total listings" value={live.totalListings} />
          <Stat label="Median price" value={formatINR(live.medianPrice)} />
          <Stat label="Median ₹/sqft" value={live.medianPricePerSqft?.toFixed(0)} />
        </div>
      </section>

      <section className="mb-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Top localities</h2>
          <ul className="space-y-1 text-sm">
            {live.localityStats.map((s) => (
              <li key={s.locality} className="flex justify-between">
                <span>{titleCase(s.locality)}</span>
                <span className="text-gray-500">
                  {s.count} · {formatINR(s.medianPrice)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">By bedroom count</h2>
          <ul className="space-y-1 text-sm">
            {live.bhkStats.map((s) => (
              <li key={s.bedroom} className="flex justify-between">
                <span>{s.bedroom} BHK</span>
                <span className="text-gray-500">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded border border-amber-200 bg-amber-50 p-5">
        <h2 className="mb-1 font-semibold text-gray-900">What we found wrong with the data</h2>
        <p className="mb-3 text-xs text-gray-500">
          As of {new Date(insights.generatedAt).toLocaleString("en-IN")}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Duplicate records" value={`${insights.totalListingRecords - insights.uniqueProperties} of ${insights.totalListingRecords}`} />
          <Stat label="Corrupt listings" value={insights.corruptListingCount} />
          <Stat label="Fake listings" value={insights.fakeListingCount} />
          <Stat label="Live listings" value={insights.activeListings} />
          <Stat label="Avg ₹/sqft (2BHK, cleaned)" value={insights.avgPricePerSqft2bhk.toFixed(2)} />
          <Stat
            label="Projects with wrong listing count"
            value={`${insights.projectsWithWrongListingCount} of ${insights.totalProjects}`}
          />
        </div>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700">
          {insights.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}
