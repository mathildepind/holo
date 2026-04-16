import { getEnrichedBOLs } from "@/lib/mock-data";
import BOLClient from "./BOLClient";

export default function BOLPage() {
  const bols = getEnrichedBOLs();
  return <BOLClient bols={bols} />;
}
