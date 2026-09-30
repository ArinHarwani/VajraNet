"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Volume2,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export default function FlashBangPage() {
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; seconds: number; distanceKm: number }>>([]);
  const [shelterCountdown, setShelterCountdown] = useState<number | null>(null);

  // Stopwatch for lightning -> thunder
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // 30-minute shelter countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (shelterCountdown !== null && shelterCountdown > 0) {
      interval = setInterval(() => {
        setShelterCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [shelterCountdown]);

  const handleSawLightning = () => {
    setElapsedSeconds(0);
    setCalculatedDistanceKm(null);
    setTimerRunning(true);
  };

  const handleHeardThunder = () => {
    if (!timerRunning && elapsedSeconds === 0) return;
    setTimerRunning(false);
    // Speed of sound: 343 m/s = 0.343 km/s
    const dist = elapsedSeconds * 0.343;
    setCalculatedDistanceKm(dist);

    // Reset 30-minute shelter rule (1800 seconds)
    setShelterCountdown(1800);

    setHistory((prev) => [
      {
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        seconds: Number(elapsedSeconds.toFixed(1)),
        distanceKm: Number(dist.toFixed(2)),
      },
      ...prev.slice(0, 4),
    ]);
  };

  const formatMinSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
      {/* Header Banner */}
      <div className="razor-card p-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#B45309] flex-shrink-0 shadow-sm">
          <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
            Flash-to-Bang Estimator
          </h1>
          <p className="text-xs text-slate-500">
            Acoustic distance calculation (speed of sound = 343 m/s) · 30-30 Rule
          </p>
        </div>
      </div>

      {/* Main Interactive Action Card */}
      <div className="razor-card-hero p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1 font-bold">
            Elapsed Sound Delay
          </span>
          <div className="text-5xl font-black font-mono text-[#0F172A] tracking-wider">
            {elapsedSeconds.toFixed(1)}{" "}
            <span className="text-xl font-normal text-slate-400 font-sans">sec</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {timerRunning
              ? "Timing sound wave delay... Tap 'I Heard Thunder' immediately when the sound reaches you."
              : "Tap 'I Saw Lightning' the moment you observe a flash."}
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleSawLightning}
            className="py-5 px-4 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-slate-900 font-extrabold text-sm flex flex-col items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all duration-200 border border-amber-300"
          >
            <Zap className="w-7 h-7 fill-slate-900" />
            <span>1. I Saw Lightning</span>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              Starts Stopwatch
            </span>
          </button>

          <button
            onClick={handleHeardThunder}
            disabled={!timerRunning && elapsedSeconds === 0}
            className={`py-5 px-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
              timerRunning
                ? "bg-[#0B63E5] hover:bg-[#0951bd] text-white shadow-lg shadow-blue-500/25 active:scale-95 animate-pulse"
                : "bg-[#F1F5F9] text-slate-400 cursor-not-allowed border border-[#E2E8F0]"
            }`}
          >
            <Volume2 className="w-7 h-7" />
            <span>2. I Heard Thunder</span>
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">
              Calculates Strike Distance
            </span>
          </button>
        </div>

        {/* Distance Result & Warning Card */}
        {calculatedDistanceKm !== null && (
          <div
            className={`p-5 rounded-2xl border transition-all animate-in zoom-in-95 duration-200 ${
              calculatedDistanceKm <= 10.0
                ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                : "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold block text-slate-600">
                  Calculated Strike Distance
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-[#0F172A] mt-1">
                  {calculatedDistanceKm.toFixed(2)}{" "}
                  <span className="text-lg font-normal text-slate-500 font-sans">km</span>
                </div>
              </div>

              {calculatedDistanceKm <= 10.0 ? (
                <div className="px-3.5 py-2 rounded-xl bg-white text-[#DC2626] border border-[#FECACA] shadow-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 animate-bounce" />
                  <span className="text-xs font-mono font-bold tracking-wider">DANGER ENVELOPE</span>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-white text-[#0B63E5] border border-[#BFDBFE] shadow-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold tracking-wider">MONITORING</span>
                </div>
              )}
            </div>

            {calculatedDistanceKm <= 10.0 ? (
              <div className="mt-4 pt-3.5 border-t border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#DC2626] mt-0.5" />
                <span className="leading-relaxed">
                  <strong>IMMEDIATE INDOOR SHELTER MANDATED:</strong> Strike occurred within 10 km (the danger envelope for deadly cloud-to-ground side flashes). Move indoors immediately.
                </span>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-[#BFDBFE] text-xs text-[#1D4ED8] leading-relaxed">
                Strike is beyond 10 km, but storm cells can travel at 40+ km/h. Keep observing the sky.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 30-Minute Safety Buffer Timer */}
      {shelterCountdown !== null && (
        <div className="razor-card p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Clock className="w-4 h-4 text-[#0B63E5]" />
              <span>30-Minute Post-Thunder Safety Rule</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
              {formatMinSec(shelterCountdown)} remaining
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            National lightning safety guidelines require waiting at least 30 minutes after the last audible thunderclap before leaving shelter.
          </p>

          <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="bg-[#0B63E5] h-full rounded-full transition-all duration-300"
              style={{ width: `${(shelterCountdown / 1800) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="razor-card p-4">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-3 font-mono">
            Recent Flash-to-Bang Records
          </span>
          <div className="space-y-2 font-mono text-xs text-slate-600">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <span className="text-slate-500">{h.time}</span>
                <span className="text-slate-700 font-medium">{h.seconds}s delay</span>
                <span
                  className={`font-bold ${
                    h.distanceKm <= 10.0 ? "text-[#DC2626]" : "text-[#0B63E5]"
                  }`}
                >
                  {h.distanceKm} km
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
