"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Lock,
  Play,
  Square,
  Bell,
  Radio,
} from "lucide-react";
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

    // 1. Supabase Realtime Broadcast
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

    // 2. Offline fallback BroadcastChannel
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("vajranet-local-channel");
      bc.postMessage(payload);
    }

    setBroadcastStatus(`Sent ${eventType} successfully!`);
    setLastSent(new Date().toLocaleTimeString("en-IN"));
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 pb-12">
        <div className="razor-card p-6 sm:p-8 space-y-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0B63E5] mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
              Judge Demo Controller
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Passcode protected to prevent accidental judge phone triggers during evaluation.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3.5">
            <input
              type="password"
              placeholder="Enter Passcode (vajra2026)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-center text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0B63E5]/20 focus:border-[#0B63E5] focus:bg-white font-mono transition-all"
            />
            {errorMsg && <p className="text-xs text-[#DC2626] font-mono font-medium">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0B63E5] hover:bg-[#0951bd] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
            >
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
      {/* Header */}
      <div className="razor-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
              Realtime Sim Console
            </h1>
            <p className="text-xs text-slate-500 font-mono">Channel: {SIM_CHANNEL_NAME}</p>
          </div>
        </div>

        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs text-slate-600 hover:text-[#0F172A] px-3 py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] font-medium transition-colors"
        >
          Lock
        </button>
      </div>

      {/* Broadcast Scenario Selector */}
      <div className="razor-card p-5 sm:p-6 space-y-5">
        <div>
          <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2.5">
            Select Storm Scenario:
          </label>
          <div className="space-y-2.5">
            {simScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedScenario === sc.id
                    ? "bg-[#EFF6FF] border-[#0B63E5] text-[#0F172A] shadow-sm ring-1 ring-[#0B63E5]/30"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">{sc.label}</span>
                  <span className="text-[10px] font-mono font-bold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                    Peak LRI: {sc.peak_lri}
                  </span>
                </div>
                <div className="flex gap-4 text-[10px] font-mono text-slate-500 mt-2">
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
            className="py-3.5 px-4 rounded-xl bg-gradient-to-tr from-[#EF4444] to-[#F43F5E] hover:from-red-600 hover:to-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-500/25 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Live Storm</span>
          </button>

          <button
            onClick={() => sendBroadcast("sim_stop")}
            className="py-3.5 px-4 rounded-xl bg-white hover:bg-[#F8FAFC] text-slate-700 border border-[#CBD5E1] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Simulation</span>
          </button>
        </div>

        <button
          onClick={() => sendBroadcast("test_alert")}
          className="w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-slate-700 border border-[#E2E8F0] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Bell className="w-4 h-4 text-[#D97706]" />
          <span>Broadcast Instant Test Warning</span>
        </button>

        {/* Broadcast Status Feedback */}
        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-500">Status: {broadcastStatus}</span>
          {lastSent && <span className="text-[#059669] font-semibold">Last: {lastSent}</span>}
        </div>
      </div>
    </div>
  );
}
