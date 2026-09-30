"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Award,
  ShieldCheck,
  Compass,
  MapPin,
} from "lucide-react";
import { formatUtcToIst } from "@/lib/time";

const MapLibreView = dynamic(() => import("@/components/MapLibreView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] bg-[#F1F5F9] flex items-center justify-center text-slate-500 text-xs font-mono">
      Initializing Replay Engine...
    </div>
  ),
});

export default function ReplayPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("evt_mock_01");
  const [manifest, setManifest] = useState<any>(null);
  const [selectedPointId, setSelectedPointId] = useState<string>("p1_kolkata");
  const [pointData, setPointData] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [activeIssueIndex, setActiveIssueIndex] = useState<number>(0);
  const [selectedLead, setSelectedLead] = useState<string>("60");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"forecast" | "observed" | "split">("split");
  const [showResultsTable, setShowResultsTable] = useState<boolean>(false);

  // Load events & results
  useEffect(() => {
    fetch("/data-mock/events.json")
      .then((res) => res.json())
      .then((d) => {
        setEvents(d.events || []);
        if (d.events?.length) setSelectedEventId(d.events[0].id);
      })
      .catch((e) => console.error(e));

    fetch("/data-mock/results.json")
      .then((res) => res.json())
      .then((d) => setResultsData(d))
      .catch((e) => console.error(e));
  }, []);

  // Load manifest & point data
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/data-mock/events/${selectedEventId}/manifest.json`)
      .then((res) => res.json())
      .then((d) => {
        setManifest(d);
        setActiveIssueIndex(0);
      });

    fetch(`/data-mock/events/${selectedEventId}/points/${selectedPointId}.json`)
      .then((res) => res.json())
      .then((d) => setPointData(d))
      .catch(() => setPointData(null));
  }, [selectedEventId, selectedPointId]);

  const currentEvent = events.find((e) => e.id === selectedEventId);
  const issueTimes = manifest ? Object.keys(manifest.forecast || {}).sort() : [];
  const currentIssueTime = issueTimes[activeIssueIndex] || "";

  // Auto-play through issue times
  useEffect(() => {
    if (!isPlaying || issueTimes.length === 0) return;
    const timer = setInterval(() => {
      setActiveIssueIndex((prev) => (prev + 1) % issueTimes.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying, issueTimes.length]);

  // Compute URLs
  let fcImageUrl: string | null = null;
  let obsImageUrl: string | null = null;

  if (manifest && currentIssueTime) {
    const fcRel = manifest.forecast?.[currentIssueTime]?.[selectedLead]?.mean;
    if (fcRel) fcImageUrl = `/data-mock/events/${selectedEventId}/${fcRel}`;

    // Target valid time for this lead: valid = issue + lead - 30m
    const issueDate = new Date(currentIssueTime);
    const validDate = new Date(issueDate.getTime() + (Number(selectedLead) - 30) * 60000);
    const validIso = validDate.toISOString().replace(/\.\d{3}Z$/, "Z");
    const obsRel = manifest.obs?.[validIso];
    if (obsRel) obsImageUrl = `/data-mock/events/${selectedEventId}/${obsRel}`;
  }

  // Current timeline step for the selected point
  const currentTimelineEntry = pointData?.timeline?.find(
    (t: any) => t.issue_time === currentIssueTime
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
      {/* Header & Controls */}
      <div className="razor-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B63E5] animate-pulse" />
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
              Replay Theatre
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0B63E5] font-mono font-bold border border-[#BFDBFE]">
              GROUND TRUTH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare AI extrapolation nowcast against verified observed satellite precipitation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event Picker */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-semibold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>

          {/* Point Picker */}
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-semibold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white"
          >
            {currentEvent?.points?.map((pt: any) => (
              <option key={pt.id} value={pt.id}>
                📍 {pt.name}
              </option>
            ))}
          </select>

          {/* Results Toggle */}
          <button
            onClick={() => setShowResultsTable(!showResultsTable)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showResultsTable
                ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] shadow-sm"
                : "bg-white text-slate-700 border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Scorecard</span>
          </button>
        </div>
      </div>

      {/* "Alert Would Have Fired At" Banner */}
      {pointData?.summary && (
        <div
          className={`razor-card p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
            pointData.summary.outcome === "hit"
              ? "border-[#A7F3D0] bg-[#ECFDF5]"
              : pointData.summary.outcome === "correct_null"
              ? "border-[#BFDBFE] bg-[#EFF6FF]"
              : "border-[#E2E8F0] bg-white"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#A7F3D0] flex items-center justify-center text-[#059669] flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                {pointData.summary.outcome === "hit" && (
                  <span>
                    Alert would have fired at{" "}
                    <strong className="text-[#059669] underline underline-offset-4">
                      {formatUtcToIst(pointData.summary.alert_fired_at)}
                    </strong>
                    , exactly{" "}
                    <span className="font-extrabold text-[#059669] bg-white px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                      {pointData.summary.lead_time_min} min
                    </span>{" "}
                    before storm onset ({formatUtcToIst(pointData.summary.observed_onset_start)}).
                  </span>
                )}
                {pointData.summary.outcome === "correct_null" && (
                  <span>
                    Fair-weather control day: No false alarms fired. Correct null detection confirmed.
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Outcome:{" "}
                <span className="font-mono font-bold uppercase text-[#059669]">
                  {pointData.summary.outcome}
                </span>{" "}
                · Location: {pointData.point?.name}
              </p>
            </div>
          </div>
          <div className="text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-[#A7F3D0] text-[#0F172A] whitespace-nowrap self-start sm:self-auto font-medium shadow-sm">
            Point ID: {selectedPointId}
          </div>
        </div>
      )}

      {/* Model Benchmark Scorecard Table */}
      {showResultsTable && resultsData && (
        <div className="razor-card p-6 border-[#FDE68A] shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#B45309]" />
              <h2 className="text-sm font-bold text-[#0F172A]">Model Benchmark Scorecard</h2>
            </div>
            <span className="text-[11px] text-slate-600 font-mono bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              Threshold: {resultsData.event_thr_mm_h} mm/h
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">{resultsData.notes}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">Methodology</th>
                  <th className="py-2.5 px-3 font-semibold">POD (Hit Rate ↑)</th>
                  <th className="py-2.5 px-3 font-semibold">FAR (False Alarm ↓)</th>
                  <th className="py-2.5 px-3 font-semibold">CSI (Threat Score ↑)</th>
                  <th className="py-2.5 px-3 font-semibold">Brier Score ↓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-mono">
                {Object.entries(resultsData.by_method || {}).map(([method, metrics]: any) => (
                  <tr
                    key={method}
                    className={
                      method === "blend"
                        ? "bg-[#EFF6FF] text-[#0B63E5] font-bold"
                        : "text-slate-700"
                    }
                  >
                    <td className="py-3 px-3 capitalize flex items-center gap-2">
                      {method === "blend" && <span className="w-2 h-2 rounded-full bg-[#0B63E5]" />}
                      {method.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3">{(metrics.POD * 100).toFixed(0)}%</td>
                    <td className="py-3 px-3">{(metrics.FAR * 100).toFixed(0)}%</td>
                    <td className="py-3 px-3 font-bold text-[#0F172A]">{metrics.CSI.toFixed(2)}</td>
                    <td className="py-3 px-3">{metrics.brier.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-4 text-xs text-slate-600">
            <div>
              Alerts: <span className="text-[#059669] font-bold">{resultsData.alerts?.hit} Hits</span>{" "}
              · <span className="text-[#DC2626] font-bold">{resultsData.alerts?.miss} Misses</span> ·{" "}
              <span className="text-[#D97706] font-bold">{resultsData.alerts?.false_alarm} False Alarms</span>
            </div>
            <div>
              Median Lead Time:{" "}
              <span className="text-[#0F172A] font-bold">
                {resultsData.alerts?.median_lead_time_min} minutes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Scrubber Toolbar */}
      <div className="razor-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-[#0B63E5] hover:bg-[#0951bd] text-white font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span className="text-xs">{isPlaying ? "Pause" : "Play Sequence"}</span>
            </button>

            <button
              disabled={activeIssueIndex === 0}
              onClick={() => setActiveIssueIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] disabled:opacity-40 text-slate-700 border border-[#E2E8F0] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={activeIssueIndex === issueTimes.length - 1}
              onClick={() => setActiveIssueIndex((prev) => Math.min(issueTimes.length - 1, prev + 1))}
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] disabled:opacity-40 text-slate-700 border border-[#E2E8F0] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-xs">
              <span className="text-slate-500 font-medium">Issue Time:</span>{" "}
              <strong className="text-[#0B63E5] font-mono text-sm ml-1">
                {currentIssueTime ? formatUtcToIst(currentIssueTime, true) : "Loading..."}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Segmented Pill */}
            <div className="razor-pill-container flex text-xs">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  viewMode === "split"
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode("forecast")}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  viewMode === "forecast"
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Forecast
              </button>
              <button
                onClick={() => setViewMode("observed")}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  viewMode === "observed"
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ground Truth
              </button>
            </div>

            {/* Lead selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Lead:</span>
              <div className="razor-pill-container flex">
                {["30", "60", "90", "120", "180"].map((lead) => (
                  <button
                    key={lead}
                    onClick={() => setSelectedLead(lead)}
                    className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] transition-all ${
                      selectedLead === lead
                        ? "bg-[#0B63E5] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    +{lead}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Range Slider */}
        <div className="pt-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, issueTimes.length - 1)}
            value={activeIssueIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveIssueIndex(Number(e.target.value));
            }}
            className="w-full accent-[#0B63E5] cursor-pointer h-2 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
            <span>{issueTimes[0] ? formatUtcToIst(issueTimes[0]) : "Start"}</span>
            <span className="text-[#0B63E5] font-bold">
              Step {activeIssueIndex + 1} of {issueTimes.length}
            </span>
            <span>{issueTimes[issueTimes.length - 1] ? formatUtcToIst(issueTimes[issueTimes.length - 1]) : "End"}</span>
          </div>
        </div>
      </div>

      {/* Dual Screen Display Canvas */}
      <div className={`grid gap-5 ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Left: Forecast Frame */}
        {(viewMode === "split" || viewMode === "forecast") && (
          <div className="razor-card overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0B63E5] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0B63E5] animate-pulse" />
                AI Nowcast (Lead +{selectedLead} min)
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                Valid:{" "}
                {currentIssueTime
                  ? formatUtcToIst(
                      new Date(new Date(currentIssueTime).getTime() + (Number(selectedLead) - 30) * 60000).toISOString()
                    )
                  : ""}
              </span>
            </div>
            <div className="h-[420px] w-full">
              <MapLibreView
                bbox={currentEvent?.bbox}
                imageUrl={fcImageUrl}
                imageCoordinates={manifest?.image_coordinates}
                points={currentEvent?.points || []}
                selectedPointId={selectedPointId}
                onPointSelect={(id) => setSelectedPointId(id)}
                className="w-full h-full border-none rounded-none"
              />
            </div>
          </div>
        )}

        {/* Right: Observed Frame */}
        {(viewMode === "split" || viewMode === "observed") && (
          <div className="razor-card overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#059669] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Ground Truth (Observed IMERG Satellite)
              </span>
              <span className="font-mono text-slate-500 text-[11px]">NASA Satellite Rain</span>
            </div>
            <div className="h-[420px] w-full">
              <MapLibreView
                bbox={currentEvent?.bbox}
                imageUrl={obsImageUrl}
                imageCoordinates={manifest?.image_coordinates}
                points={currentEvent?.points || []}
                selectedPointId={selectedPointId}
                onPointSelect={(id) => setSelectedPointId(id)}
                className="w-full h-full border-none rounded-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Point Threat Details at this Issue Step */}
      {currentTimelineEntry && (
        <div className="razor-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0B63E5]" />
              <span>Situation at {pointData?.point?.name}:</span>
            </div>
            <p className="text-slate-600 mt-0.5">{currentTimelineEntry.alert?.reason}</p>
          </div>
          <div className="flex gap-4 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT RAIN</span>
              <span className="font-bold text-[#0F172A]">{currentTimelineEntry.rain_now_mm_h} mm/h</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MOTION BEARING</span>
              <span className="font-bold text-[#B45309] flex items-center gap-1">
                <Compass className="w-3 h-3" />
                {currentTimelineEntry.motion
                  ? `${currentTimelineEntry.motion.heading_deg}° (${currentTimelineEntry.motion.speed_kmh} km/h)`
                  : "Stationary"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ALERT STATUS</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase ${
                  currentTimelineEntry.alert?.state === "emergency"
                    ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    : currentTimelineEntry.alert?.state === "alert"
                    ? "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]"
                    : "bg-[#F1F5F9] text-slate-600 border border-[#E2E8F0]"
                }`}
              >
                {currentTimelineEntry.alert?.state}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
