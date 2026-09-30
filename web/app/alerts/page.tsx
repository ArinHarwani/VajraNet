"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-5">
      {/* Header Banner */}
      <div className="razor-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0B63E5] flex-shrink-0 shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
                Alerts &amp; Public Bulletins
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0B63E5] border border-[#BFDBFE]">
                CAP 1.2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official timeline broadcasts for {pointData?.point?.name || "Target Coordinates"}
            </p>
          </div>
        </div>

        {/* CAP 1.2 Export Link */}
        <a
          href={`/api/cap?event=${selectedEventId}&point=${selectedPointId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-[#0B63E5]" />
          <span>Export CAP 1.2 XML</span>
        </a>
      </div>

      {/* Selectors and Filter Segmented Controls */}
      <div className="razor-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0B63E5] flex-shrink-0" />
          <span className="text-xs text-slate-500 font-semibold">Location:</span>
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-semibold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white"
          >
            {currentEvent?.points?.map((pt: any) => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter Buttons */}
        <div className="razor-pill-container flex gap-1">
          {[
            { key: "all", label: "All" },
            { key: "emergency", label: "Emergency" },
            { key: "alert", label: "Watch" },
            { key: "all_clear", label: "All-Clear" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterState(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterState === f.key
                  ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                  : "text-slate-600 hover:text-slate-900"
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
          <div className="razor-card p-10 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2 opacity-80" />
            No alerts active for the selected filter. Convective conditions normal.
          </div>
        ) : (
          filteredAlerts.map((item: any) => {
            const isEmergency = item.state === "emergency";
            const isAllClear = item.state === "all_clear";
            return (
              <div
                key={item.id}
                className={`razor-card p-5 border transition-all duration-200 hover:-translate-y-0.5 ${
                  isEmergency
                    ? "bg-white border-[#FECACA] shadow-sm shadow-red-500/5"
                    : isAllClear
                    ? "bg-white border-[#A7F3D0] shadow-sm shadow-emerald-500/5"
                    : "bg-white border-[#FDE68A] shadow-sm shadow-amber-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    {isEmergency ? (
                      <AlertOctagon className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                    ) : isAllClear ? (
                      <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider font-mono ${
                        isEmergency
                          ? "text-[#DC2626]"
                          : isAllClear
                          ? "text-[#059669]"
                          : "text-[#D97706]"
                      }`}
                    >
                      {item.state.replace("_", " ")}
                    </span>
                    {item.is_new && (
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0B63E5] font-mono font-bold border border-[#BFDBFE]">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatUtcToIst(item.issue_time)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">{item.reason}</p>

                {item.eta_window && (
                  <div className="mt-3.5 pt-3 border-t border-[#F1F5F9] flex flex-wrap justify-between gap-2 text-[11px] font-mono text-slate-500">
                    <span>
                      Window:{" "}
                      <strong className="text-[#0F172A] font-bold">
                        {item.eta_window[0]}–{item.eta_window[1]} min
                      </strong>
                    </span>
                    {item.motion && (
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>
                          Heading:{" "}
                          <strong className="text-slate-800 font-semibold">
                            {item.motion.heading_deg}° ({item.motion.speed_kmh} km/h)
                          </strong>
                        </span>
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
