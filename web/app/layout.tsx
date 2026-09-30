import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VajraNet — Explainable AI Thunderstorm & Lightning Nowcast",
  description:
    "Hyperlocal 0–3hr explainable thunderstorm and lightning risk nowcasting powered by pySTEPS and gradient-boosted machine learning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0B63E5] selection:text-white relative font-sans">
        <Navigation />
        <main className="flex-1 pb-24 sm:pb-12 relative z-10">{children}</main>

        {/* Minimalist Razorpay-style Footer Disclaimer Strip */}
        <footer className="relative z-10 border-t border-[#E2E8F0] bg-white/90 backdrop-blur-md py-4 px-4 text-center">
          <p className="text-[11px] text-slate-500 font-mono tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B63E5]"></span>
            <span className="font-medium text-slate-700">Prototype demonstration</span>
            <span className="text-slate-300">·</span>
            <span>Not an official IMD meteorological warning</span>
            <span className="text-slate-300">·</span>
            <span className="text-[#0B63E5] font-semibold">SIH26072</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
