"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  PlayCircle,
  Map as MapIcon,
  Bell,
  Zap,
  Settings,
  Sliders,
  Radio,
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Threat", href: "/", icon: ShieldAlert },
    { label: "Replay", href: "/replay", icon: PlayCircle },
    { label: "Live Map", href: "/map", icon: MapIcon },
    { label: "Alerts", href: "/alerts", icon: Bell },
    { label: "Flash-Bang", href: "/flash", icon: Zap },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Top Floating White Header (RazorpayX SaaS Aesthetic) */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#0B63E5] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-200">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#0F172A] font-sans">
                  VajraNet
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] tracking-wider">
                  PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Explainable Thunderstorm &amp; Lightning Nowcast
              </p>
            </div>
          </Link>

          {/* Desktop Navigation: Razorpay Segmented Pill Controls */}
          <nav className="hidden md:flex items-center bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-white bg-[#0B63E5] shadow-sm shadow-blue-500/25"
                      : "text-slate-600 hover:text-[#0F172A] hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Live Feed Badge & Controller */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-mono text-[#059669] font-semibold">
              <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
              <span>LIVE FEED</span>
            </div>

            <Link
              href="/control"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-slate-700 hover:text-[#0F172A] transition-all text-xs font-semibold shadow-sm"
              title="Judge Demo Controller"
            >
              <Sliders className="w-3.5 h-3.5 text-[#0B63E5]" />
              <span className="hidden sm:inline">Sim Controller</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Dock Bar (Light Theme) */}
      <nav className="fixed bottom-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-xl border border-[#E2E8F0] rounded-2xl px-2 py-1.5 flex items-center justify-around sm:hidden shadow-xl shadow-slate-900/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-[#0B63E5] font-bold bg-[#EFF6FF]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
