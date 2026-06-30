"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

interface Props {
  currentTab: string;
  notifCount: number;
}

export function TabNav({ currentTab, notifCount }: Props) {
  const hasAlerts = notifCount > 0;
  const [visible, setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress]  = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 7000;

  useEffect(() => {
    if (!hasAlerts) return;
    const t = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(t);
  }, [hasAlerts]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct === 0) { clearInterval(intervalRef.current!); setVisible(false); }
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [visible, dismissed]);

  function dismiss() {
    setDismissed(true);
    setVisible(false);
    clearInterval(intervalRef.current!);
  }

  const tabs = [
    { key: "overview",       label: "Vue d'ensemble", count: 0 },
    { key: "notifications",  label: "Notifications",  count: notifCount },
  ];

  return (
    <>
      {/* ── Onglets ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-px" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(({ key, label, count }) => {
          const active   = currentTab === key;
          const hasAlert = count > 0;

          return (
            <Link
              key={key}
              href={key === "overview" ? "/dashboard" : `/dashboard?tab=${key}`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-all"
              style={{
                fontFamily:  "Inter, sans-serif",
                fontWeight:  active ? 600 : 400,
                borderRadius: "999px",
                background:  active ? "#5a2bd9" : "transparent",
                color:       active ? "#fff" : hasAlert ? "#1e1e32" : "#6e6e82",
              }}
            >
              {/* Cloche + point rouge */}
              {hasAlert && (
                <span className="relative inline-flex items-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: active ? "#fff" : "#e11d48" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#e11d48", boxShadow: "0 0 0 2px #fff" }}
                  />
                </span>
              )}
              {label}
              {hasAlert && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: active ? "rgba(255,255,255,0.22)" : "#fff5f5",
                    color:      active ? "#fff" : "#e11d48",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Toast ── */}
      <div
        className="fixed z-50 transition-all duration-500"
        style={{
          bottom: "24px",
          right:  "24px",
          opacity:   visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div
          className="overflow-hidden"
          style={{
            background:   "#fff",
            border:       "1px solid #e6e6ee",
            borderRadius: "18px",
            minWidth:     "280px",
            boxShadow:    "0 30px 70px -20px rgba(30,30,50,.40)",
          }}
        >
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: "#fff5f5", borderRadius: "10px" }}>
                <svg className="w-4 h-4" style={{ color: "#e11d48" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1e1e32" }}>
                  {notifCount} notification{notifCount > 1 ? "s" : ""} en attente
                </p>
                <p className="text-xs mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82" }}>
                  Des dossiers nécessitent votre attention
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              style={{ color: "#a8a8ba" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-3">
            <Link
              href="/dashboard?tab=notifications"
              onClick={dismiss}
              className="flex items-center justify-between p-3 transition-colors hover:opacity-90"
              style={{ background: "#5a2bd9", borderRadius: "10px" }}
            >
              <span className="text-xs font-semibold" style={{ fontFamily: "Inter, sans-serif", color: "#fff" }}>
                Voir les notifications
              </span>
              <svg className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Barre de progression auto-dismiss */}
          <div className="h-1" style={{ background: "#f8f8fc" }}>
            <div
              className="h-1"
              style={{
                width:      `${progress}%`,
                background: "linear-gradient(90deg, #5a2bd9, #8d6ee8)",
                transition: "width 0.05s linear",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
