"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Compass,
  Zap,
  Users,
  AlertTriangle,
  X,
  ExternalLink,
  Activity
} from "lucide-react";
import { formatUtcToIst, formatEta } from "@/lib/time";
import { formatMotionVector } from "@/lib/geo";
import { PERSONA_SAFETY_STEPS, PersonaType } from "@/lib/safety";
import { supabase, SIM_CHANNEL_NAME } from "@/lib/supabase";

export default function ThreatHomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("evt_mock_01");
  const [selectedPointId, setSelectedPointId] = useState<string>("p1_kolkata");
  const [pointDoc, setPointDoc] = useState<any>(null);
  const [persona, setPersona] = useState<PersonaType>("general");
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [timelineIndex, setTimelineIndex] = useState<number>(1); // e.g. approaching storm step
  const [emergencySimActive, setEmergencySimActive] = useState<boolean>(false);
  const [simEtaSeconds, setSimEtaSeconds] = useState<number>(75);

  // Load events
  useEffect(() => {
    fetch("/data-mock/events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        if (data.events?.length) setSelectedEventId(data.events[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  // Load point timeline
  useEffect(() => {
    if (!selectedEventId || !selectedPointId) return;
    fetch(`/data-mock/events/${selectedEventId}/points/${selectedPointId}.json`)
      .then((res) => res.json())
      .then((data) => {
        setPointDoc(data);
        if (data.timeline?.length > 1) {
          setTimelineIndex(1); // pick approaching step
        }
      })
      .catch((err) => console.error(err));
  }, [selectedEventId, selectedPointId]);

  // Realtime Supabase listener for live simulated storm (Phase C5)
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel(SIM_CHANNEL_NAME, {
      config: { broadcast: { self: true } },
    });

    channel.on("broadcast", { event: "sim_start" }, () => {
      setEmergencySimActive(true);
      setSimEtaSeconds(60);
    });

    channel.on("broadcast", { event: "sim_stop" }, () => {
      setEmergencySimActive(false);
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Emergency countdown timer
  useEffect(() => {
    if (!emergencySimActive) return;
    const interval = setInterval(() => {
      setSimEtaSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emergencySimActive]);

  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentStep = pointDoc?.timeline?.[timelineIndex] || pointDoc?.timeline?.[0];
  const maxLead = currentStep?.leads?.[0] || {
    lri: 74,
    severity: "strong",
    rain_p50: 16.4,
    rain_p10: 6.5,
    rain_p90: 29.5,
    valid_start: "",
  };

  const lri = maxLead.lri ?? 0;
  const severity = maxLead.severity ?? "moderate";

  // Severity color mapping
  const severityColors: Record<string, { bg: string; text: string; ring: string; border: string }> = {
    low: { bg: "bg-emerald-950/40", text: "text-emerald-400", ring: "stroke-emerald-400", border: "border-emerald-800/40" },
    moderate: { bg: "bg-yellow-950/40", text: "text-amber-400", ring: "stroke-amber-400", border: "border-amber-800/40" },
    strong: { bg: "bg-orange-950/40", text: "text-orange-400", ring: "stroke-orange-400", border: "border-orange-800/40" },
    severe: { bg: "bg-rose-950/40", text: "text-rose-400", ring: "stroke-rose-400", border: "border-rose-800/40" },
  };
  const activeStyle = severityColors[severity] || severityColors.moderate;

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (lri / 100) * circumference;

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Simulation Banner if triggered */}
      {emergencySimActive && (
        <div className="bg-rose-600 text-white p-3 rounded-xl flex items-center justify-between font-mono animate-bounce shadow-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-black/40 px-2 py-0.5 rounded font-bold">SIMULATION ACTIVE</span>
            <span>Arrival ETA: {simEtaSeconds}s</span>
          </div>
          <button
            onClick={() => setEmergencySimActive(false)}
            className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Location & Scenario Selectors */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Target Area:</span>
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-semibold"
          >
            {currentEvent?.points?.map((pt: any) => (
              <option key={pt.id} value={pt.id}>
                📍 {pt.name}
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-400 text-[11px]"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name.split(" ")[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Main Hyperlocal Threat Card */}
      <div className={`p-6 rounded-2xl border ${activeStyle.border} ${activeStyle.bg} backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300`}>
        {/* Top Badges */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${activeStyle.text}`}>
              {severity} Risk Level
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentStep ? formatUtcToIst(currentStep.issue_time) : "Updating..."}</span>
          </div>
        </div>

        {/* Threat Ring & Countdown Centerpiece */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* LRI Radial Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="45"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="45"
                className={`${activeStyle.ring} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{lri}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LRI Index</span>
            </div>
          </div>

          {/* Timing & Motion Details */}
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Estimated Threat Arrival
              </span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {currentStep ? formatEta(currentStep.eta_window_min) : "Calculating..."}
              </div>
            </div>

            {currentStep?.motion && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-300">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>
                  {formatMotionVector(currentStep.motion.heading_deg, currentStep.motion.speed_kmh)}
                </span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono">
              Confidence: <strong className="text-white uppercase">{currentStep?.confidence || "High"}</strong>
            </div>
          </div>
        </div>

        {/* Reasoning / Alert Callout */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 mt-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeStyle.text}`} />
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStep?.alert?.reason || "Monitoring regional convective atmosphere."}
            </p>
          </div>
        </div>

        {/* Why Button & Replay Link */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setShowWhyModal(true)}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Why this risk? (AI Breakdown)</span>
          </button>

          <Link
            href="/replay"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Replay storm sequence</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Persona Safety Guidance Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">Immediate Action Plan</h2>
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Tailored Safety</span>
        </div>

        {/* Persona Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(["general", "farmer", "commuter", "event"] as PersonaType[]).map((pKey) => (
            <button
              key={pKey}
              onClick={() => setPersona(pKey)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                persona === pKey
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {pKey === "general" ? "General" : pKey === "farmer" ? "🌾 Farmer" : pKey === "commuter" ? "🚗 Commuter" : "🎪 Event"}
            </button>
          ))}
        </div>

        {/* Safety Steps List */}
        <div className="space-y-2.5">
          {PERSONA_SAFETY_STEPS[persona]?.steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                step.urgent
                  ? "bg-rose-950/20 border-rose-900/40 text-slate-200"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                step.urgent ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {idx + 1}
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{step.title}</span>
                  {step.urgent && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Disclaimer (PRD_00 §3 & §8) */}
      <div className="text-center text-[11px] text-slate-500 font-mono">
        Prototype demonstration · Not an official IMD meteorological warning · SIH26072
      </div>

      {/* Why Bottom Sheet Modal (PRD_C §Phase C4 Task 2) */}
      {showWhyModal && currentStep?.explain && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Why This Threat Level? (Explainable AI)</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Atmospheric Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono">CAPE ENERGY</span>
                <span className="font-bold text-amber-400 text-sm font-mono">{currentStep.explain.cape} J/kg</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono">CIN BARRIER</span>
                <span className="font-bold text-slate-300 text-sm font-mono">{currentStep.explain.cin ?? 0} J/kg</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono">TEMPERATURE</span>
                <span className="font-bold text-slate-300 text-sm font-mono">{currentStep.explain.t2m_c}°C</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono">SURFACE RH</span>
                <span className="font-bold text-slate-300 text-sm font-mono">{currentStep.explain.rh_pct}%</span>
              </div>
            </div>

            {/* Rain Percentiles */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Precipitation Spread (Ensemble):</span>
              <div className="flex justify-between font-mono text-[11px] text-slate-300">
                <span>P10: <strong className="text-blue-400">{maxLead.rain_p10} mm/h</strong></span>
                <span>P50: <strong className="text-white">{maxLead.rain_p50} mm/h</strong></span>
                <span>P90: <strong className="text-rose-400">{maxLead.rain_p90} mm/h</strong></span>
              </div>
            </div>

            {/* Top SHAP / Model Contributions */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Key Drivers (Feature Attribution):</span>
              <div className="space-y-2">
                {currentStep.explain.top_features?.map((feat: any, idx: number) => {
                  const contribPct = Math.round(Math.abs(feat.contribution) * 100);
                  const isPositive = feat.contribution >= 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{feat.label_en}</span>
                        <span className={`font-mono font-bold ${isPositive ? "text-emerald-400" : "text-slate-400"}`}>
                          {isPositive ? `+${contribPct}% risk` : `-${contribPct}% suppressing`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? "bg-blue-500" : "bg-slate-600"}`}
                          style={{ width: `${Math.min(100, contribPct * 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowWhyModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Close AI Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
