const prisma = require("../lib/prisma");
const { notFound } = require("../lib/http");
const { idParam, industryBody } = require("../schemas");

const withCount = { _count: { select: { organizations: true } } };

exports.list = async (req, res) => {
  const industries = await prisma.industry.findMany({
    orderBy: { name: "asc" },
    include: withCount,
  });
  res.json(industries);
};

exports.create = async (req, res) => {
  const data = industryBody.parse(req.body);
  const industry = await prisma.industry.create({ data, include: withCount });
  res.status(201).json(industry);
};

exports.update = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const data = industryBody.parse(req.body);
  const industry = await prisma.industry.update({
    where: { id },
    data,
    include: withCount,
  });
  res.json(industry);
};

exports.toggle = async (req, res) => {
  const id = idParam.parse(req.params.id);
  const current = await prisma.industry.findUnique({ where: { id } });
  if (!current) throw notFound("Industry");

  const industry = await prisma.industry.update({
    where: { id },
    data: { isActive: !current.isActive },
    include: withCount,
  });
  res.json(industry);
};

// Organizations in a deleted industry are kept; their industry becomes empty.
exports.remove = async (req, res) => {
  const id = idParam.parse(req.params.id);
  await prisma.industry.delete({ where: { id } });
  res.status(204).end();
};
