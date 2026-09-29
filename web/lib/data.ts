// lib/data.ts - VajraNet Data Access Layer
// Consumes data from ${NEXT_PUBLIC_DATA_BASE}/... (defaults to /data-mock)

export interface ReferenceMeta {
  label: string;
  url: string;
  verified: boolean;
}

export interface PointMeta {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface GridMeta {
  res_deg: number;
  nx: number;
  ny: number;
}

export interface EventMeta {
  id: string;
  name: string;
  is_no_storm: boolean;
  bbox: [number, number, number, number]; // [w, s, e, n]
  grid: GridMeta;
  first_issue: string;
  last_issue: string;
  issue_step_min: number;
  leads_min: number[];
  event_thr_mm_h: number;
  reference: ReferenceMeta;
  points: PointMeta[];
}

export interface EventsDoc {
  contract_version: string;
  mock: boolean;
  events: EventMeta[];
}

export interface ManifestForecastLead {
  mean: string;
  prob: string;
}

export interface ManifestDoc {
  contract_version: string;
  event_id: string;
  image_coordinates: [[number, number], [number, number], [number, number], [number, number]];
  image_projection: string;
  colormap: string;
  obs: Record<string, string>; // ISO-Z -> rel path
  forecast: Record<string, Record<string, ManifestForecastLead>>; // issue_time -> lead_min -> files
}

export interface ColorStop {
  value: number;
  color: string;
}

export interface ColormapDoc {
  contract_version: string;
  unit: string;
  rain_stops: ColorStop[];
  prob_stops: ColorStop[];
}

export interface LeadForecast {
  lead_min: number;
  valid_start: string;
  p_ens: number;
  p_ml: number;
  p_final: number;
  rain_p10: number;
  rain_p50: number;
  rain_p90: number;
  lri: number;
  severity: "low" | "moderate" | "strong" | "severe";
}

export interface MotionMeta {
  heading_deg: number;
  from_deg: number;
  speed_kmh: number;
}

export interface AlertState {
  state: "none" | "alert" | "emergency" | "all_clear";
  severity: string | null;
  is_new: boolean;
  reason: string;
}

export interface FeatureContribution {
  name: string;
  label_en: string;
  contribution: number;
}

export interface ExplainMeta {
  cape: number;
  cin: number | null;
  t2m_c: number;
  rh_pct: number;
  top_features: FeatureContribution[];
}

export interface TimelineEntry {
  issue_time: string;
  rain_now_mm_h: number;
  leads: LeadForecast[];
  eta_window_min: [number, number] | null;
  motion: MotionMeta | null;
  confidence: "high" | "medium" | "low" | null;
  alert: AlertState;
  explain: ExplainMeta;
}

export interface PointSummary {
  observed_onset_start: string | null;
  alert_fired_at: string | null;
  lead_time_min: number | null;
  outcome: "hit" | "miss" | "false_alarm" | "correct_null" | "ongoing_at_start";
}

export interface PointTimelineDoc {
  contract_version: string;
  event_id: string;
  point: PointMeta;
  summary: PointSummary;
  timeline: TimelineEntry[];
}

export interface MethodMetrics {
  POD: number;
  FAR: number;
  CSI: number;
  brier: number;
}

export interface ResultsDoc {
  contract_version: string;
  n_events: number;
  n_points: number;
  event_thr_mm_h: number;
  notes: string;
  by_method: Record<string, MethodMetrics>;
  by_lead: Record<string, Record<string, MethodMetrics>>;
  alerts: {
    hit: number;
    miss: number;
    false_alarm: number;
    correct_null: number;
    median_lead_time_min: number;
  };
  per_event: Array<{
    id: string;
    hit: number;
    miss: number;
    false_alarm: number;
    median_lead_time_min: number;
  }>;
  blend_weight_ens: number;
}

export interface SimScenario {
  id: string;
  label: string;
  start_distance_km: number;
  bearing_from_deg: number;
  speed_kmh: number;
  cross_track_km: number;
  radius_km: number;
  peak_lri: number;
  watch_eta_min: number;
  emergency_eta_min: number;
}

export interface SimScenariosDoc {
  contract_version: string;
  scenarios: SimScenario[];
}

export const DATA_BASE = process.env.NEXT_PUBLIC_DATA_BASE || "/data-mock";

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${DATA_BASE}/${path.replace(/^\/+/, "")}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (status ${res.status}): ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getEvents(): Promise<EventsDoc> {
  return fetchJson<EventsDoc>("events.json");
}

export async function getColormap(): Promise<ColormapDoc> {
  return fetchJson<ColormapDoc>("colormap.json");
}

export async function getResults(): Promise<ResultsDoc> {
  return fetchJson<ResultsDoc>("results.json");
}

export async function getSimScenarios(): Promise<SimScenariosDoc> {
  return fetchJson<SimScenariosDoc>("sim_scenarios.json");
}

export async function getEventManifest(eventId: string): Promise<ManifestDoc> {
  return fetchJson<ManifestDoc>(`events/${eventId}/manifest.json`);
}

export async function getPointTimeline(eventId: string, pointId: string): Promise<PointTimelineDoc> {
  return fetchJson<PointTimelineDoc>(`events/${eventId}/points/${pointId}.json`);
}

export function getFrameUrl(eventId: string, relPath: string): string {
  return `${DATA_BASE}/events/${eventId}/${relPath.replace(/^\/+/, "")}`;
}
