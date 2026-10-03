import { http, download } from "./client";

export { ApiError } from "./client";

export const statsApi = {
  overview: () => http.get("/stats"),
};

export const industriesApi = {
  list: () => http.get("/industries"),
  create: (data) => http.post("/industries", data),
  update: (id, data) => http.put(`/industries/${id}`, data),
  toggle: (id) => http.patch(`/industries/${id}/toggle`),
  remove: (id) => http.delete(`/industries/${id}`),
};

export const organizationsApi = {
  list: (params) => http.get("/organizations", params),
  options: () => http.get("/organizations/options"),
  get: (id) => http.get(`/organizations/${id}`),
  create: (data) => http.post("/organizations", data),
  update: (id, data) => http.put(`/organizations/${id}`, data),
  toggle: (id) => http.patch(`/organizations/${id}/toggle`),
  remove: (id) => http.delete(`/organizations/${id}`),
  contacts: (id, params) => http.get(`/organizations/${id}/contacts`, params),
  createContact: (id, data) => http.post(`/organizations/${id}/contacts`, data),
  exportCsv: (params) => download("/organizations/export/csv", params, "organizations.csv"),
};

export const contactsApi = {
  list: (params) => http.get("/contacts", params),
  get: (id) => http.get(`/contacts/${id}`),
  update: (id, data) => http.put(`/contacts/${id}`, data),
  toggle: (id) => http.patch(`/contacts/${id}/toggle`),
  remove: (id) => http.delete(`/contacts/${id}`),
  exportCsv: (params) => download("/contacts/export/csv", params, "contacts.csv"),
};
