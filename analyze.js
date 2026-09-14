const fs = require("fs");
const { distance } = require("fastest-levenshtein");

const listings = JSON.parse(fs.readFileSync("listings.json", "utf-8"));
const rentals = JSON.parse(fs.readFileSync("rentals.json", "utf-8"));
const projects = JSON.parse(fs.readFileSync("projects.json", "utf-8"));

// --------------------------------------------------
// Question 1: total retrievable listing records
// --------------------------------------------------

console.log("Q1 total_listing_records:", listings.length);

// --------------------------------------------------
// Question 2: distinct properties among all listing records
// --------------------------------------------------

const GEO_RADIUS_M = 50;
const AREA_TOLERANCE = 0.05;
const PRICE_TOLERANCE = 0.08;
const SCORE_THRESHOLD = 0.7;

const WEIGHTS = {
  geo: 0.2,
  project_id: 0.15,
  name_locality: 0.15,
  bed_bath_type: 0.15,
  floor: 0.05,
  area: 0.1,
  price: 0.05,
  contact: 0.1,
  description: 0.05,
};

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1);
  const dlambda = toRad(lon2 - lon1);
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlambda / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pctClose(a, b, tol) {
  if (a == null || b == null || a === 0 || b === 0) return 0;
  return Math.abs(a - b) / Math.max(a, b) <= tol ? 1 : 0;
}

function fuzzySim(a, b) {
  a = String(a ?? "");
  b = String(b ?? "");
  if (!a && !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - distance(a, b) / maxLen;
}

function scorePair(r1, r2) {
  const scores = {};

  if (r1.latitude != null && r2.latitude != null) {
    const dist = haversineM(r1.latitude, r1.longitude, r2.latitude, r2.longitude);
    scores.geo = dist <= GEO_RADIUS_M ? 1 : 0;
  } else {
    scores.geo = 0;
  }

  scores.project_id =
    r1.project_id != null && r2.project_id != null && r1.project_id === r2.project_id
      ? 1
      : 0;

  const nameSim = fuzzySim(r1.apartment_name, r2.apartment_name);
  const locSim = fuzzySim(r1.locality, r2.locality);
  scores.name_locality = (nameSim + locSim) / 2;

  const bedMatch = r1.bedroom === r2.bedroom ? 1 : 0;
  const bathMatch = r1.bathroom === r2.bathroom ? 1 : 0;
  const typeMatch = r1.property_type === r2.property_type ? 1 : 0;
  scores.bed_bath_type = (bedMatch + bathMatch + typeMatch) / 3;

  const floorMatch = r1.floor === r2.floor ? 1 : 0;
  const totalFloorMatch = r1.total_floors === r2.total_floors ? 1 : 0;
  scores.floor = (floorMatch + totalFloorMatch) / 2;

  const carpetMatch = pctClose(r1.carpet_area, r2.carpet_area, AREA_TOLERANCE);
  const sbaMatch = pctClose(r1.super_built_up_area, r2.super_built_up_area, AREA_TOLERANCE);
  scores.area = (carpetMatch + sbaMatch) / 2;

  scores.price = pctClose(r1.price, r2.price, PRICE_TOLERANCE);

  scores.contact =
    r1.posted_by_contact != null &&
    r2.posted_by_contact != null &&
    String(r1.posted_by_contact) === String(r2.posted_by_contact)
      ? 1
      : 0;

  scores.description = fuzzySim(r1.description, r2.description);

  const total = Object.keys(WEIGHTS).reduce((sum, k) => sum + scores[k] * WEIGHTS[k], 0);
  return { total, scores };
}

function findDuplicates(data) {
  const results = [];
  const byCity = {};
  for (const l of data) {
    (byCity[l.city_id] ??= []).push(l);
  }

  for (const cityId in byCity) {
    const rows = byCity[cityId];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const r1 = rows[i];
        const r2 = rows[j];
        if (r1.website === r2.website) continue;

        const { total, scores } = scorePair(r1, r2);
        if (total >= SCORE_THRESHOLD) {
          results.push({
            listing_id_1: r1.listing_id,
            listing_id_2: r2.listing_id,
            website_1: r1.website,
            website_2: r2.website,
            score: Math.round(total * 1000) / 1000,
            ...Object.fromEntries(
              Object.entries(scores).map(([k, v]) => [`sig_${k}`, Math.round(v * 100) / 100])
            ),
          });
        }
      }
    }
  }
  return results;
}

function assignCanonicalIds(data, dupPairs) {
  const parent = new Map(data.map((l) => [l.listing_id, l.listing_id]));

  function find(x) {
    while (parent.get(x) !== x) x = parent.get(x);
    return x;
  }

  function union(x, y) {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  }

  for (const pair of dupPairs) {
    union(pair.listing_id_1, pair.listing_id_2);
  }

  for (const l of data) {
    l.canonical_property_id = find(l.listing_id);
  }
  return data;
}

const dupPairs = findDuplicates(listings);
const dedupedListings = assignCanonicalIds(listings, dupPairs);

fs.writeFileSync("duplicate_pairs.json", JSON.stringify(dupPairs, null, 2));
fs.writeFileSync(
  "listings_with_canonical_id.json",
  JSON.stringify(dedupedListings, null, 2)
);

const uniqueCount = new Set(dedupedListings.map((l) => l.canonical_property_id)).size;
console.log(`Q2 unique_properties: ${uniqueCount} (from ${dupPairs.length} duplicate pairs)`);

// --------------------------------------------------
// Question 3: retrievable listing records with is_live true
// --------------------------------------------------

const liveListings = listings.filter((l) => l.is_live === true);
console.log("Q3 active_listings:", liveListings.length);

// --------------------------------------------------
// Question 4: corrupt listing_ids (records describing something impossible)
// --------------------------------------------------

function getImpossibleIds(data) {
  const impossible = new Set();
  for (const l of data) {
    if (
      l.carpet_area != null &&
      l.super_built_up_area != null &&
      l.carpet_area > l.super_built_up_area
    ) {
      impossible.add(l.listing_id);
    }
    if (l.bedroom < 0 || l.bathroom < 0) impossible.add(l.listing_id);
    if (l.bedroom != null && l.bathroom != null && l.bathroom > l.bedroom + 2) {
      impossible.add(l.listing_id);
    }
    if (l.price != null && l.price <= 0) impossible.add(l.listing_id);
    if (l.carpet_area != null && l.carpet_area <= 0) impossible.add(l.listing_id);
    if (l.floor != null && l.total_floors != null && l.floor > l.total_floors) {
      impossible.add(l.listing_id);
    }
  }
  return impossible;
}

const q4Ids = getImpossibleIds(listings);
const q4Sorted = [...q4Ids].sort();
console.log(`Q4 corrupt_listing_ids: ${q4Sorted.length}`);
console.log(q4Sorted);

// --------------------------------------------------
// Question 5: sum of monthly rent in assigned locality
// --------------------------------------------------

const ASSIGNED_LOCALITY = "Sohna Road";

const localityMatches = rentals.filter(
  (l) => l.locality && l.locality.toLowerCase() === ASSIGNED_LOCALITY.toLowerCase()
);
const totalMonthlyRent = localityMatches.reduce((sum, l) => sum + (l.price || 0), 0);

console.log(`Q5 total_monthly_rent (${ASSIGNED_LOCALITY}): ${totalMonthlyRent}`);
console.log(`  records matched: ${localityMatches.length}`);

// --------------------------------------------------
// Question 9: fake listing_ids (same phone number, different real person)
// --------------------------------------------------

function coreSignature(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((tok) => tok.length > 2)
    .sort()
    .join(" ");
}

function getFakeIds(data) {
  const byContact = {};
  for (const l of data) {
    if (!l.posted_by_contact) continue;
    (byContact[l.posted_by_contact] ??= []).push(l);
  }

  const fakeIds = new Set();
  for (const contact in byContact) {
    const group = byContact[contact];
    const distinctSignatures = new Set(group.map((l) => coreSignature(l.posted_by_name)));
    if (distinctSignatures.size > 1) {
      group.forEach((l) => fakeIds.add(l.listing_id));
    }
  }
  return fakeIds;
}

const q9Ids = getFakeIds(listings);
const q9Sorted = [...q9Ids].sort();
console.log(`Q9 fake_listing_ids: ${q9Sorted.length}`);
console.log(q9Sorted);

// --------------------------------------------------
// Question 6: mean price/carpet_area for live 2BHK, excluding Q4 + Q9 ids
// --------------------------------------------------

const eligible = listings.filter(
  (l) =>
    l.is_live === true &&
    l.bedroom === 2 &&
    !q4Ids.has(l.listing_id) &&
    !q9Ids.has(l.listing_id) &&
    l.price != null &&
    l.carpet_area != null &&
    l.carpet_area > 0
);

const ratios = eligible.map((l) => l.price / l.carpet_area);
const meanPricePerSqft = ratios.reduce((sum, v) => sum + v, 0) / ratios.length;

console.log(`Q6 avg_price_per_sqft_2bhk: ${meanPricePerSqft.toFixed(2)} (eligible records: ${eligible.length})`);

// --------------------------------------------------
// Question 7: project with the highest maximum price
// --------------------------------------------------

const costliest = projects.reduce((max, p) => (p.price_max > max.price_max ? p : max));
// price_max is documented as integer rupees but is actually in crores
// (e.g. 98.9 can't be a rupee price) - convert before reporting price_max_inr.
const costliestPriceInr = Math.round(costliest.price_max * 1e7);
console.log("Q7 costliest_project:", {
  project_id: costliest.project_id,
  price_max_raw_crores: costliest.price_max,
  price_max_inr: costliestPriceInr,
});

// --------------------------------------------------
// Question 8: listings posted in [REFERENCE - 7 days, REFERENCE), IST
// REFERENCE = 2026-09-10T00:00:00+05:30 = 2026-09-09T18:30:00Z
// --------------------------------------------------

const windowStartUTC = new Date("2026-09-02T18:30:00Z"); // inclusive
const windowEndUTC = new Date("2026-09-09T18:30:00Z"); // exclusive

const inWindow = listings.filter((l) => {
  if (!l.posted_at) return false;
  const postedAt = new Date(l.posted_at);
  return postedAt >= windowStartUTC && postedAt < windowEndUTC;
});

const q8Sorted = inWindow.map((l) => l.listing_id).sort();
console.log(`Q8 listings_last_7_days: ${q8Sorted.length}`);
console.log(q8Sorted);

// --------------------------------------------------
// Question 10: projects where reported total_listings is wrong
// --------------------------------------------------

const actualCounts = {};
for (const l of listings) {
  if (!l.project_id) continue;
  if (!l.is_live) continue;
  actualCounts[l.project_id] = (actualCounts[l.project_id] || 0) + 1;
}

const mismatches = [];
for (const p of projects) {
  const actual = actualCounts[p.project_id] || 0;
  if (actual !== p.total_listings) {
    mismatches.push({ project_id: p.project_id, reported: p.total_listings, actual });
  }
}

const sortedMismatches = mismatches.sort((a, b) =>
  a.project_id > b.project_id ? 1 : a.project_id < b.project_id ? -1 : 0
);

console.log(`Q10 projects_with_wrong_listing_count: ${sortedMismatches.length}`);
console.log(sortedMismatches);

// --------------------------------------------------
// Ship a summary for the Insights screen (findings the frontend can't
// cheaply recompute client-side, e.g. the O(n^2) fuzzy dedup for Q2).
// --------------------------------------------------

const insightsSummary = {
  generatedAt: new Date().toISOString(),
  totalListingRecords: listings.length,
  uniqueProperties: uniqueCount,
  duplicatePairs: dupPairs.length,
  activeListings: liveListings.length,
  corruptListingCount: q4Sorted.length,
  fakeListingCount: q9Sorted.length,
  avgPricePerSqft2bhk: Number(meanPricePerSqft.toFixed(2)),
  costliestProject: {
    project_id: costliest.project_id,
    price_max_inr: costliestPriceInr,
  },
  listingsLast7Days: q8Sorted.length,
  projectsWithWrongListingCount: sortedMismatches.length,
  totalProjects: projects.length,
  notes: [
    "Project price_min/price_max are documented as integer rupees but are actually in crores.",
    "/v1/analytics/summary does not exist - these figures are computed from the full paginated dataset instead.",
  ],
};

fs.writeFileSync(
  "frontend/src/data/insights.json",
  JSON.stringify(insightsSummary, null, 2)
);
console.log("\nWrote frontend/src/data/insights.json");
