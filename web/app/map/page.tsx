"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, Pause, Eye, MapPin, Layers } from "lucide-react";
import { formatUtcToIst } from "@/lib/time";

const MapLibreView = dynamic(() => import("@/components/MapLibreView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-[#F1F5F9] flex items-center justify-center text-slate-500 text-sm font-mono">
      Initializing MapLibre GL Engine...
    </div>
  ),
});

export default function MapPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("evt_mock_01");
  const [manifest, setManifest] = useState<any>(null);
  const [mode, setMode] = useState<"obs" | "fc">("obs");
  const [selectedLead, setSelectedLead] = useState<string>("60");
  const [fcType, setFcType] = useState<"mean" | "prob">("mean");
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [opacity, setOpacity] = useState<number>(0.85);
  const [selectedPointId, setSelectedPointId] = useState<string>("p1_kolkata");

  // Load events
  useEffect(() => {
    fetch("/data-mock/events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        if (data.events?.length) setSelectedEventId(data.events[0].id);
      })
      .catch((err) => console.error("Error loading events:", err));
  }, []);

  // Load manifest
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/data-mock/events/${selectedEventId}/manifest.json`)
      .then((res) => res.json())
      .then((data) => {
        setManifest(data);
        setFrameIndex(0);
      })
      .catch((err) => console.error("Error loading manifest:", err));
  }, [selectedEventId]);

  const currentEvent = events.find((e) => e.id === selectedEventId);

  // Available timestamps
  const timestamps = manifest
    ? mode === "obs"
      ? Object.keys(manifest.obs || {}).sort()
      : Object.keys(manifest.forecast || {}).sort()
    : [];

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || timestamps.length === 0) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % timestamps.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, timestamps.length]);

  const currentTimestamp = timestamps[frameIndex] || "";

  // Compute active image URL
  let currentImageUrl: string | null = null;
  if (manifest && currentTimestamp) {
    if (mode === "obs") {
      const rel = manifest.obs?.[currentTimestamp];
      if (rel) currentImageUrl = `/data-mock/events/${selectedEventId}/${rel}`;
    } else {
      const fcLeads = manifest.forecast?.[currentTimestamp];
      const rel = fcLeads?.[selectedLead]?.[fcType];
      if (rel) currentImageUrl = `/data-mock/events/${selectedEventId}/${rel}`;
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Map Controls Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xs uppercase font-bold text-slate-500 font-mono tracking-wider">
            Event:
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white cursor-pointer transition-colors"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector: Observed vs Forecast */}
        <div className="razor-pill-container flex items-center text-xs">
          <button
            onClick={() => {
              setMode("obs");
              setFrameIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
              mode === "obs"
                ? "bg-[#0B63E5] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Observed Rain
          </button>
          <button
            onClick={() => {
              setMode("fc");
              setFrameIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
              mode === "fc"
                ? "bg-[#0B63E5] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Forecast Nowcast
          </button>
        </div>

        {/* Forecast-specific controls */}
        {mode === "fc" && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-medium">Lead:</span>
            <div className="razor-pill-container flex text-xs">
              {["30", "60", "90", "120", "180"].map((lead) => (
                <button
                  key={lead}
                  onClick={() => setSelectedLead(lead)}
                  className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                    selectedLead === lead
                      ? "bg-[#0B63E5] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  +{lead}m
                </button>
              ))}
            </div>

            <div className="razor-pill-container flex text-xs">
              <button
                onClick={() => setFcType("mean")}
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  fcType === "mean"
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Rain Rate
              </button>
              <button
                onClick={() => setFcType("prob")}
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  fcType === "prob"
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                P(≥5mm/h)
              </button>
            </div>
          </div>
        )}

        {/* Opacity slider */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
          <Eye className="w-3.5 h-3.5 text-[#0B63E5]" />
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-16 accent-[#0B63E5] cursor-pointer"
            title="Radar Overlay Opacity"
          />
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full overflow-hidden">
        <MapLibreView
          bbox={currentEvent?.bbox}
          imageUrl={currentImageUrl}
          imageCoordinates={manifest?.image_coordinates}
          points={currentEvent?.points || []}
          selectedPointId={selectedPointId}
          onPointSelect={(id) => setSelectedPointId(id)}
          opacity={opacity}
          className="w-full h-full border-none rounded-none"
        />

        {/* Floating Time & Status Card (Razorpay Clean Card) */}
        <div className="absolute top-4 left-4 z-20 razor-card p-4 max-w-xs shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {mode === "obs" ? "Observed Frame" : `Forecast (+${selectedLead}m)`}
            </span>
            <span className="font-mono text-[#059669] font-bold bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              {timestamps.length > 0 ? `${frameIndex + 1}/${timestamps.length}` : "0/0"}
            </span>
          </div>
          <div className="text-base font-extrabold text-[#0F172A] mt-1 font-mono tracking-tight">
            {currentTimestamp ? formatUtcToIst(currentTimestamp, true) : "Loading..."}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            UTC: {currentTimestamp || "N/A"}
          </div>
        </div>

        {/* Floating Colormap Legend */}
        <div className="absolute bottom-20 right-4 z-20 razor-card p-3 shadow-lg text-[10px]">
          <div className="font-bold text-[#0F172A] mb-1.5 tracking-tight">
            {mode === "fc" && fcType === "prob" ? "Rain Probability" : "Precipitation (mm/h)"}
          </div>
          {mode === "fc" && fcType === "prob" ? (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-3.5 h-2.5 rounded-sm bg-[#81c78499]" /> 25%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#fff176cc]" /> 50%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#ffb74de6]" /> 75%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#e57373e6]" /> 90%
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-3.5 h-2.5 rounded-sm bg-[#4fc3f799]" /> 1
              <span className="w-3.5 h-2.5 rounded-sm bg-[#0288d1cc]" /> 5
              <span className="w-3.5 h-2.5 rounded-sm bg-[#fbc02dcc]" /> 15
              <span className="w-3.5 h-2.5 rounded-sm bg-[#f57c00e6]" /> 30
              <span className="w-3.5 h-2.5 rounded-sm bg-[#d32f2fe6]" /> 50+
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline Playback Scrubber Bar */}
      <div className="bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center gap-4 z-10 shadow-sm">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2.5 rounded-xl bg-[#0B63E5] hover:bg-[#0951bd] text-white transition-all shadow-md shadow-blue-500/20 flex items-center justify-center active:scale-95 flex-shrink-0"
          title={isPlaying ? "Pause playback" : "Play playback"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min={0}
            max={Math.max(0, timestamps.length - 1)}
            value={frameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
            className="w-full accent-[#0B63E5] cursor-pointer h-1.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
            <span>{timestamps[0] ? formatUtcToIst(timestamps[0]) : "T-Start"}</span>
            <span className="text-[#0B63E5] font-bold">
              {currentTimestamp ? formatUtcToIst(currentTimestamp) : ""}
            </span>
            <span>{timestamps[timestamps.length - 1] ? formatUtcToIst(timestamps[timestamps.length - 1]) : "T-End"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
