"use server";

import { redirect } from "next/navigation";
import {
  createPriceViewSession,
  destroyPriceViewSession,
  verifyPriceViewPassword,
} from "@/lib/priceAccess";

function returnPath(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "");
  if (value.startsWith("/exhibitions/") && !value.includes("?") && !value.includes("\\") && !value.startsWith("//")) {
    return value;
  }
  return "/exhibitions";
}

export async function loginToViewPrices(formData: FormData) {
  const back = returnPath(formData.get("returnTo"));
  const password = String(formData.get("password") ?? "");
  if (!(await verifyPriceViewPassword(password))) redirect(`${back}?prices=1`);
  await createPriceViewSession();
  redirect(back);
}

export async function logoutPriceView(formData: FormData) {
  await destroyPriceViewSession();
  redirect(returnPath(formData.get("returnTo")));
}
