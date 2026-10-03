const { z } = require("zod");

/** Treat "" as "not provided" (query strings & form posts send empty strings). */
const emptyToUndefined = (v) => (v === "" || v === null ? undefined : v);

const id = z.coerce.number().int().positive();

const pagination = z.object({
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(100).default(10)
  ),
});

const status = z.preprocess(
  emptyToUndefined,
  z.enum(["active", "inactive"]).optional()
);

const order = z.preprocess(emptyToUndefined, z.enum(["asc", "desc"]).default("desc"));

const optionalId = z.preprocess(emptyToUndefined, id.optional());

const search = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(100).optional()
);

/** Optional free-text field: trims, and stores "" as NULL. */
const text = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

/** Optional URL. Accepts "example.com" and normalises it to "https://example.com". */
const url = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => {
    if (v === null) return true;
    try {
      const u = new URL(v);
      return u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Must be a valid URL");

/** Optional email. */
const email = z
  .string()
  .trim()
  .max(255)
  .nullish()
  .transform((v) => v || null)
  .refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    "Must be a valid email address"
  );

/** Optional date, accepts "YYYY-MM-DD" or ISO strings, stores as a Date (or NULL). */
const date = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), "Must be a valid date")
  .refine((v) => v === null || v <= new Date(), "Date cannot be in the future");

module.exports = {
  z,
  id,
  pagination,
  status,
  order,
  optionalId,
  search,
  text,
  url,
  email,
  date,
  emptyToUndefined,
};
