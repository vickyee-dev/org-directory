/**
 * Seeds demo data: industries, organizations and contacts.
 *
 *   npm run seed         # only seeds when the database has no organizations
 *   npm run seed:reset   # wipes industries/organizations/contacts first
 *
 * All names are fictional and the data is deterministic (no randomness),
 * so every run produces the same directory.
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

const industries = [
  ["Technology", "Software, IT services and digital products"],
  ["Finance", "Banking, insurance, investment and fintech"],
  ["Healthcare", "Hospitals, clinics, pharma and medical suppliers"],
  ["Education", "Schools, universities and training providers"],
  ["Retail", "Shops, supermarkets and e-commerce"],
  ["Manufacturing", "Factories, assembly and industrial production"],
  ["Agriculture", "Farming, agribusiness and food processing"],
  ["Logistics", "Freight, courier and supply-chain services"],
  ["Energy", "Power generation, solar and utilities"],
  ["Hospitality", "Hotels, restaurants and tourism"],
];

// [name, industry, website slug, founded year, active]
const organizations = [
  ["Savannah Systems", "Technology", "savannahsystems", 2012, true],
  ["Mara Digital Labs", "Technology", "maradigital", 2018, true],
  ["Nimbus Cloud Works", "Technology", "nimbuscloud", 2016, true],
  ["Kilimo Capital", "Finance", "kilimocapital", 2005, true],
  ["Harambee Savings Co-op", "Finance", "harambeesavings", 1998, true],
  ["Pesa Bridge Payments", "Finance", "pesabridge", 2020, true],
  ["Baobab Health Partners", "Healthcare", "baobabhealth", 2009, true],
  ["Tumaini Medical Supplies", "Healthcare", "tumainimedical", 2003, false],
  ["Lakeview Clinics", "Healthcare", "lakeviewclinics", 2014, true],
  ["Rift Valley Academy Trust", "Education", "riftacademy", 1995, true],
  ["BrightPath Training Institute", "Education", "brightpath", 2011, true],
  ["Duka Mkuu Retail Group", "Retail", "dukamkuu", 2001, true],
  ["Urban Threads", "Retail", "urbanthreads", 2019, true],
  ["Kijani Fresh Market", "Retail", "kijanifresh", 2017, false],
  ["Ironbridge Fabrication", "Manufacturing", "ironbridge", 1989, true],
  ["Polymer Plus Industries", "Manufacturing", "polymerplus", 2007, true],
  ["Shamba Fresh Produce", "Agriculture", "shambafresh", 2010, true],
  ["Highland Tea Growers", "Agriculture", "highlandtea", 1975, true],
  ["Swift Haul Logistics", "Logistics", "swifthaul", 2013, true],
  ["Coastline Freight Services", "Logistics", "coastlinefreight", 2006, true],
  ["SunGrid Energy", "Energy", "sungrid", 2015, true],
  ["Geothermal Futures Ltd", "Energy", "geofutures", 2008, true],
  ["Acacia Lodges & Safaris", "Hospitality", "acacialodges", 2000, true],
  ["Bahari Beach Resorts", "Hospitality", "baharibeach", 1996, false],
];

const firstNames = [
  "Amina", "Brian", "Cynthia", "David", "Esther", "Felix", "Grace", "Hassan",
  "Irene", "James", "Faith", "Kevin", "Lucy", "Mohamed", "Nancy", "Omondi",
  "Purity", "Quincy", "Rose", "Samuel", "Tabitha", "Victor", "Wanjiru", "Zawadi",
];
const lastNames = [
  "Mwangi", "Otieno", "Kamau", "Wanjiku", "Njoroge", "Achieng", "Kiptoo", "Mutua",
  "Abdi", "Chebet", "Odhiambo", "Karanja", "Wafula", "Naliaka", "Kariuki", "Ndungu",
];
const roles = [
  ["Chief Executive Officer", "Executive"],
  ["Operations Manager", "Operations"],
  ["Finance Manager", "Finance"],
  ["HR Business Partner", "Human Resources"],
  ["Head of Sales", "Sales"],
  ["Procurement Officer", "Procurement"],
  ["IT Manager", "IT"],
  ["Marketing Lead", "Marketing"],
];
const notes = [
  "Prefers email for first contact.",
  "Best reached in the mornings.",
  "Decision maker for new vendor engagements.",
  "Attended the annual partners' forum.",
  null,
  null,
];

const pad = (n, len) => String(n).padStart(len, "0");

async function main() {
  const existing = await prisma.organization.count();
  if (existing > 0 && !force) {
    console.log(`Database already has ${existing} organizations — skipping seed. Use "npm run seed:reset" to start over.`);
    return;
  }

  if (force) {
    await prisma.contact.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.industry.deleteMany();
  }

  await prisma.industry.createMany({
    data: industries.map(([name, description]) => ({ name, description })),
    skipDuplicates: true,
  });
  const industryByName = new Map(
    (await prisma.industry.findMany()).map((i) => [i.name, i.id])
  );

  let contactCount = 0;
  for (const [index, [name, industry, slug, year, isActive]] of organizations.entries()) {
    const org = await prisma.organization.create({
      data: {
        name,
        description: `${name} is a ${industry.toLowerCase()} organization based in Kenya.`,
        industryId: industryByName.get(industry),
        website: `https://www.${slug}.example.com`,
        taxId: `P${pad(51000000 + index * 7919, 9)}Z`,
        foundedDate: new Date(Date.UTC(year, index % 12, 1 + (index % 27))),
        isActive,
      },
    });

    const howMany = 3 + (index % 4); // 3–6 contacts per organization
    const contacts = Array.from({ length: howMany }, (_, i) => {
      const seed = index * 7 + i * 5;
      const first = firstNames[seed % firstNames.length];
      const last = lastNames[(seed * 3 + i) % lastNames.length];
      const [jobTitle, department] = roles[(index + i) % roles.length];
      return {
        organizationId: org.id,
        firstName: first,
        lastName: last,
        jobTitle,
        department,
        email: `${first}.${last}@${slug}.example.com`.toLowerCase(),
        officePhoneNumber: `+254 20 ${pad(2000000 + seed * 4321, 7)}`,
        mobilePhoneNumber: `+254 7${pad((seed * 1117 + index * 31) % 100, 2)} ${pad((seed * 913 + 100) % 1000, 3)} ${pad((seed * 577 + 7) % 1000, 3)}`,
        notes: notes[(index + i) % notes.length],
        isPrimaryContact: i === 0,
        isActive: !(i === howMany - 1 && index % 5 === 0), // a few inactive contacts
      };
    });
    await prisma.contact.createMany({ data: contacts });
    contactCount += contacts.length;
  }

  console.log(
    `Seeded ${industries.length} industries, ${organizations.length} organizations and ${contactCount} contacts.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
