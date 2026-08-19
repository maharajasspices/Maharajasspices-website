// Centralized list of admin emails that bypass dashboard password protection
export const ADMIN_EMAILS = [
  "bradley@maharajasspices.co.za",
  "zulaigah.benjamin@maharajasspices.co.za",
] as const;

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
};