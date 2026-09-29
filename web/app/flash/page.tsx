"use client";

import React, { useState, useEffect } from "react";
import { Zap, Volume2, ShieldAlert, RotateCcw, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

export default function FlashBangPage() {
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; seconds: number; distanceKm: number }>>([]);
  const [shelterCountdown, setShelterCountdown] = useState<number | null>(null); // in seconds (30 mins = 1800s)

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
    // Speed of sound: 343 m/s = 0.343 km/s (PRD_C §Phase C6 Task 3)
    const dist = elapsedSeconds * 0.343;
    setCalculatedDistanceKm(dist);

    // Reset / restart the 30-minute shelter rule (1800 seconds)
    setShelterCountdown(1800);

    setHistory((prev) => [
      {
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Zap className="w-5 h-5 fill-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Flash-to-Bang Estimator</h1>
          <p className="text-xs text-slate-400">
            Speed of sound metric: 343 m/s = 0.343 km/s · 30-30 Safety Rule
          </p>
        </div>
      </div>

      {/* Main Interactive Button Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="text-center">
          <div className="text-4xl font-extrabold font-mono text-white tracking-wider">
            {elapsedSeconds.toFixed(1)} <span className="text-lg font-normal text-slate-400">sec</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {timerRunning ? "Timing sound delay... Tap 'Heard Thunder' when sound arrives" : "Tap 'I Saw Lightning' when you see a flash"}
          </p>
        </div>

        {/* Big Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleSawLightning}
            className="py-5 px-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Zap className="w-7 h-7 fill-slate-950" />
            <span>1. I Saw Lightning</span>
            <span className="text-[10px] font-normal text-slate-900/80 uppercase">Starts Stopwatch</span>
          </button>

          <button
            onClick={handleHeardThunder}
            disabled={!timerRunning && elapsedSeconds === 0}
            className={`py-5 px-4 rounded-2xl font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-2 shadow-xl transition-all ${
              timerRunning
                ? "bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-blue-500/30 active:scale-95 animate-pulse"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            <Volume2 className="w-7 h-7" />
            <span>2. I Heard Thunder</span>
            <span className="text-[10px] font-normal uppercase opacity-80">Calculates Distance</span>
          </button>
        </div>

        {/* Distance Result & Shelter Warning */}
        {calculatedDistanceKm !== null && (
          <div
            className={`p-5 rounded-2xl border transition-all animate-in zoom-in-95 duration-200 ${
              calculatedDistanceKm <= 10.0
                ? "bg-rose-950/40 border-rose-800/80 text-rose-200"
                : "bg-blue-950/40 border-blue-800/80 text-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold block text-slate-400">
                  Calculated Strike Distance
                </span>
                <div className="text-3xl font-extrabold font-mono text-white mt-0.5">
                  {calculatedDistanceKm.toFixed(2)} <span className="text-lg font-normal text-slate-300">km</span>
                </div>
              </div>

              {calculatedDistanceKm <= 10.0 ? (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                  <span className="text-xs font-bold font-mono">DANGER ZONE</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-xs font-bold font-mono">MONITORING</span>
                </div>
              )}
            </div>

            {calculatedDistanceKm <= 10.0 ? (
              <div className="mt-4 pt-3 border-t border-rose-800/40 text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>
                  <strong>TAKE SHELTER NOW:</strong> Strike is within 10 km (the danger envelope for deadly cloud-to-ground side flashes). Seek substantial indoor shelter immediately.
                </span>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-blue-800/40 text-xs text-blue-200">
                Strike is beyond 10 km, but storm cells can travel at 40+ km/h. Keep monitoring.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 30-Minute Post-Thunder Shelter Rule Timer */}
      {shelterCountdown !== null && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>30-Minute Safety Buffer Timer</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {formatMinSec(shelterCountdown)} remaining
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The national lightning safety rule dictates waiting at least 30 minutes after hearing the last thunderclap before leaving shelter. Each new thunderclap resets this timer.
          </p>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${(shelterCountdown / 1800) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 block mb-2">Recent Taps</span>
          <div className="space-y-1.5 font-mono text-xs text-slate-300">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-slate-800/50">
                <span>{h.time}</span>
                <span>{h.seconds}s delay</span>
                <span className={h.distanceKm <= 10.0 ? "text-rose-400 font-bold" : "text-slate-300"}>
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
