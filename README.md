# Ivy Homes — submission

## Links
- **Live Demo:** https://ivy-homes-frontend-wrfj.onrender.com

## Tools

Built with [Claude Code](https://claude.com/claude-code) (Sonnet 5) throughout — scaffolding the frontend,
writing the data-analysis scripts, and, critically, driving the live API and a real headless
Framework: Vite + React (plain JS) + Tailwind, deployed as a static SPA.

## How to run it

```bash
cd frontend
npm install
cp .env.example .env 
npm run dev           
```


## How I got the answers in submission.json

The frontend is the deliverable this repo ships; the Part 2 answers and Part 3 findings were
produced by local node script that:

1. Logged in and paged `/v1/listings`, `/v1/rentals` and `/v1/projects` to completion via
   `has_more` and cached the full city-scoped dataset as JSON.
2. Ran a weighted similarity match across that dataset to find duplicate listings from different
   source websites, grouped listings by `posted_by_contact` to find fake ones, checked every
   record against basic physical constraints (carpet area ≤ built-up area, floor ≤ total floors,
   positive price/area) to find corrupt ones, and cross-counted live listings per `project_id`
   against each project's reported `total_listings`.
3. Wrote the resulting counts/IDs straight into `submission.json`'s `answers`, and the same
   evidence IDs into `findings`.

The exact methodology behind each of those checks - and the specific numbers/requests that
falsified each documentation claim - is in the next two sections.

## How I worked out which parts of the documentation to distrust

The instructions warn that the doc was AI-generated from an old changelog and never checked
against the running service, so I treated every sentence in it as a claim to test, not a fact —
before writing any client code against a documented behavior, I hit the live API directly (via
small Node scripts, later via the app itself in a real browser) and compared the actual response
to what the doc said. Concretely:

- **Endpoints and shapes**: called every documented path with a real token before assuming it
  existed. `/v1/listing/{id}`, `/v1/listings/{id}/similar`, `/v1/favourites`, and
  `/v1/analytics/summary` all 404'd; I then probed plausible alternates (plural forms, synonym
  paths) until I found the real ones (`/v1/listings/{id}`, `/v1/saved`, no working analytics
  endpoint at all). Pagination shape (`page`/`page_size` vs. the real `offset`/`has_more`) was
  caught the same way — by printing the raw response before believing the doc's example JSON.
- **Auth lifetime**: the doc's "24h token, no refresh flow" is a strong, falsifiable claim. Logging
  in and reading `expires_in` from the real response (`900`, i.e. 15 minutes) took one request,
  and the login response itself contains a `refresh_url` the doc says doesn't exist. This directly
  explains why the assignment requires the app to "still be working thirty minutes after login" —
  it's testing whether you trusted that sentence.
- **Data-shaped hypotheses**: for anything that couldn't be caught by hitting one endpoint once
  (duplicates, fraud, corrupt records, unit mismatches), I pulled the entire city-scoped dataset
  (paging to completion via `has_more`, ~150 requests total, well under the rate limit) and ran it
  through targeted checks rather than reading records one at a time:
  - **Units**: `/v1/projects` documents `price_min`/`price_max` as integer rupees. Seeing
    `price_max: 98.9` for the single most expensive project in the city was the first tell (98.9
    rupees isn't a real estate price). I then compared `price_min` against `price_max` across all
    400 projects and found 184 where `price_min > price_max` — impossible for a range. It meant that
    prices were in crore.
  - **Duplicates**: the doc claims one `listing_id` = one physical property. I built a weighted
    similarity score (geo distance, project_id, fuzzy name/locality match, bed/bath/type, area,
    price, contact, description) across same-city listings from different source websites, and
    153 pairs cleared a conservative threshold.
  - **Fraud**: `posted_by_contact` is documented as "the seller's verified contact number" —
    grouping listings by phone number and checking whether all listings under a number share the
    same (normalized) seller name surfaced 230 listings where one "verified" number is claimed by
    multiple different people.
  - **Consistency**: `total_listings` on a project is documented to always match
    `GET /v1/listings?project_id=...`. Cross-counting live listings per `project_id` against the
    reported total found 106 of 400 projects disagree — and the filter that claim depends on
    (`project_id`) turns out to be silently ignored anyway, which I only found by testing it
    directly rather than assuming a documented-adjacent parameter works.
  - **Sorting**: `order` is documented as `asc` (default) or `desc`. Calling the same `sort_by` with
    both values back to back and diffing the results showed them byte-identical - across four
    different `sort_by` fields, not just one, to rule out a fluke.

## What I checked that turned out to be fine

- **Most documented filters actually work.** The assignment's own framing ("filters must actually
  filter, whether or not the server helps you") led me to assume server-side filtering was
  probably broken, and I built the frontend to always filter client-side against the full dataset
  regardless. But before writing that up as a finding, I tested `locality`, `bhk`, `min_price`/
  `max_price`, `furnishing`, and `property_type` directly against the API — all of them filter
  correctly. Only `order` (sort direction) and `project_id` are actually broken. I kept the
  client-side filtering in the app (it's still correct and is robust to either case), but I didn't
  report a `filters` finding for parameters that work.
- **`bhk` vs `bedroom`.** I initially assumed the filter param would match the response field name
  (`bedroom`), tested that first, and it's silently ignored — but that's my own wrong guess, not a
  documentation bug: the *documented* param name is `bhk`, and `bhk` works exactly as described.
  Worth noting because it would've been an easy false finding if I'd only tested my own assumption
  instead of what the doc actually says.
- **Rental and project detail paths.** Having found `/v1/listing/{id}` (singular) broken, I
  suspected `/v1/rentals/{id}` and `/v1/projects/{id}` might have the same singular/plural bug.
  Both work exactly as documented (plural base, no `/rental/` or `/project/` fallback needed).
- **Timestamps.** The doc's convention table claims ISO 8601 UTC with a `Z` suffix everywhere.
  Checked `posted_at` on listings/rentals and `launch_date`/`possession_date` on projects across
  the full dataset — all consistent with the documented format. (`/health`'s clock carries an
  explicit `+05:30` offset instead of `Z`, but that's the example finding given in the
  instructions, not something I'm claiming to have discovered.)
- **No cross-city contamination.** Given the key is supposed to be scoped to one city, I checked
  whether the dedup logic might be matching listings across different `city_id` values by mistake.
  Every retrievable record shares the same `city_id` — the scoping works as documented.



