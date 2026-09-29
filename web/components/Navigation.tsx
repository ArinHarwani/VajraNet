"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, PlayCircle, Map as MapIcon, Bell, Zap, Settings, Sliders } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Threat", href: "/", icon: Shield },
    { label: "Replay", href: "/replay", icon: PlayCircle },
    { label: "Live Map", href: "/map", icon: MapIcon },
    { label: "Alerts", href: "/alerts", icon: Bell },
    { label: "Flash-Bang", href: "/flash", icon: Zap },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">VajraNet</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Explainable Thunderstorm Nowcasting</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle link to control panel */}
          <Link
            href="/control"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Simulation Controller (Judges Demo)"
          >
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Mobile-first Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 flex items-center justify-around sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Navigation Links */}
      <nav className="hidden sm:flex items-center justify-center gap-1 bg-slate-900/60 border-b border-slate-800/80 px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
