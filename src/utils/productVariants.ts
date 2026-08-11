export type NormalizedProductVariant = {
  weight: string;
  price: number;
};

/**
 * Normalizes variants coming from Supabase.
 * Supports legacy keys (`size`) produced by older dashboard edits.
 */
export function normalizeProductVariants(input: unknown): NormalizedProductVariant[] {
  if (!input) return [];

  let parsed: unknown = input;

  try {
    if (typeof input === "string") {
      parsed = JSON.parse(input);
    }
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return (parsed as any[])
    .map((v) => {
      const weight = String(v?.weight ?? v?.size ?? v?.label ?? "").trim();
      const price = Number(v?.price ?? 0);
      return { weight, price };
    })
    .filter((v) => v.weight && Number.isFinite(v.price) && v.price > 0);
}
