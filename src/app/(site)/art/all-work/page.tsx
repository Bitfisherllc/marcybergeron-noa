import { redirect } from "next/navigation";

/** Legacy all-work view — portfolio is organized by gallery at /medium. */
export default function AllWorkPage() {
  redirect("/medium");
}
