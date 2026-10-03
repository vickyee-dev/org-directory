export const fullName = (c) => `${c.firstName} ${c.lastName}`.trim();

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Dates are stored at UTC midnight, so format in UTC to avoid off-by-one days.
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");
export const todayISO = () => new Date().toISOString().slice(0, 10);
