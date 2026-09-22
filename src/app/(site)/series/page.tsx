import { redirect } from "next/navigation";
import { SERIES_INDEX_HREF } from "@/lib/oilColdWaxSeries";

/** Series now live on the Oil and Cold Wax portfolio page. */
export default function SeriesIndexPage() {
  redirect(SERIES_INDEX_HREF);
}
