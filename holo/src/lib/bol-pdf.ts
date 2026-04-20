import type { EnrichedBOL } from "@/lib/types";

export async function generateBOLPDF(bol: EnrichedBOL) {
  const { jsPDF } = await import("jspdf");
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
}
