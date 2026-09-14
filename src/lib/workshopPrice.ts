export const DEFAULT_WORKSHOP_PRICE = 350;

export function workshopPrice(amount: number | null | undefined): number {
  return amount == null ? DEFAULT_WORKSHOP_PRICE : amount;
}

export function formatWorkshopPrice(amount: number | null | undefined): string {
  const n = workshopPrice(amount);
  if (n === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function parseWorkshopPrice(raw: unknown): number {
  const text = String(raw ?? "").trim();
  if (!text) return DEFAULT_WORKSHOP_PRICE;
  const n = Number.parseInt(text, 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_WORKSHOP_PRICE;
  return n;
}
