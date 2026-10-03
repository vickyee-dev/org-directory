// Same-origin by default (Vite proxies /api in dev). Override with VITE_API_URL.
const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    /** { fieldName: "message" } — handy for form validation */
    this.fieldErrors = Object.fromEntries(details.map((d) => [d.field, d.message]));
  }
}

function toQuery(params = {}) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") sp.append(key, value);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request(path, { method = "GET", body, params } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}${toQuery(params)}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(
      payload?.error || `Request failed (${res.status})`,
      res.status,
      payload?.details
    );
  }
  return payload;
}

export const http = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path) => request(path, { method: "PATCH" }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/** Fetch a file from the API and trigger a browser download. */
export async function download(path, params, filename) {
  let res;
  try {
    res = await fetch(`${BASE}${path}${toQuery(params)}`);
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }
  if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status);

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
