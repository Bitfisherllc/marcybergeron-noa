"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { setPriceGuidePassword } from "@/lib/priceAccess";

export async function savePriceGuidePassword(formData: FormData) {
  await requireAdminSession();
  const password = String(formData.get("password") ?? "").trim();
  if (!password || password.length > 80) redirect("/admin/exhibitions?error=password");
  await setPriceGuidePassword(password);
  revalidatePath("/exhibitions");
  revalidatePath("/admin/exhibitions");
  redirect("/admin/exhibitions?saved=password");
}
