"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ShieldCheck, Download, Filter, CheckCircle2, AlertOctagon } from "lucide-react";
import { formatUtcToIst } from "@/lib/time";

export default function AlertsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("evt_mock_01");
  const [selectedPointId, setSelectedPointId] = useState<string>("p1_kolkata");
  const [pointData, setPointData] = useState<any>(null);
  const [filterState, setFilterState] = useState<string>("all");

  useEffect(() => {
    fetch("/data-mock/events.json")
      .then((res) => res.json())
      .then((d) => {
        setEvents(d.events || []);
        if (d.events?.length) setSelectedEventId(d.events[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId || !selectedPointId) return;
    fetch(`/data-mock/events/${selectedEventId}/points/${selectedPointId}.json`)
      .then((res) => res.json())
      .then((d) => setPointData(d))
      .catch((e) => console.error(e));
  }, [selectedEventId, selectedPointId]);

  const currentEvent = events.find((e) => e.id === selectedEventId);

  // Extract all alert events from timeline
  const alertsList = (pointData?.timeline || [])
    .filter((step: any) => step.alert && step.alert.state !== "none")
    .map((step: any, idx: number) => ({
      id: `alert-${idx}`,
      issue_time: step.issue_time,
      state: step.alert.state,
      severity: step.alert.severity || "moderate",
      is_new: step.alert.is_new,
      reason: step.alert.reason,
      eta_window: step.eta_window_min,
      motion: step.motion,
    }))
    .reverse();

  const filteredAlerts = alertsList.filter((a: any) => {
    if (filterState === "all") return true;
    return a.state === filterState;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Alerts &amp; Bulletins</h1>
            <p className="text-xs text-slate-400">
              Official timeline broadcasts for {pointData?.point?.name || "Target Area"}
            </p>
          </div>
        </div>

        {/* CAP 1.2 Export Link */}
        <a
          href={`/api/cap?event=${selectedEventId}&point=${selectedPointId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CAP 1.2 XML</span>
        </a>
      </div>

      {/* Selectors and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Location:</span>
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-medium"
          >
            {currentEvent?.points?.map((pt: any) => (
              <option key={pt.id} value={pt.id}>
                📍 {pt.name}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter Buttons */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { key: "all", label: "All" },
            { key: "emergency", label: "Emergency" },
            { key: "alert", label: "Watch" },
            { key: "all_clear", label: "All-Clear" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterState(f.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                filterState === f.key
                  ? "bg-blue-600 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            No alerts active for the selected filter. Weather conditions clear.
          </div>
        ) : (
          filteredAlerts.map((item: any) => {
            const isEmergency = item.state === "emergency";
            const isAllClear = item.state === "all_clear";
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEmergency
                    ? "bg-rose-950/20 border-rose-900/50 shadow-lg shadow-rose-950/20"
                    : isAllClear
                    ? "bg-emerald-950/20 border-emerald-900/50"
                    : "bg-amber-950/20 border-amber-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {isEmergency ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : isAllClear ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs font-bold uppercase tracking-wider font-mono ${
                        isEmergency ? "text-rose-400" : isAllClear ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {item.state.replace("_", " ")}
                    </span>
                    {item.is_new && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatUtcToIst(item.issue_time)}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{item.reason}</p>

                {item.eta_window && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      Window: <strong className="text-white">{item.eta_window[0]}–{item.eta_window[1]} min</strong>
                    </span>
                    {item.motion && (
                      <span>
                        Heading: <strong className="text-amber-400">{item.motion.heading_deg}° ({item.motion.speed_kmh} km/h)</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
