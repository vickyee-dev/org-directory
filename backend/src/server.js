require("dotenv").config();

const app = require("./app");
const prisma = require("./lib/prisma");

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () =>
  console.log(`Org Directory API listening on http://localhost:${PORT}/api`)
);

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
