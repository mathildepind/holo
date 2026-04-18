"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div
        className="sidebar-backdrop"
        data-open={drawerOpen ? "true" : "false"}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <Sidebar open={drawerOpen} onItemClick={() => setDrawerOpen(false)} />
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>
          <span className="brand">HOLO</span>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
