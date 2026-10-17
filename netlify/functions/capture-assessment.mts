import { getStore } from "@netlify/blobs";

const text = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown) => {
  const parsed = Number(text(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export default {
  async formSubmitted(event: { data?: Record<string, unknown> }) {
    const data = event.data ?? {};
    if (!("previous_total" in data) || !("new_total" in data)) return;
    if (text(data.aggregate_consent).toLowerCase() !== "yes") return;

    const oldTotal = number(data.previous_total);
    const newTotal = number(data.new_total);
    const oldLand = number(data.previous_land);
    const newLand = number(data.new_land);
    const oldImprovements = number(data.previous_improvements);
    const newImprovements = number(data.new_improvements);

    const totalPercent = oldTotal && newTotal !== null
      ? ((newTotal - oldTotal) / oldTotal) * 100
      : null;
    const landPercent = oldLand && newLand !== null
      ? ((newLand - oldLand) / oldLand) * 100
      : null;
    const improvementPercent = oldImprovements && newImprovements !== null
      ? ((newImprovements - oldImprovements) / oldImprovements) * 100
      : null;

    const safeRecord = {
      submitted_at: new Date().toISOString(),
      previous_total: oldTotal,
      new_total: newTotal,
      total_percent_change: totalPercent,
      previous_land: oldLand,
      new_land: newLand,
      land_percent_change: landPercent,
      previous_improvements: oldImprovements,
      new_improvements: newImprovements,
      improvement_percent_change: improvementPercent,
      property_type: text(data.property_type),
      lakefront: text(data.lakefront),
      lake_name: text(data.lake_name),
      acreage: number(data.acreage),
      frontage: number(data.frontage),
      building_sqft: number(data.building_sqft),
      running_water: text(data.running_water),
      septic: text(data.septic),
      year_round: text(data.year_round),
      recent_sale: text(data.recent_sale),
      contact_assessor: text(data.contact_assessor),
      contact_method: text(data.contact_method),
      response_received: text(data.response_received),
      open_book_plan: text(data.open_book_plan)
    };

    const store = getStore({ name: "assessment-community-data", consistency: "strong" });
    const key = `submissions/${Date.now()}-${crypto.randomUUID()}`;
    await store.setJSON(key, safeRecord);
  }
};
