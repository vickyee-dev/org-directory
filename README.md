# Org Directory

A full-stack **Organization Contact Directory**: keep track of organizations, the industries they belong to, and the people (contacts) you work with at each one.

Originally built as an ICTA Internship Program project (July 2025); this version is a ground-up rebuild that fixes the bugs of the first version and adds validation, search, pagination, a real dashboard and more.

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 4, lucide-react    |
| Backend  | Node.js 20+, Express 5, Zod validation, Helmet, CORS              |
| Database | PostgreSQL via Prisma 6 ORM                                       |

## Features

- **Dashboard** — totals, organizations-by-industry chart, recently added organizations and contacts.
- **Organizations** — search (name / website / tax ID), filter by industry and status, sort, server-side pagination, create / edit / activate / deactivate / delete, CSV export of the current filter. Filters live in the URL, so views are shareable and survive refresh.
- **Organization page** — full details plus its contacts (add, edit, activate, deactivate, delete, export).
- **Contacts** — global list with search (matches "jane doe"), organization and status filters, sorting, pagination, CSV export.
- **Primary contact rule** — only one primary contact per organization; setting a new one automatically demotes the old one (in a database transaction).
- **Industries** — add, inline edit, activate / deactivate, delete (with organization counts).
- **UX** — responsive layout with mobile drawer, toasts, confirmation dialogs, loading / empty / error states, server-side validation errors shown next to fields.
- **Safe CSV export** — proper escaping, UTF-8 BOM for Excel, and protection against spreadsheet formula injection.

## Project structure

```
org-directory/
├── docker-compose.yml        # Local PostgreSQL
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Industry → Organization → Contact
│   │   ├── migrations/       # Original schema + performance indexes
│   │   └── seed.js           # Deterministic demo data
│   └── src/
│       ├── app.js            # Express app (middleware + routes)
│       ├── server.js         # Entry point, graceful shutdown
│       ├── controllers/      # Request handlers
│       ├── routes/           # Route definitions
│       ├── schemas/          # Zod validation schemas
│       ├── middleware/       # Central error handler
│       └── lib/              # Prisma client, CSV writer, HTTP helpers
└── frontend/
    └── src/
        ├── api/              # fetch client + resource modules
        ├── components/       # Layout, UI kit, toasts, dialogs, tables
        ├── hooks/            # useQuery, useDebounce
        └── pages/            # Dashboard, organizations, contacts, industries
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14+ (or Docker, using the included `docker-compose.yml`)

### 1. Database

```bash
docker compose up -d        # starts PostgreSQL on :5432 (skip if you have your own)
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # adjust DATABASE_URL if needed
npx prisma migrate dev      # creates tables and indexes
npm run seed                # optional: demo data (24 organizations, ~100 contacts)
npm run dev                 # API on http://localhost:3001/api
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # app on http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:3001`, so no CORS or URL setup is needed.

> **Upgrading from the first version?** The schema is unchanged apart from added indexes, so your existing database keeps working — just run `npx prisma migrate dev` to apply the new index migration.

## Configuration

| Variable (backend `.env`) | Default                 | Purpose                                      |
| ------------------------- | ----------------------- | -------------------------------------------- |
| `DATABASE_URL`            | —                       | PostgreSQL connection string                 |
| `PORT`                    | `3001`                  | API port                                     |
| `CORS_ORIGIN`             | `http://localhost:5173` | Comma-separated list of allowed origins      |

| Variable (frontend)  | Default | Purpose                                                     |
| -------------------- | ------- | ----------------------------------------------------------- |
| `VITE_API_URL`       | `/api`  | API base URL, for deployments where the API is on another origin |
| `VITE_PROXY_TARGET`  | `http://localhost:3001` | Dev-server proxy target                     |

## API reference

All routes are prefixed with `/api`. Errors are JSON: `{ "error": "message", "details": [{ "field", "message" }] }` (`400` validation, `404` not found, `409` duplicate).

| Method | Path                              | Description                                                        |
| ------ | --------------------------------- | ------------------------------------------------------------------ |
| GET    | `/health`                         | Liveness check                                                     |
| GET    | `/stats`                          | Dashboard totals, per-industry counts, recent records              |
| GET    | `/industries`                     | All industries (with organization count)                           |
| POST   | `/industries`                     | Create `{ name, description? }`                                    |
| PUT    | `/industries/:id`                 | Update                                                             |
| PATCH  | `/industries/:id/toggle`          | Toggle active                                                      |
| DELETE | `/industries/:id`                 | Delete (organizations are kept, industry cleared)                  |
| GET    | `/organizations`                  | List — `search, industryId, status, sortBy, order, page, limit`    |
| GET    | `/organizations/options`          | `{ id, name, isActive }` for dropdowns                             |
| GET    | `/organizations/export/csv`       | CSV, accepts the same filters as the list                          |
| POST   | `/organizations`                  | Create                                                             |
| GET    | `/organizations/:id`              | Details                                                            |
| PUT    | `/organizations/:id`              | Update                                                             |
| PATCH  | `/organizations/:id/toggle`       | Toggle active                                                      |
| DELETE | `/organizations/:id`              | Delete (cascades to contacts)                                      |
| GET    | `/organizations/:id/contacts`     | Contacts of an organization (`status` optional)                    |
| POST   | `/organizations/:id/contacts`     | Create a contact in the organization                               |
| GET    | `/contacts`                       | List — `search, organizationId, status, sortBy, order, page, limit`|
| GET    | `/contacts/export/csv`            | CSV, accepts the same filters as the list                          |
| GET    | `/contacts/:id`                   | Details                                                            |
| PUT    | `/contacts/:id`                   | Update                                                             |
| PATCH  | `/contacts/:id/toggle`            | Toggle active                                                      |
| DELETE | `/contacts/:id`                   | Delete                                                             |

Paginated responses look like `{ "data": [...], "meta": { "total", "page", "limit", "totalPages" } }`.

## Data model

```
Industry 1 ──< Organization 1 ──< Contact
(name unique)   (industryId nullable,   (organizationId required,
                 ON DELETE SET NULL)     ON DELETE CASCADE)
```

## What changed from the first version

Bugs fixed:

- `GET /organizations/export/csv` was unreachable (captured by `/:id`) — static routes now come first.
- `GET /contacts/:id` always returned `501` because a stub overrode the real handler, which broke the contact edit form.
- The edit form sent `PATCH` while the API only accepted `PUT`, and field names didn't match (`phone` vs `officePhoneNumber`), so editing wiped phone numbers.
- Deactivated contacts disappeared from an organization's page with no way to reactivate them.
- Pagination returned `NaN` queries when `page`/`limit` were missing; the list fetched twice on every filter change.
- `/export/csv` ignored filters; the "Dashboard" header title never changed; the dashboard was empty.
- Duplicate controller definitions, a Prisma client created per file, hard-coded `http://localhost:3001` URLs in a dozen places, and unused schema fields (`description`, `logoUrl`, `foundedDate`).

Added: input validation, central error handling, delete actions, organization detail page, dashboard stats, sorting, URL-synced filters, debounced search, toasts and confirmations, responsive layout, indexes, Docker Compose, and richer seed data.

## Production notes

```bash
cd frontend && npm run build        # static files in frontend/dist
cd backend && npx prisma migrate deploy && npm start
```

Serve `frontend/dist` from any static host or reverse proxy and route `/api` to the backend (or set `VITE_API_URL` at build time and add the site to `CORS_ORIGIN`). The app has **no authentication** — put it behind your own auth or network controls before exposing it publicly.

## License

ISC
