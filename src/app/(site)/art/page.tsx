import { redirect } from "next/navigation";

/** Legacy portfolio index — portfolio overview now lives at /medium. */
export default function ArtIndexPage() {
  redirect("/medium");
}
