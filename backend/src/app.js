const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const statsController = require("./controllers/statsController");

const app = express();

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origins, exposedHeaders: ["Content-Disposition"] }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/stats", statsController.overview);
app.use("/api/industries", require("./routes/industryRoutes"));
app.use("/api/organizations", require("./routes/organizationRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
