"use client";

import React, { useState } from "react";
import { Settings, Globe, Database, GitBranch, ExternalLink, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [dataBase, setDataBase] = useState<string>("/data-mock");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
      {/* Header */}
      <div className="razor-card p-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0B63E5] flex-shrink-0 shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
            System Settings
          </h1>
          <p className="text-xs text-slate-500">Environment configuration, localization &amp; contracts</p>
        </div>
      </div>

      <div className="razor-card p-5 sm:p-6 space-y-6">
        {/* Language Selection */}
        <div>
          <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2.5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0B63E5]" />
            <span>Display Language (i18n)</span>
          </label>
          <div className="razor-pill-container grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`py-2 px-3 rounded-full font-bold transition-all ${
                lang === "en"
                  ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English (Default)
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`py-2 px-3 rounded-full font-bold transition-all ${
                lang === "hi"
                  ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
          {lang === "hi" && (
            <p className="text-[11px] text-[#B45309] mt-2 font-mono flex items-center gap-1.5">
              <span>✓ हिन्दी आपातकालीन दिशा-निर्देश सक्रिय</span>
            </p>
          )}
        </div>

        {/* Data Source Setting */}
        <div className="pt-5 border-t border-[#E2E8F0]">
          <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2.5 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#059669]" />
            <span>Data Root Pipeline</span>
          </label>
          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Current Root:</span>
              <span className="font-mono text-[#059669] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                {dataBase}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
              Controlled via <code className="text-[#0B63E5] font-semibold">NEXT_PUBLIC_DATA_BASE</code>. Defaults to <code className="text-slate-700 font-semibold">/data-mock</code>. Swapped to operational satellite feeds upon Milestone M2.
            </p>
          </div>
        </div>

        {/* Contract & Architecture Meta */}
        <div className="pt-5 border-t border-[#E2E8F0]">
          <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2.5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#6366F1]" />
            <span>Architecture &amp; Core Contracts</span>
          </label>
          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2 text-xs font-mono text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Version:</span>
              <span className="text-[#0F172A] font-bold">1.0 (Frozen)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grid Resolution:</span>
              <span className="text-[#0F172A]">0.1° (~11 km cells)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ensemble Members:</span>
              <span className="text-[#0F172A]">20 perturbed members</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">LRI Formula:</span>
              <span className="text-[#B45309] text-[10px] font-bold">100*clip(0.7*P + 0.3*(CAPE/2500),0,1)</span>
            </div>
          </div>
        </div>

        {/* GitHub Repository */}
        <div className="pt-5 border-t border-[#E2E8F0]">
          <a
            href="https://github.com/ArinHarwani/VajraNet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] text-xs transition-all"
          >
            <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
              <GitBranch className="w-4 h-4 text-[#0B63E5]" />
              <span className="text-[#0F172A]">ArinHarwani/VajraNet</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
