import { getInventoryAvailability, getOpenOrders } from "@/lib/mock-data";
import type { InventoryAvailability, EnrichedOrder } from "@/lib/types";
import { AlertTriangle, CheckCircle, Package, ShoppingCart } from "lucide-react";

function GapBadge({ gap }: { gap: number }) {
  if (gap < 0) {
    return (
      <span style={{ color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
        <AlertTriangle size={11} />
        <span className="num-critical">{gap}</span>
      </span>
    );
  }
  if (gap < 10) {
    return <span className="num-warn">+{gap}</span>;
  }
  return <span className="num-ok">+{gap}</span>;
}

function OrderStatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    entered: "amber",
    fulfilled: "green",
    released: "green",
    delivered: "dim",
  };
  return <span className={`status-dot ${map[status] ?? "dim"}`} />;
}

export default function DashboardPage() {
  const inventory: InventoryAvailability[] = getInventoryAvailability();
  const openOrders: EnrichedOrder[] = getOpenOrders();

  const shortProducts = inventory.filter((i) => i.gap < 0);
  const lowProducts = inventory.filter((i) => i.gap >= 0 && i.gap < 10);
  const totalTrays = inventory.reduce((s, i) => s + i.totalAvailable, 0);
  const totalCommitted = inventory.reduce((s, i) => s + i.totalCommitted, 0);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1260 }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          className="font-syne"
          style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}
        >
          Inventory &amp; Orders
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 12 }}>
          {"Today's harvest + cooler vs. open orders — Apr 15, 2025"}
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}
        className="fade-in-delay-1"
      >
        {[
          {
            label: "Total Trays Available",
            value: totalTrays,
            icon: <Package size={14} />,
            color: "var(--green)",
          },
          {
            label: "Trays Committed",
            value: totalCommitted,
            icon: <ShoppingCart size={14} />,
            color: "var(--text-muted)",
          },
          {
            label: "Short Products",
            value: shortProducts.length,
            icon: <AlertTriangle size={14} />,
            color: shortProducts.length > 0 ? "var(--red)" : "var(--green)",
          },
          {
            label: "Open Orders",
            value: openOrders.length,
            icon: <CheckCircle size={14} />,
            color: "var(--amber)",
          },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="panel"
            style={{ padding: "16px 18px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color, marginBottom: 10 }}>
              {icon}
              <span
                className="font-syne"
                style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}
              >
                {label}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 500, color, fontVariantNumeric: "tabular-nums" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner if short */}
      {shortProducts.length > 0 && (
        <div
          className="fade-in-delay-2"
          style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            borderRadius: 4,
            padding: "10px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--red)",
          }}
        >
          <AlertTriangle size={13} />
          <span className="font-syne" style={{ fontWeight: 600 }}>Inventory Alert:</span>
          <span style={{ color: "var(--text)" }}>
            {shortProducts.map((p) => p.product.name).join(", ")} — insufficient for open orders.
          </span>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>
        {/* Inventory table */}
        <div className="panel fade-in-delay-2" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-syne" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Available Inventory
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Fresh</th>
                <th>Cooler</th>
                <th>Total</th>
                <th>Committed</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(({ product, freshTrays, coolerTrays, totalAvailable, totalCommitted: committed, gap }) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text)" }}>{product.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{product.sku}</div>
                  </td>
                  <td className="num-ok">{freshTrays}</td>
                  <td style={{ color: "var(--text-muted)" }}>{coolerTrays}</td>
                  <td style={{ fontWeight: 500 }}>{totalAvailable}</td>
                  <td style={{ color: "var(--text-muted)" }}>{committed}</td>
                  <td>
                    <GapBadge gap={gap} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--text-dim)" }}>
            {"Fresh = harvested tonight · Cooler = yesterday's stock"}
          </div>
        </div>

        {/* Open orders */}
        <div className="panel fade-in-delay-3" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)" }}>
            <span className="font-syne" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Open Orders
            </span>
          </div>
          <div>
            {openOrders.map((order, idx) => {
              const orderTotal = order.items.reduce(
                (s, i) => s + i.quantityOrdered * i.unitPrice * (1 - i.discount / 100),
                0
              );
              return (
                <div
                  key={order.id}
                  style={{
                    padding: "14px 16px",
                    borderBottom: idx < openOrders.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <OrderStatusDot status={order.status} />
                        <span style={{ fontWeight: 500 }}>{order.customer.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{order.poNumber}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "var(--green)", fontWeight: 500 }}>${orderTotal.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Ship {order.plannedShip}</div>
                    </div>
                  </div>
                  <div className="panel-inner" style={{ padding: "8px 10px" }}>
                    {order.items.map((item) => {
                      const avail = inventory.find((i) => i.product.id === item.productId);
                      const short = avail && avail.gap < 0;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "3px 0",
                            fontSize: 11,
                          }}
                        >
                          <span style={{ color: short ? "var(--red)" : "var(--text-muted)" }}>
                            {item.product.name}
                          </span>
                          <span style={{ color: short ? "var(--red)" : "var(--text)", fontWeight: 500 }}>
                            {item.quantityOrdered} cs
                            {short && <span style={{ marginLeft: 4 }}>⚠</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low stock warning */}
      {lowProducts.length > 0 && (
        <div
          className="fade-in-delay-4"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "var(--amber-dim)",
            border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: 4,
            fontSize: 12,
            color: "var(--amber)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <AlertTriangle size={12} />
          <span>
            <span className="font-syne" style={{ fontWeight: 600 }}>Low buffer:</span>{" "}
            <span style={{ color: "var(--text)" }}>
              {lowProducts.map((p) => `${p.product.name} (+${p.gap})`).join(", ")} — less than 10 trays above committed quantity.
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
