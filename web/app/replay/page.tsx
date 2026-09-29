"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, Pause, ChevronLeft, ChevronRight, Award, Info, AlertCircle, ShieldCheck } from "lucide-react";
import { formatUtcToIst } from "@/lib/time";

const MapLibreView = dynamic(() => import("@/components/MapLibreView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
      Loading Replay Canvas...
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">Replay Theatre</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">P0-1</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare AI extrapolation nowcast against verified observed satellite precipitation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event Picker */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
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
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showResultsTable
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Scorecard</span>
          </button>
        </div>
      </div>

      {/* Mandatory "Alert Would Have Fired At" Banner (PRD_C §Phase C3 Task 2) */}
      {pointData?.summary && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
            pointData.summary.outcome === "hit"
              ? "bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-800/40 text-emerald-200"
              : pointData.summary.outcome === "correct_null"
              ? "bg-gradient-to-r from-blue-950/60 to-slate-900 border-blue-800/40 text-blue-200"
              : "bg-slate-900 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {pointData.summary.outcome === "hit" && (
                  <span>
                    Alert would have fired at{" "}
                    <strong className="text-emerald-300 underline underline-offset-2">
                      {formatUtcToIst(pointData.summary.alert_fired_at)}
                    </strong>
                    , exactly{" "}
                    <span className="font-bold text-white bg-emerald-500/20 px-1.5 py-0.5 rounded">
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
              <p className="text-xs text-slate-400 mt-0.5">
                Outcome: <span className="font-mono font-semibold uppercase">{pointData.summary.outcome}</span> · Location: {pointData.point?.name}
              </p>
            </div>
          </div>
          <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 whitespace-nowrap">
            Point ID: {selectedPointId}
          </div>
        </div>
      )}

      {/* Model Performance Scorecard Modal / Table */}
      {showResultsTable && resultsData && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100">Model Benchmark Scorecard (results.json)</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Threshold: {resultsData.event_thr_mm_h} mm/h
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 italic">{resultsData.notes}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-semibold">Methodology</th>
                  <th className="py-2 px-3 font-semibold">POD (Hit Rate ↑)</th>
                  <th className="py-2 px-3 font-semibold">FAR (False Alarm ↓)</th>
                  <th className="py-2 px-3 font-semibold">CSI (Threat Score ↑)</th>
                  <th className="py-2 px-3 font-semibold">Brier Score ↓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Object.entries(resultsData.by_method || {}).map(([method, metrics]: any) => (
                  <tr
                    key={method}
                    className={method === "blend" ? "bg-blue-950/40 text-blue-300 font-bold" : "text-slate-300"}
                  >
                    <td className="py-2.5 px-3 capitalize flex items-center gap-2">
                      {method === "blend" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {method.replace("_", " ")}
                    </td>
                    <td className="py-2.5 px-3">{(metrics.POD * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3">{(metrics.FAR * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{metrics.CSI.toFixed(2)}</td>
                    <td className="py-2.5 px-3">{metrics.brier.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-400">
            <div>
              Alerts: <span className="text-emerald-400 font-bold">{resultsData.alerts?.hit} Hits</span> ·{" "}
              <span className="text-rose-400 font-bold">{resultsData.alerts?.miss} Misses</span> ·{" "}
              <span className="text-amber-400 font-bold">{resultsData.alerts?.false_alarm} False Alarms</span>
            </div>
            <div>
              Median Lead Time: <span className="text-white font-bold">{resultsData.alerts?.median_lead_time_min} minutes</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Scrubber Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span className="text-xs font-semibold">{isPlaying ? "Pause" : "Play Sequence"}</span>
            </button>

            <button
              disabled={activeIssueIndex === 0}
              onClick={() => setActiveIssueIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={activeIssueIndex === issueTimes.length - 1}
              onClick={() => setActiveIssueIndex((prev) => Math.min(issueTimes.length - 1, prev + 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-xs">
              <span className="text-slate-400">Issue Time (T):</span>{" "}
              <strong className="text-blue-400 font-mono text-sm ml-1">
                {currentIssueTime ? formatUtcToIst(currentIssueTime, true) : "Loading..."}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1 rounded font-medium ${
                  viewMode === "split" ? "bg-slate-800 text-white shadow" : "text-slate-400"
                }`}
              >
                Side-by-Side Split
              </button>
              <button
                onClick={() => setViewMode("forecast")}
                className={`px-3 py-1 rounded font-medium ${
                  viewMode === "forecast" ? "bg-slate-800 text-white shadow" : "text-slate-400"
                }`}
              >
                Forecast Only
              </button>
              <button
                onClick={() => setViewMode("observed")}
                className={`px-3 py-1 rounded font-medium ${
                  viewMode === "observed" ? "bg-slate-800 text-white shadow" : "text-slate-400"
                }`}
              >
                Ground Truth
              </button>
            </div>

            {/* Lead selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Lead:</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {["30", "60", "90", "120", "180"].map((lead) => (
                  <button
                    key={lead}
                    onClick={() => setSelectedLead(lead)}
                    className={`px-2 py-0.5 rounded font-mono ${
                      selectedLead === lead ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
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
        <div>
          <input
            type="range"
            min={0}
            max={Math.max(0, issueTimes.length - 1)}
            value={activeIssueIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveIssueIndex(Number(e.target.value));
            }}
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>{issueTimes[0] ? formatUtcToIst(issueTimes[0]) : "Start"}</span>
            <span className="text-blue-400 font-bold">
              Step {activeIssueIndex + 1} of {issueTimes.length}
            </span>
            <span>{issueTimes[issueTimes.length - 1] ? formatUtcToIst(issueTimes[issueTimes.length - 1]) : "End"}</span>
          </div>
        </div>
      </div>

      {/* Dual Screen Display Canvas */}
      <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Left / Main: Forecast Frame */}
        {(viewMode === "split" || viewMode === "forecast") && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                AI Nowcast (Lead +{selectedLead} min)
              </span>
              <span className="font-mono text-slate-400">
                Valid: {currentIssueTime ? formatUtcToIst(new Date(new Date(currentIssueTime).getTime() + (Number(selectedLead) - 30) * 60000).toISOString()) : ""}
              </span>
            </div>
            <div className="h-[400px] w-full">
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

        {/* Right / Secondary: Observed Frame */}
        {(viewMode === "split" || viewMode === "observed") && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ground Truth Verification (Observed IMERG)
              </span>
              <span className="font-mono text-slate-400">Satellite Rain</span>
            </div>
            <div className="h-[400px] w-full">
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-slate-200">Point Situation ({pointData.point?.name}):</div>
            <p className="text-slate-400 mt-0.5">{currentTimelineEntry.alert?.reason}</p>
          </div>
          <div className="flex gap-4 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT RAIN</span>
              <span className="font-bold text-slate-200">{currentTimelineEntry.rain_now_mm_h} mm/h</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MOTION BEARING</span>
              <span className="font-bold text-amber-400">
                {currentTimelineEntry.motion ? `${currentTimelineEntry.motion.heading_deg}° (${currentTimelineEntry.motion.speed_kmh} km/h)` : "Stationary"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ALERT STATUS</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                  currentTimelineEntry.alert?.state === "emergency"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : currentTimelineEntry.alert?.state === "alert"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400"
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
