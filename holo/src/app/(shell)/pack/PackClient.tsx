"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrichedOrder, Product } from "@/lib/types";
import { Lock, AlertTriangle, CheckCircle, ChevronRight, ArrowLeft, FileText } from "lucide-react";

type DraftItem = {
  productId: number;
  product: Product;
  quantityOrdered: number;
  quantityPacked: number | "";
  discrepancyNote: string;
};

function OrderCard({
  order,
  onSelect,
}: {
  order: EnrichedOrder;
  onSelect: () => void;
}) {
  const total = order.items.reduce(
    (s, i) => s + i.quantityOrdered * i.unitPrice * (1 - i.discount / 100),
    0
  );
  return (
    <div
      className="panel"
      onClick={onSelect}
      style={{
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        marginBottom: 10,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--green)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="status-dot amber" />
            <span className="font-syne" style={{ fontWeight: 700, fontSize: 14 }}>
              {order.customer.name}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
            {order.poNumber} · Ship {order.plannedShip}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
            {order.customer.location}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--green)", fontWeight: 500 }}>${total.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {order.items.length} line{order.items.length !== 1 ? "s" : ""}
            </div>
          </div>
          <ChevronRight size={14} color="var(--text-dim)" />
        </div>
      </div>
    </div>
  );
}

type VerifyState = "editing" | "reviewing" | "locked";

export default function PackClient({ openOrders }: { openOrders: EnrichedOrder[] }) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrder | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [packNotes, setPackNotes] = useState("");
  const [state, setState] = useState<VerifyState>("editing");
  const [lockedAt, setLockedAt] = useState<string | null>(null);

  function selectOrder(order: EnrichedOrder) {
    setSelectedOrder(order);
    setDraftItems(
      order.items.map((i) => ({
        productId: i.productId,
        product: i.product,
        quantityOrdered: i.quantityOrdered,
        quantityPacked: "",
        discrepancyNote: "",
      }))
    );
    setPackNotes("");
    setState("editing");
  }

  function updateQty(productId: number, value: string) {
    setDraftItems((prev) =>
      prev.map((d) =>
        d.productId === productId
          ? { ...d, quantityPacked: value === "" ? "" : parseInt(value, 10) || 0 }
          : d
      )
    );
  }

  function updateNote(productId: number, note: string) {
    setDraftItems((prev) =>
      prev.map((d) => (d.productId === productId ? { ...d, discrepancyNote: note } : d))
    );
  }

  const discrepancies = draftItems.filter(
    (d) => d.quantityPacked !== "" && d.quantityPacked !== d.quantityOrdered
  );

  const allFilled = draftItems.every((d) => d.quantityPacked !== "");

  const discrepancyNotesMissing = discrepancies.some(
    (d) => !d.discrepancyNote.trim()
  );

  function handleVerify() {
    setState("reviewing");
  }

  function handleLock() {
    setLockedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    setState("locked");
  }

  function handleBack() {
    setSelectedOrder(null);
    setState("editing");
  }

  // ── Order list ──────────────────────────────────────────────────────────────
  if (!selectedOrder) {
    return (
      <div style={{ padding: "28px 32px", maxWidth: 960 }} className="fade-in">
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Pack Verification
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 12 }}>
            Select an order to log packed quantities and verify against ordered amounts.
          </p>
        </div>

        {openOrders.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle size={24} style={{ margin: "0 auto 10px", display: "block", color: "var(--green)" }} />
            No open orders awaiting pack verification.
          </div>
        ) : (
          openOrders.map((order) => (
            <div key={order.id} className="fade-in-delay-1">
              <OrderCard order={order} onSelect={() => selectOrder(order)} />
            </div>
          ))
        )}
      </div>
    );
  }

  // ── Locked success screen ───────────────────────────────────────────────────
  if (state === "locked") {
    return (
      <div style={{ padding: "28px 32px", maxWidth: 640 }} className="fade-in">
        <div
          className="panel"
          style={{
            padding: 32,
            textAlign: "center",
            border: "1px solid var(--green)",
            background: "var(--green-dim)",
          }}
        >
          <Lock size={28} style={{ margin: "0 auto 14px", display: "block", color: "var(--green)" }} />
          <div className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Pack Record Locked
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 20 }}>
            {selectedOrder.customer.name} · {selectedOrder.poNumber} · Locked at {lockedAt}
          </div>

          <div className="panel" style={{ textAlign: "left", marginBottom: 20, padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Packed</th>
                  <th>Δ</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {draftItems.map((d) => {
                  const delta =
                    typeof d.quantityPacked === "number"
                      ? d.quantityPacked - d.quantityOrdered
                      : "—";
                  const isDiscrepancy = typeof delta === "number" && delta !== 0;
                  return (
                    <tr key={d.productId}>
                      <td>{d.product.name}</td>
                      <td>{d.quantityOrdered}</td>
                      <td style={{ fontWeight: 500 }}>{d.quantityPacked}</td>
                      <td>
                        {typeof delta === "number" ? (
                          <span
                            style={{
                              color: isDiscrepancy ? "var(--amber)" : "var(--green)",
                            }}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 180 }}>
                        {d.discrepancyNote || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={handleBack}
              style={{
                padding: "8px 16px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 3,
                color: "var(--text-muted)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Back to Orders
            </button>
            <button
              onClick={() => router.push("/bol")}
              style={{
                padding: "8px 16px",
                background: "var(--green)",
                border: "none",
                borderRadius: 3,
                color: "var(--surface)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FileText size={13} />
              Generate BOL →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pack form ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px 32px", maxWidth: 800 }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 12,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ArrowLeft size={12} /> Back to orders
        </button>
        <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Pack Verification
        </h1>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 500 }}>{selectedOrder.customer.name}</span>
          <span style={{ color: "var(--text-dim)" }}>·</span>
          <span style={{ color: "var(--text-muted)" }}>{selectedOrder.poNumber}</span>
          <span style={{ color: "var(--text-dim)" }}>·</span>
          <span style={{ color: "var(--text-muted)" }}>Ship {selectedOrder.plannedShip}</span>
        </div>
      </div>

      {/* Review mode banner */}
      {state === "reviewing" && (
        <div
          style={{
            padding: "10px 14px",
            background: discrepancies.length > 0 ? "var(--amber-dim)" : "var(--green-dim)",
            border: `1px solid ${discrepancies.length > 0 ? "rgba(245,166,35,0.4)" : "rgba(82,199,122,0.4)"}`,
            borderRadius: 4,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: discrepancies.length > 0 ? "var(--amber)" : "var(--green)",
          }}
        >
          {discrepancies.length > 0 ? (
            <>
              <AlertTriangle size={13} />
              <span className="font-syne" style={{ fontWeight: 600 }}>
                {discrepancies.length} discrepanc{discrepancies.length === 1 ? "y" : "ies"} flagged.
              </span>
              <span style={{ color: "var(--text)" }}>Add notes for each discrepancy before locking.</span>
            </>
          ) : (
            <>
              <CheckCircle size={13} />
              <span className="font-syne" style={{ fontWeight: 600 }}>All quantities match.</span>
              <span style={{ color: "var(--text)" }}>Ready to lock and generate BOL.</span>
            </>
          )}
        </div>
      )}

      {/* Pack items */}
      <div className="panel" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <span className="font-syne" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Line Items
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Pack Size</th>
              <th>Ordered</th>
              <th>Packed</th>
              {state === "reviewing" && <th>Δ</th>}
              {state === "reviewing" && <th style={{ minWidth: 200 }}>Discrepancy Note</th>}
            </tr>
          </thead>
          <tbody>
            {draftItems.map((d) => {
              const delta =
                typeof d.quantityPacked === "number"
                  ? d.quantityPacked - d.quantityOrdered
                  : null;
              const isDiscrepancy = delta !== null && delta !== 0;
              const noteRequired = state === "reviewing" && isDiscrepancy && !d.discrepancyNote.trim();

              return (
                <tr key={d.productId} style={isDiscrepancy ? { background: "rgba(245,166,35,0.04)" } : {}}>
                  <td style={{ fontWeight: 500 }}>{d.product.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{d.product.sku}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{d.product.packSize}</td>
                  <td>{d.quantityOrdered}</td>
                  <td>
                    {state === "editing" ? (
                      <input
                        type="number"
                        min={0}
                        className="no-spinner"
                        value={d.quantityPacked}
                        onChange={(e) => updateQty(d.productId, e.target.value)}
                        placeholder="0"
                        style={{
                          width: 72,
                          padding: "5px 8px",
                          borderRadius: 3,
                          border: `1px solid ${noteRequired ? "var(--red)" : "var(--border-bright)"}`,
                          fontSize: 14,
                          textAlign: "right",
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: 500 }}>{d.quantityPacked}</span>
                    )}
                  </td>
                  {state === "reviewing" && (
                    <td>
                      {delta !== null ? (
                        <span
                          style={{
                            color: isDiscrepancy ? "var(--amber)" : "var(--green)",
                            fontWeight: 500,
                          }}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      ) : "—"}
                    </td>
                  )}
                  {state === "reviewing" && (
                    <td>
                      {isDiscrepancy ? (
                        <textarea
                          rows={2}
                          value={d.discrepancyNote}
                          onChange={(e) => updateNote(d.productId, e.target.value)}
                          placeholder="Explain discrepancy…"
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: 3,
                            border: `1px solid ${noteRequired ? "var(--red)" : "var(--border-bright)"}`,
                            fontSize: 11,
                            resize: "vertical",
                            minHeight: 48,
                          }}
                        />
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* General notes */}
      <div className="panel" style={{ padding: "14px 16px", marginBottom: 20 }}>
        <label
          className="font-syne"
          style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}
        >
          Pack Notes (optional)
        </label>
        <textarea
          rows={2}
          value={packNotes}
          onChange={(e) => setPackNotes(e.target.value)}
          placeholder="Any general notes about this packing session…"
          disabled={state === "reviewing"}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 3,
            border: "1px solid var(--border-bright)",
            fontSize: 12,
            resize: "vertical",
            opacity: state === "reviewing" ? 0.6 : 1,
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {state === "editing" && (
          <>
            <button
              onClick={handleBack}
              style={{
                padding: "9px 16px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 3,
                color: "var(--text-muted)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={!allFilled}
              style={{
                padding: "9px 20px",
                background: allFilled ? "var(--green)" : "var(--surface-2)",
                border: "none",
                borderRadius: 3,
                color: allFilled ? "var(--surface)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 600,
                cursor: allFilled ? "pointer" : "not-allowed",
                fontFamily: "'Outfit', sans-serif",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle size={13} />
              Verify Pack
            </button>
            {!allFilled && (
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                Fill in all packed quantities to continue
              </span>
            )}
          </>
        )}

        {state === "reviewing" && (
          <>
            <button
              onClick={() => setState("editing")}
              style={{
                padding: "9px 16px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 3,
                color: "var(--text-muted)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ← Edit Quantities
            </button>
            <button
              onClick={handleLock}
              disabled={discrepancyNotesMissing}
              style={{
                padding: "9px 20px",
                background: discrepancyNotesMissing ? "var(--surface-2)" : "var(--green)",
                border: "none",
                borderRadius: 3,
                color: discrepancyNotesMissing ? "var(--text-dim)" : "var(--surface)",
                fontSize: 12,
                fontWeight: 600,
                cursor: discrepancyNotesMissing ? "not-allowed" : "pointer",
                fontFamily: "'Outfit', sans-serif",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Lock size={13} />
              Lock &amp; Generate BOL
            </button>
            {discrepancyNotesMissing && (
              <span style={{ fontSize: 11, color: "var(--amber)" }}>
                Add notes for all discrepancies
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
