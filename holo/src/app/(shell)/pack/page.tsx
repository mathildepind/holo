import { getOpenOrders } from "@/lib/mock-data";
import PackClient from "./PackClient";

export default function PackPage() {
  const openOrders = getOpenOrders();
  return <PackClient openOrders={openOrders} />;
}
