"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackageCheck, ClipboardList } from "lucide-react";
import { DEMO_TODAY } from "@/lib/demo-config";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pack",      icon: PackageCheck,    label: "Pack Verify" },
  { href: "/orders",    icon: ClipboardList,   label: "Order History" },
];

// The demo is a static snapshot of the early-morning shift on DEMO_TODAY.
const DEMO_CLOCK = new Date(`${DEMO_TODAY}T05:00:00Z`).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
}) + " · 05:00";

export default function Sidebar({
  open = false,
  onItemClick,
}: {
  open?: boolean;
  onItemClick?: () => void;
}) {
  const path = usePathname();

  return (
    <aside
      className="app-sidebar"
      data-open={open ? "true" : "false"}
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
        className="sidebar-logo"
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="font-syne" style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          HOLO
        </div>
        <div className="sidebar-subtitle" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Hippo Harvest
        </div>
      </div>

      {/* Date/time context */}
      <div
        className="sidebar-clockbar"
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span className="status-dot green" style={{ animation: "pulse-green 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{DEMO_CLOCK}</span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onItemClick}
              className="sidebar-link"
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
              <span className="font-syne sidebar-label" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.03em" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom system info */}
      <div
        className="sidebar-footer"
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>
          <div>Operator: L. Greens</div>
          <div>Shift: 05:00 – 13:00</div>
        </div>
      </div>
    </aside>
  );
}
