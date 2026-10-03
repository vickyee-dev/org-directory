const prisma = require("../lib/prisma");
const { notFound, pageMeta } = require("../lib/http");
const { toCsv, sendCsv } = require("../lib/csv");
const {
  idParam,
  organizationBody,
  organizationQuery,
  orgContactsQuery,
  contactBody,
} = require("../schemas");
const { createContactForOrg } = require("./contactController");

function buildWhere({ search, industryId, status }) {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { website: { contains: search, mode: "insensitive" } },
      { taxId: { contains: search, mode: "insensitive" } },
    ];
  }
  if (industryId) where.industryId = industryId;
  if (status) where.isActive = status === "active";
  return where;
}

const listInclude = {
  industry: { select: { id: true, name: true } },
  _count: { select: { contacts: true } },
};

exports.list = async (req, res) => {
  const q = organizationQuery.parse(req.query);
  const where = buildWhere(q);

  const [data, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: listInclude,
      orderBy: { [q.sortBy]: q.order },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.organization.count({ where }),
  ]);

  res.json({ data, meta: pageMeta(total, q.page, q.limit) });
};

// Lightweight list for <select> inputs.
exports.options = async (req, res) => {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" },
  });
  res.json(orgs);
};

exports.exportCsv = async (req, res) => {
  const q = organizationQuery.parse({ ...req.query, page: 1, limit: 100 });
  const orgs = await prisma.organization.findMany({
    where: buildWhere(q),
    include: { industry: true, _count: { select: { contacts: true } } },
    orderBy: { [q.sortBy]: q.order },
  });

  const csv = toCsv(orgs, [
    { label: "ID", value: (o) => o.id },
    { label: "Name", value: (o) => o.name },
    { label: "Industry", value: (o) => o.industry?.name },
    { label: "Website", value: (o) => o.website },
    { label: "Tax ID", value: (o) => o.taxId },
    { label: "Founded", value: (o) => o.foundedDate?.toISOString().slice(0, 10) },
    { label: "Contacts", value: (o) => o._count.contacts },
    { label: "Status", value: (o) => (o.isActive ? "Active" : "Inactive") },
    { label: "Created", value: (o) => o.createdAt },
  ]);
  sendCsv(res, "organizations.csv", csv);
};

exports.get = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      industry: { select: { id: true, name: true } },
      _count: { select: { contacts: true } },
    },
  });
  if (!org) throw notFound("Organization");
  res.json(org);
};

exports.create = async (req, res) => {
  const data = organizationBody.parse(req.body);
  const org = await prisma.organization.create({ data, include: listInclude });
  res.status(201).json(org);
};

exports.update = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const data = organizationBody.parse(req.body);
  const org = await prisma.organization.update({
    where: { id },
    data,
    include: listInclude,
  });
  res.json(org);
};

exports.toggle = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const current = await prisma.organization.findUnique({ where: { id } });
  if (!current) throw notFound("Organization");

  const org = await prisma.organization.update({
    where: { id },
    data: { isActive: !current.isActive },
    include: listInclude,
  });
  res.json(org);
};

// Contacts are removed with their organization (ON DELETE CASCADE).
exports.remove = async (req, res) => {
  const id = idParam.parse(req.params.id);
  await prisma.organization.delete({ where: { id } });
  res.status(204).end();
};

// ---- Nested: /organizations/:id/contacts ----

exports.listContacts = async (req, res) => {
  const orgId = idParam.parse(req.params.id);
  const { status } = orgContactsQuery.parse(req.query);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) throw notFound("Organization");

  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: orgId,
      ...(status ? { isActive: status === "active" } : {}),
    },
    orderBy: [{ isPrimaryContact: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(contacts);
};

exports.createContact = async (req, res) => {
  const orgId = idParam.parse(req.params.id);
  const data = contactBody.parse(req.body);
  const contact = await createContactForOrg(orgId, data);
  res.status(201).json(contact);
};
