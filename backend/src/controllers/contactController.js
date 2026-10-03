const prisma = require("../lib/prisma");
const { notFound, pageMeta } = require("../lib/http");
const { toCsv, sendCsv } = require("../lib/csv");
const { idParam, contactBody, contactQuery } = require("../schemas");

const withOrg = { organization: { select: { id: true, name: true } } };

function buildWhere({ search, organizationId, status }) {
  const where = {};
  if (search) {
    // "Jane Doe" should match firstName=Jane + lastName=Doe, so every word must hit some field.
    where.AND = search.split(/\s+/).map((word) => ({
      OR: [
        { firstName: { contains: word, mode: "insensitive" } },
        { lastName: { contains: word, mode: "insensitive" } },
        { email: { contains: word, mode: "insensitive" } },
        { jobTitle: { contains: word, mode: "insensitive" } },
        { organization: { name: { contains: word, mode: "insensitive" } } },
      ],
    }));
  }
  if (organizationId) where.organizationId = organizationId;
  if (status) where.isActive = status === "active";
  return where;
}

/** Only one primary contact per organization: demote the others in the same transaction. */
async function demoteOtherPrimaries(tx, organizationId, exceptId) {
  await tx.contact.updateMany({
    where: {
      organizationId,
      isPrimaryContact: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isPrimaryContact: false },
  });
}

async function createContactForOrg(organizationId, data) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!org) throw notFound("Organization");

  return prisma.$transaction(async (tx) => {
    if (data.isPrimaryContact) await demoteOtherPrimaries(tx, organizationId);
    return tx.contact.create({ data: { ...data, organizationId }, include: withOrg });
  });
}

exports.createContactForOrg = createContactForOrg;

exports.list = async (req, res) => {
  const q = contactQuery.parse(req.query);
  const where = buildWhere(q);

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: withOrg,
      orderBy: { [q.sortBy]: q.order },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.contact.count({ where }),
  ]);

  res.json({ data, meta: pageMeta(total, q.page, q.limit) });
};

exports.exportCsv = async (req, res) => {
  const q = contactQuery.parse({ ...req.query, page: 1, limit: 100 });
  const contacts = await prisma.contact.findMany({
    where: buildWhere(q),
    include: withOrg,
    orderBy: { [q.sortBy]: q.order },
  });

  const csv = toCsv(contacts, [
    { label: "ID", value: (c) => c.id },
    { label: "First name", value: (c) => c.firstName },
    { label: "Last name", value: (c) => c.lastName },
    { label: "Organization", value: (c) => c.organization?.name },
    { label: "Job title", value: (c) => c.jobTitle },
    { label: "Department", value: (c) => c.department },
    { label: "Email", value: (c) => c.email },
    { label: "Office phone", value: (c) => c.officePhoneNumber },
    { label: "Mobile phone", value: (c) => c.mobilePhoneNumber },
    { label: "Primary contact", value: (c) => (c.isPrimaryContact ? "Yes" : "No") },
    { label: "Status", value: (c) => (c.isActive ? "Active" : "Inactive") },
    { label: "Notes", value: (c) => c.notes },
  ]);
  sendCsv(res, "contacts.csv", csv);
};

exports.get = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const contact = await prisma.contact.findUnique({ where: { id }, include: withOrg });
  if (!contact) throw notFound("Contact");
  res.json(contact);
};

exports.update = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const data = contactBody.parse(req.body);

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) throw notFound("Contact");

  const contact = await prisma.$transaction(async (tx) => {
    if (data.isPrimaryContact) {
      await demoteOtherPrimaries(tx, existing.organizationId, id);
    }
    return tx.contact.update({ where: { id }, data, include: withOrg });
  });
  res.json(contact);
};

exports.toggle = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const current = await prisma.contact.findUnique({ where: { id } });
  if (!current) throw notFound("Contact");

  const contact = await prisma.contact.update({
    where: { id },
    data: { isActive: !current.isActive },
    include: withOrg,
  });
  res.json(contact);
};

exports.remove = async (req, res) => {
  const id = idParam.parse(req.params.id);
  await prisma.contact.delete({ where: { id } });
  res.status(204).end();
};
