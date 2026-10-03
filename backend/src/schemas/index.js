const c = require("./common");
const { z } = c;

const idParam = c.id;

// ---------- Industries ----------
const industryBody = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: c.text(500),
  isActive: z.boolean().optional(),
});

// ---------- Organizations ----------
const organizationBody = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: c.text(2000),
  industryId: z.preprocess(c.emptyToUndefined, c.id.nullish()).transform((v) => v ?? null),
  website: c.url,
  logoUrl: c.url,
  foundedDate: c.date,
  taxId: c.text(50),
});

const organizationQuery = c.pagination.extend({
  search: c.search,
  industryId: c.optionalId,
  status: c.status,
  sortBy: z.preprocess(
    c.emptyToUndefined,
    z.enum(["name", "createdAt", "foundedDate"]).default("createdAt")
  ),
  order: c.order,
});

// ---------- Contacts ----------
const contactBody = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  jobTitle: c.text(150),
  department: c.text(150),
  email: c.email,
  officePhoneNumber: c.text(40),
  mobilePhoneNumber: c.text(40),
  notes: c.text(2000),
  isPrimaryContact: z.boolean().optional().default(false),
});

const contactQuery = c.pagination.extend({
  search: c.search,
  organizationId: c.optionalId,
  status: c.status,
  sortBy: z.preprocess(
    c.emptyToUndefined,
    z.enum(["createdAt", "firstName", "lastName"]).default("createdAt")
  ),
  order: c.order,
});

// Contacts nested under an organization (everything, or filtered by status)
const orgContactsQuery = z.object({ status: c.status });

module.exports = {
  idParam,
  industryBody,
  organizationBody,
  organizationQuery,
  contactBody,
  contactQuery,
  orgContactsQuery,
};
