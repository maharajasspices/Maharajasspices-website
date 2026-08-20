/**
 * Utility functions for generating and parsing recipe slugs
 */

export const createRecipeSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
};

export const getRecipeIdFromSlug = (slug: string): string | null => {
  // If it's already a UUID, return it
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slug)) {
    return slug;
  }
  return null;
};

export const getSlugFromId = (title: string, id?: string): string => {
  const slug = createRecipeSlug(title);
  // If we have a database ID, append it to make the URL unique
  return id ? `${slug}-${id.slice(0, 8)}` : slug;
};