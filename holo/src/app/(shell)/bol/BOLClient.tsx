"use client";

import { useState } from "react";
import type { EnrichedBOL } from "@/lib/types";
import {
  FileText, Download, ChevronRight, X, Truck, Thermometer,
  Weight, Package, User, Calendar, Hash
} from "lucide-react";

// PDF generation
function generateBOLPDF(bol: EnrichedBOL) {
  // Dynamic import to avoid SSR
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const pr = bol.packRecord;
    const order = pr.order;

    // Header
    doc.setFillColor(12, 15, 13);
    doc.rect(0, 0, 216, 32, "F");
    doc.setTextColor(232, 237, 233);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("HIPPO HARVEST", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 140, 124);
    doc.text("BILL OF LADING — HOLO", 14, 20);
    doc.setTextColor(82, 199, 122);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(bol.bolNumber, 14, 27);

    doc.setTextColor(50, 50, 50);

    // Meta info grid
    const metaY = 40;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    const cols = [14, 70, 126, 172];
    const labels = ["SHIP DATE", "CARRIER", "CUSTOMER", "DELIVERY ADDRESS"];
    const vals = [
      bol.shipment.shipDate,
      bol.shipment.carrier.name,
      order.customer.name,
      order.customer.address,
    ];
    labels.forEach((l, i) => {
      doc.text(l, cols[i], metaY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      const maxW = i < cols.length - 1 ? cols[i + 1] - cols[i] - 4 : 200 - cols[i];
      doc.text(vals[i], cols[i], metaY + 5, { maxWidth: maxW });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
    });

    // Second row meta — account for address wrapping
    const addressMaxW = 200 - cols[3];
    const addressLines = doc.splitTextToSize(order.customer.address, addressMaxW);
    const metaY2 = metaY + Math.max(14, 5 + addressLines.length * 4 + 4);
    const labels2 = ["PO NUMBER", "PLANNED SHIP", "PALLET COUNT", "TOTAL WEIGHT"];
    const vals2 = [
      order.poNumber,
      order.plannedShip,
      String(bol.palletCount),
      `${bol.totalWeight} lbs`,
    ];
    labels2.forEach((l, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(l, cols[i], metaY2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.text(vals2[i], cols[i], metaY2 + 5);
    });

    // Temp requirement callout
    doc.setFillColor(240, 255, 245);
    doc.setDrawColor(82, 199, 122);
    doc.roundedRect(14, metaY2 + 12, 80, 10, 1, 1, "FD");
    doc.setTextColor(30, 100, 50);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`TEMP: ${bol.tempRequirements}`, 19, metaY2 + 18);

    // Divider
    const lineY = metaY2 + 26;
    doc.setDrawColor(220, 220, 220);
    doc.line(14, lineY, 200, lineY);

    // Line items table header
    const tableY = lineY + 6;
    doc.setFillColor(20, 23, 20);
    doc.rect(14, tableY, 186, 8, "F");
    doc.setTextColor(200, 220, 200);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const thCols = [16, 60, 100, 130, 160];
    ["PRODUCT", "SKU", "ORDERED (CS)", "PACKED (CS)", "DISCREPANCY"].forEach((h, i) =>
      doc.text(h, thCols[i], tableY + 5)
    );

    // Rows
    let rowY = tableY + 10;
    pr.items.forEach((item, idx) => {
      const orderItem = order.items.find((oi) => oi.productId === item.productId);
      const bg = idx % 2 === 0 ? [250, 252, 250] : [244, 248, 244];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(14, rowY, 186, 8, "F");

      const delta = item.quantityPacked - (orderItem?.quantityOrdered ?? 0);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.text(item.product.name, thCols[0], rowY + 5);
      doc.text(item.product.sku, thCols[1], rowY + 5);
      doc.text(String(orderItem?.quantityOrdered ?? "—"), thCols[2], rowY + 5);
      doc.text(String(item.quantityPacked), thCols[3], rowY + 5);

      if (delta !== 0) {
        doc.setTextColor(200, 120, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`${delta > 0 ? "+" : ""}${delta}`, thCols[4], rowY + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
      } else {
        doc.setTextColor(82, 160, 100);
        doc.setFont("helvetica", "bold");
        doc.text("OK", thCols[4], rowY + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
      }
      rowY += 8;
    });

    // Notes
    if (pr.notes) {
      rowY += 6;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("PACK NOTES:", 14, rowY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.text(pr.notes, 14, rowY + 5, { maxWidth: 186 });
      rowY += 12;
    }

    // Signature block
    rowY += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, rowY, 80, rowY);
    doc.line(100, rowY, 166, rowY);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("PACKED & VERIFIED BY", 14, rowY + 4);
    doc.text("CARRIER SIGNATURE", 100, rowY + 4);

    // Footer
    const footY = 270;
    doc.setDrawColor(20, 23, 20);
    doc.line(14, footY, 200, footY);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated by HOLO · ${bol.generatedBy} · ${new Date(bol.generatedAt).toLocaleDateString()}`, 14, footY + 5);
    doc.text(bol.bolNumber, 180, footY + 5);

    doc.save(`${bol.bolNumber}.pdf`);
  });
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-dim)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: "var(--text-muted)", fontSize: 11, width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

function BOLDetail({ bol, onClose }: { bol: EnrichedBOL; onClose: () => void }) {
  const pr = bol.packRecord;
  const order = pr.order;

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,15,13,0.85)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        zIndex: 50,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520,
          height: "100%",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          overflow: "auto",
          animation: "slideIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slide-in keyframe injected inline */}
        <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{bol.bolNumber}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {order.customer.name} · {order.poNumber}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => generateBOLPDF(bol)}
              style={{
                padding: "7px 12px",
                background: "var(--green)",
                border: "none",
                borderRadius: 3,
                color: "#0c0f0d",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Download size={12} /> Export PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 3,
                padding: "7px 8px",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Shipment details */}
          <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
            Shipment Details
          </div>
          <DetailRow icon={<Calendar size={12} />} label="Ship Date" value={bol.shipment.shipDate} />
          <DetailRow icon={<Truck size={12} />} label="Carrier" value={`${bol.shipment.carrier.name} (${bol.shipment.carrier.type})`} />
          <DetailRow icon={<Package size={12} />} label="Pallet Count" value={`${bol.palletCount} pallets`} />
          <DetailRow icon={<Weight size={12} />} label="Total Weight" value={`${bol.totalWeight} lbs`} />
          <DetailRow icon={<Thermometer size={12} />} label="Temp Requirements" value={bol.tempRequirements} />
          <DetailRow icon={<User size={12} />} label="Generated By" value={bol.generatedBy} />
          <DetailRow icon={<Hash size={12} />} label="Pack Record" value={`PR-${pr.id} · locked by ${pr.packedBy}`} />

          {/* Pack items */}
          <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 24, marginBottom: 10 }}>
            Line Items (Ordered vs. Packed)
          </div>
          <div className="panel" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Packed</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((item) => {
                  const orderItem = order.items.find((oi) => oi.productId === item.productId);
                  const delta = item.quantityPacked - (orderItem?.quantityOrdered ?? 0);
                  const isDiscrep = delta !== 0;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                        {item.discrepancyNote && (
                          <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 2 }}>
                            {item.discrepancyNote}
                          </div>
                        )}
                      </td>
                      <td>{orderItem?.quantityOrdered ?? "—"}</td>
                      <td style={{ fontWeight: 500 }}>{item.quantityPacked}</td>
                      <td>
                        <span style={{ color: isDiscrep ? "var(--amber)" : "var(--green)", fontWeight: 500 }}>
                          {isDiscrep ? (delta > 0 ? `+${delta}` : delta) : "✓"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pack notes */}
          {pr.notes && (
            <div style={{ marginTop: 16 }}>
              <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>
                Pack Notes
              </div>
              <div className="panel-inner" style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {pr.notes}
              </div>
            </div>
          )}

          {/* Invoice info */}
          <div style={{ marginTop: 24 }}>
            <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
              Invoice Summary
            </div>
            <div className="panel-inner" style={{ padding: "12px 14px" }}>
              {order.items.map((oi) => {
                const pi = pr.items.find((p) => p.productId === oi.productId);
                const packedQty = pi?.quantityPacked ?? 0;
                const lineValue = packedQty * oi.unitPrice * (1 - oi.discount / 100);
                return (
                  <div key={oi.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)" }}>{oi.product.name} × {packedQty} cs</span>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>${lineValue.toFixed(2)}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: "var(--text)" }}>Total</span>
                <span style={{ color: "var(--green)" }}>
                  ${order.items.reduce((s, oi) => {
                    const pi = pr.items.find((p) => p.productId === oi.productId);
                    return s + (pi?.quantityPacked ?? 0) * oi.unitPrice * (1 - oi.discount / 100);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BOLClient({ bols }: { bols: EnrichedBOL[] }) {
  const [selected, setSelected] = useState<EnrichedBOL | null>(null);
  const [search, setSearch] = useState("");

  const filtered = bols.filter((bol) => {
    const q = search.toLowerCase();
    return (
      bol.bolNumber.toLowerCase().includes(q) ||
      bol.packRecord.order.customer.name.toLowerCase().includes(q) ||
      bol.packRecord.order.poNumber.toLowerCase().includes(q) ||
      bol.shipment.carrier.name.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            BOL History
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 12 }}>
            {bols.length} bills of lading · click any row to view details &amp; export PDF
          </p>
        </div>
        <input
          type="text"
          placeholder="Search BOLs, customers, POs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 3,
            width: 240,
            fontSize: 12,
          }}
        />
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }} className="fade-in-delay-1">
        {[
          { label: "Total Shipments", value: bols.length },
          {
            label: "Total Revenue",
            value: `$${bols.reduce((s, bol) => {
              const pr = bol.packRecord;
              return s + pr.order.items.reduce((os, oi) => {
                const pi = pr.items.find((p) => p.productId === oi.productId);
                return os + (pi?.quantityPacked ?? 0) * oi.unitPrice * (1 - oi.discount / 100);
              }, 0);
            }, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          },
          {
            label: "Discrepancies",
            value: bols.reduce(
              (s, bol) => s + bol.packRecord.items.filter((i) => i.discrepancyNote).length,
              0
            ),
          },
        ].map(({ label, value }) => (
          <div key={label} className="panel" style={{ padding: "14px 18px" }}>
            <div className="font-syne" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel fade-in-delay-2" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            No BOLs match your search.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>BOL #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>PO Number</th>
                <th>Carrier</th>
                <th>Pallets</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Discrepancies</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bol) => {
                const hasDiscrepancy = bol.packRecord.items.some((i) => i.discrepancyNote);
                const statusColor =
                  bol.shipment.status === "delivered"
                    ? "var(--green)"
                    : bol.shipment.status === "in_transit"
                    ? "var(--amber)"
                    : "var(--text-muted)";

                return (
                  <tr key={bol.id} onClick={() => setSelected(bol)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={11} color="var(--text-dim)" />
                        <span style={{ fontWeight: 500 }}>{bol.bolNumber}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {new Date(bol.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td>{bol.packRecord.order.customer.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {bol.packRecord.order.poNumber}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {bol.shipment.carrier.name}
                    </td>
                    <td>{bol.palletCount}</td>
                    <td style={{ color: "var(--text-muted)" }}>{bol.totalWeight} lbs</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span
                          className="status-dot"
                          style={{
                            background: statusColor,
                            boxShadow: `0 0 5px ${statusColor}`,
                          }}
                        />
                        <span style={{ color: statusColor, fontSize: 11, textTransform: "capitalize" }}>
                          {bol.shipment.status.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td>
                      {hasDiscrepancy ? (
                        <span style={{ color: "var(--amber)", fontSize: 11 }}>⚠ Yes</span>
                      ) : (
                        <span style={{ color: "var(--green)", fontSize: 11 }}>✓ None</span>
                      )}
                    </td>
                    <td>
                      <ChevronRight size={13} color="var(--text-dim)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selected && <BOLDetail bol={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
