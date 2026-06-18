import { isAllowedSiteImage } from "@/lib/siteImages";

export function readExistingImageField(formData: FormData, fieldName: string): string {
  const raw = String(formData.get(fieldName) ?? "").trim();
  return isAllowedSiteImage(raw) ? raw : "";
}
