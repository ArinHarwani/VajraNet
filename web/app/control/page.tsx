"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Lock, Unlock, Play, Square, Bell, Radio, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase, SIM_CHANNEL_NAME } from "@/lib/supabase";

export default function ControlPage() {
  const [passcode, setPasscode] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [simScenarios, setSimScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("demo_squall");
  const [broadcastStatus, setBroadcastStatus] = useState<string>("Idle");
  const [lastSent, setLastSent] = useState<string>("");

  useEffect(() => {
    fetch("/data-mock/sim_scenarios.json")
      .then((res) => res.json())
      .then((d) => {
        setSimScenarios(d.scenarios || []);
        if (d.scenarios?.length) setSelectedScenario(d.scenarios[0].id);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_CONTROL_PASSCODE || "vajra2026";
    if (passcode.trim() === expected || passcode.trim() === "vajra2026") {
      setIsUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect passcode. Hint: vajra2026");
    }
  };

  const sendBroadcast = async (eventType: "sim_start" | "sim_stop" | "test_alert") => {
    setBroadcastStatus(`Broadcasting ${eventType}...`);
    const payload = {
      type: eventType,
      scenario_id: selectedScenario,
      t0_epoch_ms: Date.now(),
    };

    // 1. Supabase Realtime Broadcast (reaches all judges' phones across the internet)
    if (supabase) {
      const channel = supabase.channel(SIM_CHANNEL_NAME, {
        config: { broadcast: { self: true } },
      });
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: eventType,
        payload,
      });
    }

    // 2. Offline fallback BroadcastChannel (same browser / device)
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("vajranet-local-channel");
      bc.postMessage(payload);
    }

    setBroadcastStatus(`Sent ${eventType} successfully!`);
    setLastSent(new Date().toLocaleTimeString("en-IN"));
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 mt-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Judge Demo Controller</h1>
            <p className="text-xs text-slate-400 mt-1">
              Passcode protected to prevent accidental judge phone triggers.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              placeholder="Enter Passcode (vajra2026)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            {errorMsg && <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-500/25"
            >
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Realtime Sim Console</h1>
            <p className="text-xs text-slate-400 font-mono">Channel: {SIM_CHANNEL_NAME}</p>
          </div>
        </div>

        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
        >
          Lock
        </button>
      </div>

      {/* Broadcast Scenario Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">
            Select Storm Scenario:
          </label>
          <div className="space-y-2">
            {simScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedScenario === sc.id
                    ? "bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{sc.label}</span>
                  <span className="text-[10px] font-mono text-amber-400">Peak LRI: {sc.peak_lri}</span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono text-slate-400 mt-1.5">
                  <span>Start: {sc.start_distance_km} km</span>
                  <span>Speed: {sc.speed_kmh} km/h</span>
                  <span>Bearing: {sc.bearing_from_deg}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => sendBroadcast("sim_start")}
            className="py-3.5 px-4 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Live Storm</span>
          </button>

          <button
            onClick={() => sendBroadcast("sim_stop")}
            className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Simulation</span>
          </button>
        </div>

        <button
          onClick={() => sendBroadcast("test_alert")}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Broadcast Instant Test Warning</span>
        </button>

        {/* Broadcast Status Feedback */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Status: {broadcastStatus}</span>
          {lastSent && <span className="text-emerald-400">Last Sent: {lastSent}</span>}
        </div>
      </div>
    </div>
  );
}
