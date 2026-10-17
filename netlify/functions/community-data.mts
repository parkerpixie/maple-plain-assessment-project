import { getStore } from "@netlify/blobs";

const validNumbers = (values: Array<number | null | undefined>) => values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default async (req: Request) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });

  const store = getStore({ name: "assessment-community-data", consistency: "strong" });
  const listing = await store.list({ prefix: "submissions/" });
  const records: any[] = [];

  for (const blob of listing.blobs) {
    const record = await store.get(blob.key, { type: "json", consistency: "strong" });
    if (record && typeof record === "object") records.push(record);
  }

  const totalChanges = validNumbers(records.map(r => r.total_percent_change));
  const landChanges = validNumbers(records.map(r => r.land_percent_change));
  const lakefrontChanges = validNumbers(records.filter(r => normalize(r.lakefront) === "yes").map(r => r.total_percent_change));
  const nonLakefrontChanges = validNumbers(records.filter(r => normalize(r.lakefront) === "no").map(r => r.total_percent_change));
  const contacted = records.filter(r => normalize(r.contact_assessor) === "yes");
  const noResponse = contacted.filter(r => normalize(r.response_received) === "no" || normalize(r.response_received) === "pending");
  const attending = records.filter(r => normalize(r.open_book_plan) === "yes");
  const seasonal = records.filter(r => normalize(r.year_round).includes("seasonal") || normalize(r.property_type).includes("seasonal"));

  const propertyTypeCounts = records.reduce((acc: Record<string, number>, record) => {
    const key = String(record.property_type || "Other / not specified").trim() || "Other / not specified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const lakeCounts = records.reduce((acc: Record<string, number>, record) => {
    const key = String(record.lake_name || "").trim();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const minimumGroup = 3;
  const body = {
    updated_at: new Date().toISOString(),
    submissions: records.length,
    average_total_percent_change: average(totalChanges),
    median_total_percent_change: median(totalChanges),
    median_land_percent_change: median(landChanges),
    properties_over_100_percent: totalChanges.filter(value => value >= 100).length,
    lakefront: {
      count: lakefrontChanges.length,
      median_percent_change: lakefrontChanges.length >= minimumGroup ? median(lakefrontChanges) : null
    },
    non_lakefront: {
      count: nonLakefrontChanges.length,
      median_percent_change: nonLakefrontChanges.length >= minimumGroup ? median(nonLakefrontChanges) : null
    },
    assessor_contact: {
      contacted: contacted.length,
      reported_no_response_or_pending: noResponse.length
    },
    planning_open_book: attending.length,
    seasonal_properties: seasonal.length,
    property_types: propertyTypeCounts,
    lakes: Object.fromEntries(Object.entries(lakeCounts).filter(([, count]) => count >= minimumGroup)),
    privacy_note: "Subgroup medians are shown only when at least three submissions are available. Free-text comments and identifying information are never returned by this endpoint."
  };

  return Response.json(body, {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60"
    }
  });
};
