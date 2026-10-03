const { ZodError } = require("zod");
const { HttpError } = require("../lib/http");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Request validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Our own errors
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }

  // Prisma known errors
  switch (err.code) {
    case "P2002":
      return res.status(409).json({
        error: "A record with the same unique value already exists",
        details: (err.meta?.target || []).map((field) => ({
          field,
          message: "Must be unique",
        })),
      });
    case "P2025":
      return res.status(404).json({ error: "Record not found" });
    case "P2003":
      return res.status(400).json({ error: "Referenced record does not exist" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
