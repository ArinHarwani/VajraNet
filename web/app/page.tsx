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
  MapPin,
  Wind,
  Sparkles,
  AlertTriangle,
  X,
  Activity,
  Home,
  ZapOff,
  Building2,
  Timer,
  Tractor,
  Car,
  Bike,
  Megaphone,
  Radio,
  ShieldCheck,
  TrendingUp,
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
  const [timelineIndex, setTimelineIndex] = useState<number>(1);
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
          setTimelineIndex(1);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedEventId, selectedPointId]);

  // Realtime Supabase listener for live simulated storm
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
    lri: 85.3,
    severity: "severe",
    rain_p50: 24.2,
    rain_p10: 12.0,
    rain_p90: 42.5,
    valid_start: "",
  };

  const lri = Number(maxLead.lri ?? 85.3).toFixed(1);
  const severity = maxLead.severity ?? "severe";

  // Semantic Tinting Configurations per Severity
  const severityConfig: Record<
    string,
    {
      label: string;
      heroClass: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      gradientId: string;
      stop1: string;
      stop2: string;
      dotColor: string;
      bannerBg: string;
      bannerBorder: string;
      bannerText: string;
      bannerIcon: string;
    }
  > = {
    severe: {
      label: "Severe Risk Level",
      heroClass: "hero-accent-severe",
      badgeBg: "bg-[#FEF2F2]",
      badgeText: "text-[#DC2626]",
      badgeBorder: "border-[#FECACA]",
      gradientId: "severeGradLight",
      stop1: "#EF4444",
      stop2: "#F43F5E",
      dotColor: "#EF4444",
      bannerBg: "bg-[#FFF1F2]",
      bannerBorder: "border-[#FDA4AF]",
      bannerText: "text-[#9F1239]",
      bannerIcon: "text-[#DC2626] bg-[#FFE4E6] border-[#FECDD3]",
    },
    strong: {
      label: "Strong Risk Level",
      heroClass: "hero-accent-strong",
      badgeBg: "bg-[#FFF7ED]",
      badgeText: "text-[#C2410C]",
      badgeBorder: "border-[#FFEDD5]",
      gradientId: "strongGradLight",
      stop1: "#F97316",
      stop2: "#F59E0B",
      dotColor: "#F97316",
      bannerBg: "bg-[#FFF7ED]",
      bannerBorder: "border-[#FDBA74]",
      bannerText: "text-[#9A3412]",
      bannerIcon: "text-[#EA580C] bg-[#FFEDD5] border-[#FED7AA]",
    },
    moderate: {
      label: "Moderate Risk Level",
      heroClass: "hero-accent-moderate",
      badgeBg: "bg-[#FFFBEB]",
      badgeText: "text-[#B45309]",
      badgeBorder: "border-[#FDE68A]",
      gradientId: "moderateGradLight",
      stop1: "#F59E0B",
      stop2: "#0284C7",
      dotColor: "#F59E0B",
      bannerBg: "bg-[#FFFBEB]",
      bannerBorder: "border-[#FDE68A]",
      bannerText: "text-[#92400E]",
      bannerIcon: "text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]",
    },
    low: {
      label: "Low Risk Level",
      heroClass: "hero-accent-low",
      badgeBg: "bg-[#ECFDF5]",
      badgeText: "text-[#059669]",
      badgeBorder: "border-[#A7F3D0]",
      gradientId: "lowGradLight",
      stop1: "#10B981",
      stop2: "#06B6D4",
      dotColor: "#10B981",
      bannerBg: "bg-[#ECFDF5]",
      bannerBorder: "border-[#A7F3D0]",
      bannerText: "text-[#065F46]",
      bannerIcon: "text-[#059669] bg-[#D1FAE5] border-[#A7F3D0]",
    },
  };

  const activeConf = severityConfig[severity] || severityConfig.severe;

  // LRI Radial Gauge
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, Number(lri))) / 100) * circumference;

  // Context-aware Lucide icons
  const getActionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("indoor") || t.includes("shelter")) return Home;
    if (t.includes("electric") || t.includes("power") || t.includes("pump")) return ZapOff;
    if (t.includes("window") || t.includes("building")) return Building2;
    if (t.includes("30-30") || t.includes("buffer") || t.includes("wait")) return Timer;
    if (t.includes("field") || t.includes("farm") || t.includes("tool")) return Tractor;
    if (t.includes("car") || t.includes("vehicle")) return Car;
    if (t.includes("wheel") || t.includes("bike")) return Bike;
    if (t.includes("halt") || t.includes("evacuat")) return Megaphone;
    if (t.includes("address") || t.includes("broadcast")) return Radio;
    return ShieldCheck;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
      {/* Simulation Banner (High Priority Red/Coral Alert) */}
      {emergencySimActive && (
        <div className="rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#F43F5E] p-4 text-white shadow-lg shadow-red-500/20 border border-red-400/40 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-black/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SIMULATION DEMO
                  </span>
                  <span className="font-bold text-sm">Emergency Squall Imminent</span>
                </div>
                <p className="text-xs text-white/90 mt-0.5">
                  Simulated thunderstorm cell arriving in{" "}
                  <strong className="font-mono text-amber-200">{simEtaSeconds}s</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmergencySimActive(false)}
              className="text-xs bg-black/25 hover:bg-black/40 px-3 py-1.5 rounded-xl font-semibold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Control Panel & Location Selector Bar */}
      <div className="razor-card p-4 sm:p-4.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        {/* Location Dropdown */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0 text-[#0B63E5]">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">
              Target Area Coordinates
            </label>
            <select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-semibold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white"
            >
              {currentEvent?.points?.map((pt: any) => (
                <option key={pt.id} value={pt.id}>
                  📍 {pt.name} ({pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Storm Scenario Dropdown & Quick Live Timestamp */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:max-w-xs">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Threat & Risk Display Card (Top Hero Card with Semantic Tinting) */}
      <div className={`razor-card-hero p-6 sm:p-8 ${activeConf.heroClass}`}>
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E2E8F0]/80">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: activeConf.dotColor }}
              ></span>
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: activeConf.dotColor }}
              ></span>
            </span>
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${activeConf.badgeBg} ${activeConf.badgeText} ${activeConf.badgeBorder}`}
            >
              {activeConf.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-white/90 px-3 py-1 rounded-full border border-[#E2E8F0] shadow-sm">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentStep ? formatUtcToIst(currentStep.issue_time) : "Updating..."}</span>
          </div>
        </div>

        {/* Centerpiece: LRI Circular Meter & Threat Details */}
        <div className="py-7 flex flex-col md:flex-row items-center justify-around gap-8">
          {/* LRI Circular Meter */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id={activeConf.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={activeConf.stop1} />
                    <stop offset="100%" stopColor={activeConf.stop2} />
                  </linearGradient>
                </defs>

                {/* Light Track */}
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  className="stroke-[#F1F5F9]"
                  strokeWidth="11"
                  fill="transparent"
                />

                {/* Progress Arc */}
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke={`url(#${activeConf.gradientId})`}
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out drop-shadow-sm"
                />
              </svg>

              {/* Centered LRI Score */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-[#0F172A] tracking-tight">
                  {lri}
                </span>
                <span className="text-[10px] font-bold text-[#0B63E5] uppercase tracking-widest mt-0.5">
                  LRI INDEX
                </span>
                <span className="text-[9px] text-slate-400 font-mono">0–100 Scale</span>
              </div>
            </div>
          </div>

          {/* Meteorological Metrics Breakdown */}
          <div className="space-y-4 text-center md:text-left flex-1 max-w-sm">
            {/* Arrival Timing */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center justify-center md:justify-start gap-1.5">
                <Timer className="w-3.5 h-3.5 text-[#0B63E5]" />
                <span>Estimated Threat Arrival</span>
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono mt-1 tracking-tight">
                {currentStep ? formatEta(currentStep.eta_window_min) : "Calculating..."}
              </div>
              <div className="text-xs text-[#DC2626] font-semibold mt-0.5 flex items-center justify-center md:justify-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping"></span>
                <span>Imminent Squall Line Ahead</span>
              </div>
            </div>

            {/* Inner Metric Box ("Approaching from WSW...") */}
            {currentStep?.motion && (
              <div className="inline-flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 rounded-xl text-xs text-slate-700 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#D97706]" />
                  <span className="font-semibold text-[#0F172A]">
                    {formatMotionVector(currentStep.motion.heading_deg, currentStep.motion.speed_kmh)}
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-[#0B63E5]" />
                  <span className="font-mono font-bold text-[#0B63E5]">{currentStep.motion.speed_kmh} km/h</span>
                </div>
              </div>
            )}

            {/* Model Confidence Badge */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-mono text-slate-500">Certainty:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-bold font-mono">
                <Sparkles className="w-3 h-3 text-[#10B981]" />
                HIGH Confidence (20/20 Ensemble)
              </span>
            </div>
          </div>
        </div>

        {/* Banner Message Box ("Severe storm underway...") with Semantic Light-Red Tint */}
        <div className={`${activeConf.bannerBg} border ${activeConf.bannerBorder} rounded-xl p-3.5 mt-2`}>
          <div className="flex items-start gap-3">
            <div className={`p-1 rounded-lg border flex-shrink-0 mt-0.5 ${activeConf.bannerIcon}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className={`text-xs ${activeConf.bannerText} leading-relaxed font-medium`}>
              {currentStep?.alert?.reason ||
                "Severe storm underway: Rapidly intensifying convective cells detected moving along the Gangetic corridor with high CAPE energy."}
            </p>
          </div>
        </div>

        {/* Action Links & Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-[#E2E8F0]/80">
          <button
            onClick={() => setShowWhyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-[#1D4ED8]" />
            <span>Why this risk? (AI Breakdown)</span>
          </button>

          <Link
            href="/replay"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#334155] text-[#0F172A] text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <span>Replay storm sequence</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#0F172A]" />
          </Link>
        </div>
      </div>

      {/* Safety & Action Plan Module */}
      <div className="razor-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                Immediate Action Plan
              </h2>
              <p className="text-[11px] text-slate-500">
                Targeted safety steps for your specific environment
              </p>
            </div>
          </div>
          <span className="text-[10px] text-[#0B63E5] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] self-start sm:self-auto">
            Tailored Protocols
          </span>
        </div>

        {/* Persona Tabs (Segmented Light Gray Pill Bar with 2px Blue Active Border) */}
        <div className="razor-pill-container grid grid-cols-2 sm:grid-cols-4 gap-1">
          {(["general", "farmer", "commuter", "event"] as PersonaType[]).map((pKey) => {
            const isSelected = persona === pKey;
            return (
              <button
                key={pKey}
                onClick={() => setPersona(pKey)}
                className={`py-2 px-3 text-xs capitalize transition-all duration-200 ${
                  isSelected ? "persona-tab-active" : "persona-tab-inactive"
                }`}
              >
                {pKey === "general"
                  ? "General"
                  : pKey === "farmer"
                  ? "🌾 Farmer"
                  : pKey === "commuter"
                  ? "🚗 Commuter"
                  : "🎪 Event"}
              </button>
            );
          })}
        </div>

        {/* Action Items Grid (Semantic Tinted Cards with Left Accent Bar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {PERSONA_SAFETY_STEPS[persona]?.steps.map((step, idx) => {
            const Icon = getActionIcon(step.title);
            const isUrgent = step.urgent;
            return (
              <div
                key={idx}
                className={`p-4 flex flex-col justify-between ${
                  isUrgent ? "action-card-urgent" : "action-card-caution"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isUrgent
                        ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]"
                        : "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <h4 className="text-xs font-bold text-[#0F172A] tracking-tight">{step.title}</h4>
                      {isUrgent ? (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] font-mono font-bold tracking-wider">
                          URGENT
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-mono font-bold tracking-wider">
                          CAUTION
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Bottom Sheet / Modal (AI Diagnostics & Explainability) */}
      {showWhyModal && currentStep?.explain && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-[#CBD5E1] rounded-t-3xl sm:rounded-2xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0B63E5]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Why This Threat Level?</h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Explainable AI (pySTEPS + LightGBM Blend)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Atmospheric Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <span className="text-slate-500 text-[10px] block font-mono font-medium">CAPE ENERGY</span>
                <span className="font-bold text-[#B45309] text-sm font-mono mt-0.5 block">
                  {currentStep.explain.cape} J/kg
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <span className="text-slate-500 text-[10px] block font-mono font-medium">CIN BARRIER</span>
                <span className="font-bold text-slate-700 text-sm font-mono mt-0.5 block">
                  {currentStep.explain.cin ?? 0} J/kg
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <span className="text-slate-500 text-[10px] block font-mono font-medium">TEMPERATURE</span>
                <span className="font-bold text-slate-700 text-sm font-mono mt-0.5 block">
                  {currentStep.explain.t2m_c}°C
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <span className="text-slate-500 text-[10px] block font-mono font-medium">SURFACE RH</span>
                <span className="font-bold text-slate-700 text-sm font-mono mt-0.5 block">
                  {currentStep.explain.rh_pct}%
                </span>
              </div>
            </div>

            {/* Rain Percentiles Spread */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0B63E5]" />
                Precipitation Spread (20-Member Ensemble):
              </span>
              <div className="flex justify-between font-mono text-[11px] text-slate-600 pt-1 border-t border-[#E2E8F0]">
                <span>
                  P10: <strong className="text-[#0B63E5]">{maxLead.rain_p10} mm/h</strong>
                </span>
                <span>
                  P50: <strong className="text-[#0F172A]">{maxLead.rain_p50} mm/h</strong>
                </span>
                <span>
                  P90: <strong className="text-[#DC2626]">{maxLead.rain_p90} mm/h</strong>
                </span>
              </div>
            </div>

            {/* Feature Attribution Drivers */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2.5">
                Key Drivers (SHAP Feature Attribution):
              </span>
              <div className="space-y-2.5">
                {currentStep.explain.top_features?.map((feat: any, idx: number) => {
                  const contribPct = Math.round(Math.abs(feat.contribution) * 100);
                  const isPositive = feat.contribution >= 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{feat.label_en}</span>
                        <span className={`font-mono font-bold ${isPositive ? "text-[#059669]" : "text-slate-500"}`}>
                          {isPositive ? `+${contribPct}% threat` : `-${contribPct}% suppressing`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPositive
                              ? "bg-gradient-to-r from-[#0284C7] to-[#0B63E5]"
                              : "bg-slate-400"
                          }`}
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
              className="w-full py-3 rounded-xl bg-[#0B63E5] hover:bg-[#0951bd] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
            >
              Close AI Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
