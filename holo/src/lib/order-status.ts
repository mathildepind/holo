import type { EnrichedBOL, EnrichedOrder } from "./types";

export type OrderStatus = { label: string; color: string };

export function resolveStatus(
  order: EnrichedOrder,
  bol: EnrichedBOL | undefined,
): OrderStatus {
  if (bol) return { label: "Shipped", color: "var(--green)" };
  if (order.status === "entered") return { label: "Open", color: "var(--amber)" };
  return { label: order.status, color: "var(--text-muted)" };
}

// First BOL for a given order wins — callers decide precedence by ordering the input.
export function bolsByOrderId(bols: EnrichedBOL[]): Map<number, EnrichedBOL> {
  const map = new Map<number, EnrichedBOL>();
  for (const b of bols) {
    const orderId = b.packRecord.order.id;
    if (!map.has(orderId)) map.set(orderId, b);
  }
  return map;
}
