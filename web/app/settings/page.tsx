"use client";

import React, { useState } from "react";
import { Settings, Globe, Database, ShieldCheck, GitBranch, ExternalLink, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [dataBase, setDataBase] = useState<string>("/data-mock");

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400">Environment config, localization &amp; contracts</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        {/* Language Selection */}
        <div>
          <label className="text-xs uppercase font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Display Language (i18n)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                lang === "en" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400"
              }`}
            >
              English (Default)
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                lang === "hi" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
          {lang === "hi" && (
            <p className="text-[11px] text-amber-400 mt-1.5 font-mono">
              ✓ हिन्दी सुरक्षा नियम सक्रिय (Hindi emergency guidance enabled)
            </p>
          )}
        </div>

        {/* Data Source Setting */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs uppercase font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Data Root Pipeline</span>
          </label>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Root:</span>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {dataBase}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Set via <code className="text-slate-300">NEXT_PUBLIC_DATA_BASE</code>. Defaults to <code className="text-slate-300">/data-mock</code>. Switched to <code className="text-slate-300">/data</code> upon Milestone M2.
            </p>
          </div>
        </div>

        {/* Contract & Architecture Meta */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs uppercase font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Architecture &amp; Contracts</span>
          </label>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Version:</span>
              <span className="text-white font-bold">1.0 (Frozen)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grid Resolution:</span>
              <span className="text-white">0.1° (~11 km cells)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ensemble Members:</span>
              <span className="text-white">20 members</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">LRI Formula:</span>
              <span className="text-amber-400 text-[10px]">100*clip(0.7*P + 0.3*(CAPE/2500),0,1)</span>
            </div>
          </div>
        </div>

        {/* GitHub Repository */}
        <div className="pt-4 border-t border-slate-800">
          <a
            href="https://github.com/ArinHarwani/VajraNet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <GitBranch className="w-4 h-4 text-blue-400" />
              <span>ArinHarwani/VajraNet</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
