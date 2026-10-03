class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (what) => new HttpError(404, `${what} not found`);

/** Build the `meta` block returned alongside paginated lists. */
function pageMeta(total, page, limit) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { HttpError, notFound, pageMeta };
