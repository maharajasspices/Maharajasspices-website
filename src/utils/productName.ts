// Convert to title case (capitalize first letter of each word)
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function cleanProductName(name: string): string {
  let s = (name || "").replace(/\s+/g, " ").trim();
  if (!s) return s;

  // Check if it looks like a variant list (contains comma-separated size/price pairs)
  if (s.includes(",")) {
    const variantRegex = /(\d+(?:\.\d+)?\s*(?:kg|g|ml|l))\s*(?:[-:]\s*)?(?:R\s*)?(\d+(?:\.\d{1,2})?)/gi;
    const matches = Array.from(s.matchAll(variantRegex));

    // Require 2+ size/price pairs to treat it as a variant list
    if (matches.length >= 2) {
      const first = matches[0];
      const idx = typeof first.index === "number" ? first.index : -1;
      if (idx > 0) {
        s = s
          .slice(0, idx)
          .trim()
          .replace(/[\s\-|:]+$/g, "")
          .trim();
      }
    }
  }

  // Remove any trailing size/price info for single variants too
  // e.g., "Product Name - 50g R8.99" -> "Product Name"
  s = s.replace(/\s*[-–]\s*\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\s*(?:R\s*)?\d+(?:\.\d{1,2})?\s*$/i, '').trim();

  // Apply title case for proper capitalization
  return toTitleCase(s);
}
