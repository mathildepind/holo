"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredBOLs } from "@/lib/store";
import { resolveStatus, bolsByOrderId } from "@/lib/order-status";
import type { EnrichedBOL, EnrichedOrder } from "@/lib/types";
import {
  ClipboardList, Download, ChevronRight, X, Truck, Thermometer,
  Weight, Package, User, Calendar, Hash, FileText, MapPin,
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
    rowY += 24;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, rowY, 80, rowY);
    doc.line(100, rowY, 166, rowY);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("PACKED & VERIFIED BY", 14, rowY + 5);
    doc.text("CARRIER SIGNATURE", 100, rowY + 5);

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

function OrderDetail({
  order,
  bol,
  onClose,
}: {
  order: EnrichedOrder;
  bol: EnrichedBOL | undefined;
  onClose: () => void;
}) {
  const status = resolveStatus(order, bol);
  const orderTotal = order.items.reduce(
    (s, oi) => s + oi.quantityOrdered * oi.unitPrice * (1 - oi.discount / 100),
    0
  );

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,43,29,0.3)",
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
          width: "min(540px, 100vw)",
          height: "100%",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          overflow: "auto",
          animation: "slideIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{order.poNumber}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {order.customer.name} · requested {order.requestedDelivery}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: status.color,
                border: `1px solid ${status.color}`,
                background: "transparent",
              }}
            >
              {status.label}
            </span>
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
          {/* Order details */}
          <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
            Order Details
          </div>
          <DetailRow icon={<Hash size={12} />} label="Order ID" value={`#${order.id}`} />
          <DetailRow icon={<User size={12} />} label="Customer" value={order.customer.name} />
          <DetailRow icon={<MapPin size={12} />} label="Delivery Address" value={order.customer.address} />
          <DetailRow icon={<Calendar size={12} />} label="Requested Delivery" value={order.requestedDelivery} />
          <DetailRow icon={<Calendar size={12} />} label="Planned Ship" value={order.plannedShip} />
          <DetailRow icon={<Calendar size={12} />} label="Entered At" value={new Date(order.enteredAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />

          {/* Line items */}
          <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 24, marginBottom: 10 }}>
            Line Items
          </div>
          <div className="panel" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Ordered</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((oi) => (
                  <tr key={oi.id}>
                    <td style={{ fontWeight: 500 }}>{oi.product.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{oi.product.sku}</td>
                    <td>{oi.quantityOrdered}</td>
                    <td style={{ color: "var(--text-muted)" }}>${oi.unitPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order total */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 2px 0", fontSize: 13, fontWeight: 600 }}>
            <span style={{ color: "var(--text)" }}>Order Total</span>
            <span style={{ color: "var(--green)" }}>
              ${orderTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* BOL section */}
          {bol ? (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                  Bill of Lading
                </div>
                <button
                  onClick={() => generateBOLPDF(bol)}
                  style={{
                    padding: "6px 11px",
                    background: "var(--green)",
                    border: "none",
                    borderRadius: 3,
                    color: "var(--surface)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Download size={12} /> Download BOL
                </button>
              </div>
              <DetailRow icon={<FileText size={12} />} label="BOL Number" value={bol.bolNumber} />
              <DetailRow icon={<Truck size={12} />} label="Carrier" value={`${bol.shipment.carrier.name} (${bol.shipment.carrier.type})`} />
              <DetailRow icon={<Calendar size={12} />} label="Ship Date" value={bol.shipment.shipDate} />
              <DetailRow icon={<Package size={12} />} label="Pallet Count" value={`${bol.palletCount} pallets`} />
              <DetailRow icon={<Weight size={12} />} label="Total Weight" value={`${bol.totalWeight} lbs`} />
              <DetailRow icon={<Thermometer size={12} />} label="Temp Requirements" value={bol.tempRequirements} />
              <DetailRow icon={<User size={12} />} label="Generated By" value={bol.generatedBy} />
            </div>
          ) : (
            <div style={{ marginTop: 28 }}>
              <div className="font-syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
                Bill of Lading
              </div>
              <div
                className="panel-inner"
                style={{
                  padding: "14px 16px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <FileText size={14} color="var(--text-dim)" />
                Not yet packed — BOL will be generated after pack verification.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<EnrichedOrder[] | null>(null);
  const [bols, setBols] = useState<EnrichedBOL[] | null>(null);
  const [selected, setSelected] = useState<EnrichedOrder | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<EnrichedOrder[]>("/api/orders/history").then(setOrders);
    apiFetch<EnrichedBOL[]>("/api/bols").then((mockBols) => {
      const stored = getStoredBOLs();
      setBols([...stored, ...mockBols]);
    });
  }, []);

  const bolByOrderId = useMemo(() => bolsByOrderId(bols ?? []), [bols]);

  if (!orders || !bols) {
    return (
      <div className="page-container" style={{ maxWidth: 1200 }}>
        <div className="font-syne" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Order History
        </div>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 12 }}>Loading…</p>
      </div>
    );
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
  );

  const filtered = sorted.filter((o) => {
    const q = search.toLowerCase();
    const bol = bolByOrderId.get(o.id);
    return (
      o.poNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      (bol?.bolNumber.toLowerCase().includes(q) ?? false)
    );
  });

  const shippedCount = orders.filter((o) => bolByOrderId.has(o.id)).length;
  const openCount = orders.length - shippedCount;

  return (
    <div className="page-container fade-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Order History
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 12 }}>
            {orders.length} orders · click any row to view details{shippedCount > 0 ? " & download BOL" : ""}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search orders, customers, BOLs…"
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
          { label: "Total Orders", value: orders.length },
          { label: "Open", value: openCount },
          { label: "Shipped", value: shippedCount },
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
            No orders match your search.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Customer</th>
                <th>Requested</th>
                <th>Items</th>
                <th>Order Value</th>
                <th>Status</th>
                <th>BOL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const bol = bolByOrderId.get(order.id);
                const status = resolveStatus(order, bol);
                const orderValue = order.items.reduce(
                  (s, oi) => s + oi.quantityOrdered * oi.unitPrice * (1 - oi.discount / 100),
                  0
                );

                return (
                  <tr key={order.id} onClick={() => setSelected(order)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ClipboardList size={11} color="var(--text-dim)" />
                        <span style={{ fontWeight: 500 }}>{order.poNumber}</span>
                      </div>
                    </td>
                    <td>{order.customer.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{order.requestedDelivery}</td>
                    <td style={{ color: "var(--text-muted)" }}>{order.items.length}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      ${orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span
                          className="status-dot"
                          style={{
                            background: status.color,
                            boxShadow: `0 0 5px ${status.color}`,
                          }}
                        />
                        <span style={{ color: status.color, fontSize: 11, textTransform: "capitalize" }}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      {bol ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateBOLPDF(bol);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "var(--green)",
                            fontSize: 11,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: "inherit",
                          }}
                          title={`Download ${bol.bolNumber}`}
                        >
                          <Download size={11} /> {bol.bolNumber}
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>—</span>
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
      {selected && (
        <OrderDetail
          order={selected}
          bol={bolByOrderId.get(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
