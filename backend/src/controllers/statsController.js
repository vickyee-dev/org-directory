const prisma = require("../lib/prisma");

exports.overview = async (req, res) => {
  const [
    organizations,
    activeOrganizations,
    contacts,
    activeContacts,
    industries,
    unassigned,
    recentOrganizations,
    recentContacts,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.contact.count(),
    prisma.contact.count({ where: { isActive: true } }),
    prisma.industry.findMany({
      select: { id: true, name: true, _count: { select: { organizations: true } } },
    }),
    prisma.organization.count({ where: { industryId: null } }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { industry: { select: { id: true, name: true } } },
    }),
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { organization: { select: { id: true, name: true } } },
    }),
  ]);

  const byIndustry = industries
    .map((i) => ({ id: i.id, name: i.name, count: i._count.organizations }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count);
  if (unassigned > 0) byIndustry.push({ id: null, name: "Unassigned", count: unassigned });

  res.json({
    totals: {
      organizations,
      activeOrganizations,
      contacts,
      activeContacts,
      industries: industries.length,
    },
    byIndustry,
    recentOrganizations,
    recentContacts,
  });
};
