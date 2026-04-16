"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackageCheck, FileText } from "lucide-react";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pack",      icon: PackageCheck,    label: "Pack Verify" },
  { href: "/bol",       icon: FileText,         label: "BOL History" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="font-syne" style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          HOLO
        </div>
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Hippo Harvest
        </div>
      </div>

      {/* Date/time context */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span className="status-dot green" style={{ animation: "pulse-green 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Apr 15, 2025 · 05:02</span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 3,
                marginBottom: 2,
                textDecoration: "none",
                background: active ? "var(--green-dim)" : "transparent",
                color: active ? "var(--green)" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              <span className="font-syne" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.03em" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom system info */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>
          <div>Operator: Maria R.</div>
          <div>Shift: 05:00 – 13:00</div>
        </div>
      </div>
    </aside>
  );
}
