/**
 * Creates an SEO-friendly URL slug from a product name and size.
 * This does not change the product's database ID.
 */
export function createProductSlug(
  name: string,
  weight?: string | null,
): string {
  const base = (name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const size = (weight || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

  if (!base) return "";
  if (!size) return base;

  // Avoid repeating a size already included in the name.
  if (base.endsWith(`-${size}`)) return base;

  return `${base}-${size}`;
}
