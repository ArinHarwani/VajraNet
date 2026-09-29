"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, Pause, Layers, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { formatUtcToIst } from "@/lib/time";

// Dynamic import MapLibreView to prevent SSR issues
const MapLibreView = dynamic(() => import("@/components/MapLibreView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
      Initializing MapLibre GL...
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
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100">
      {/* Top Map Controls Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-slate-400">Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector: Observed vs Forecast */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => {
              setMode("obs");
              setFrameIndex(0);
            }}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              mode === "obs"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Observed Rain
          </button>
          <button
            onClick={() => {
              setMode("fc");
              setFrameIndex(0);
            }}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              mode === "fc"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Forecast Nowcast
          </button>
        </div>

        {/* Forecast-specific controls */}
        {mode === "fc" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lead:</span>
            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              {["30", "60", "90", "120", "180"].map((lead) => (
                <button
                  key={lead}
                  onClick={() => setSelectedLead(lead)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    selectedLead === lead
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  +{lead}m
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFcType("mean")}
                className={`px-2 py-0.5 rounded ${
                  fcType === "mean" ? "bg-slate-700 text-white font-semibold" : "text-slate-400"
                }`}
              >
                Rain Rate
              </button>
              <button
                onClick={() => setFcType("prob")}
                className={`px-2 py-0.5 rounded ${
                  fcType === "prob" ? "bg-slate-700 text-white font-semibold" : "text-slate-400"
                }`}
              >
                P(≥5mm/h)
              </button>
            </div>
          </div>
        )}

        {/* Opacity slider */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Eye className="w-3.5 h-3.5" />
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-16 accent-blue-500 cursor-pointer"
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

        {/* Floating Time & Status Card */}
        <div className="absolute top-4 left-4 z-20 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl max-w-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{mode === "obs" ? "Observed Frame" : `Forecast (+${selectedLead}m)`}</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {timestamps.length > 0 ? `${frameIndex + 1}/${timestamps.length}` : "0/0"}
            </span>
          </div>
          <div className="text-base font-bold text-white mt-0.5 font-mono">
            {currentTimestamp ? formatUtcToIst(currentTimestamp, true) : "Loading..."}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            UTC: {currentTimestamp || "N/A"}
          </div>
        </div>

        {/* Floating Colormap Legend */}
        <div className="absolute bottom-20 right-4 z-20 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-2.5 shadow-xl text-[10px]">
          <div className="font-semibold text-slate-300 mb-1">
            {mode === "fc" && fcType === "prob" ? "Rain Probability" : "Precipitation (mm/h)"}
          </div>
          {mode === "fc" && fcType === "prob" ? (
            <div className="flex items-center gap-1 font-mono">
              <span className="w-3.5 h-2.5 rounded-sm bg-[#81c78499]" /> 25%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#fff176cc]" /> 50%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#ffb74de6]" /> 75%
              <span className="w-3.5 h-2.5 rounded-sm bg-[#e57373e6]" /> 90%
            </div>
          ) : (
            <div className="flex items-center gap-1 font-mono">
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
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center gap-4 z-10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-500/25 flex items-center justify-center"
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
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>{timestamps[0] ? formatUtcToIst(timestamps[0]) : "T-Start"}</span>
            <span className="text-blue-400 font-bold">
              {currentTimestamp ? formatUtcToIst(currentTimestamp) : ""}
            </span>
            <span>{timestamps[timestamps.length - 1] ? formatUtcToIst(timestamps[timestamps.length - 1]) : "T-End"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
