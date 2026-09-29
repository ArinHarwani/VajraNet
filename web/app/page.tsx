"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface EventMeta {
  id: string;
  name: string;
  is_no_storm: boolean;
  first_issue: string;
  last_issue: string;
  points: Array<{ id: string; name: string; lat: number; lon: number }>;
}

export default function Home() {
  const [events, setEvents] = useState<EventMeta[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("evt_mock_01");
  const [manifest, setManifest] = useState<any>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/data-mock/events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        if (data.events?.length) {
          setSelectedEventId(data.events[0].id);
        }
        setLoading(false);
      })
      .catch((err) => console.error("Error loading events:", err));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/data-mock/events/${selectedEventId}/manifest.json`)
      .then((res) => res.json())
      .then((data) => {
        setManifest(data);
        setActiveFrameIndex(0);
      })
      .catch((err) => console.error("Error loading manifest:", err));
  }, [selectedEventId]);

  const obsKeys = manifest ? Object.keys(manifest.obs || {}).sort() : [];

  useEffect(() => {
    if (!isPlaying || obsKeys.length === 0) return;
    const timer = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % obsKeys.length);
    }, 700);
    return () => clearInterval(timer);
  }, [isPlaying, obsKeys.length]);

  const currentFrameKey = obsKeys[activeFrameIndex];
  const currentFrameRelPath = manifest?.obs?.[currentFrameKey];
  const currentFrameUrl = currentFrameRelPath
    ? `/data-mock/events/${selectedEventId}/${currentFrameRelPath}`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ⚡ VajraNet <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Phase C0 Ready</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Explainable AI Thunderstorm &amp; Lightning Nowcasting · SIH26072
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <span className="text-amber-400 font-semibold">SIMULATION / MOCK:</span>
          <span>contract v1.0</span>
        </div>
      </header>

      <main className="w-full max-w-4xl mt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-blue-300">Phase C0 Verification Environment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Local mock dataset validated with 100% schema match. Scrub or play below to verify the moving synthetic storm blob.
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
            ✓ Validator 100% Pass
          </div>
        </div>

        {/* Event Selector & Storm Viewer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Select Scenario:
              </label>
              <div className="flex gap-2">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedEventId === ev.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>
            </div>

            {obsKeys.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                  Frame {activeFrameIndex + 1}/{obsKeys.length}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Frame Viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Display Canvas Frame */}
            <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
              {/* Map background grid hint */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Point markers */}
              <div className="absolute top-[35%] left-[65%] text-[10px] text-amber-400 font-mono bg-black/60 px-1 rounded z-10">
                • Kolkata
              </div>
              <div className="absolute top-[30%] left-[45%] text-[10px] text-amber-400 font-mono bg-black/60 px-1 rounded z-10">
                • Burdwan
              </div>
              <div className="absolute top-[55%] left-[35%] text-[10px] text-amber-400 font-mono bg-black/60 px-1 rounded z-10">
                • Kharagpur
              </div>

              {currentFrameUrl ? (
                <img
                  src={currentFrameUrl}
                  alt={`Observed rain frame at ${currentFrameKey}`}
                  className="relative z-0 w-full h-full object-contain transition-opacity duration-200"
                />
              ) : (
                <div className="text-xs text-slate-500">Loading frame...</div>
              )}

              {/* Timestamp tag */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 flex justify-between border border-slate-800">
                <span>Observed Valid Start:</span>
                <span className="text-blue-400 font-bold">{currentFrameKey || "N/A"}</span>
              </div>
            </div>

            {/* Controls & Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Timeline Scrubber (Observed Sequence)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Drag the slider to manually step through the synthetic storm frames across Bengal:
                </p>
                <div className="mt-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, obsKeys.length - 1)}
                    value={activeFrameIndex}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setActiveFrameIndex(Number(e.target.value));
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>{obsKeys[0] || "Start"}</span>
                    <span>{obsKeys[obsKeys.length - 1] || "End"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Resolution:</span>
                  <span className="font-mono text-slate-200">0.1° (~11 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projection:</span>
                  <span className="font-mono text-slate-200">web-mercator-resampled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rain Threshold:</span>
                  <span className="font-mono text-amber-400">5.0 mm/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Version:</span>
                  <span className="font-mono text-emerald-400">1.0 Frozen</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 italic">
                Note: In Phase C2 / C3, this will be rendered directly on MapLibre GL JS with interactive panning, layers, and point cards.
              </div>
            </div>
          </div>
        </div>

        {/* Phase checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Project Status &amp; Next Phases</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
              <span className="font-semibold text-emerald-400">✓ Phase C0: Repo, Scaffold, Mock Data</span>
              <p className="text-slate-400 mt-1">Completed. Contracts locked, validator passed, mock frames live.</p>
            </div>
            <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg">
              <span className="font-semibold text-blue-400">→ Phase C1: Supabase &amp; Vercel Setup</span>
              <p className="text-slate-400 mt-1">Ready to configure Supabase realtime broadcast channel.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
