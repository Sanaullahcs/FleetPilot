# FleetPilot

**K-12 Student Transportation Management Platform** — a purpose-built system for managing a mixed fleet (buses, vans, minivans, wheelchair vans) across tiered AM/PM/midday routes and on-demand trips. It serves dispatchers, drivers, parents, schools, and contractors through a web portal and native mobile apps.

> **FleetPilot** is the product name. "K-12 Student Transportation Management Platform" is the descriptive subtitle. The demo/seed dataset uses a fictional customer district, "Metro K-12 Transportation," to illustrate how FleetPilot serves a district.

---

## Architecture at a Glance

| Layer | Technology |
|-------|-----------|
| Backend API | Laravel 11 (PHP 8.3), REST + MCP + webhooks |
| Database | PostgreSQL 16 + PostGIS |
| Queue / cache | Redis + Laravel Horizon |
| Web app | Next.js 14 (App Router) — dispatch dashboard + driver/parent portals + public pages |
| Mobile app | React Native (Expo SDK 51) — single binary, driver + parent by role |
| Route optimization | Python + Google OR-Tools microservice (Flask) |
| Auth | JWT (`tymon/jwt-auth`) shared across web + mobile |
| Authorization | Custom org-scoped RBAC (`roles` / `permissions` / `user_roles`) |
| Integrations | Google Maps, Twilio (SMS), Amazon SES (email), Firebase (push), Samsara (GPS) |
| Hosting | Hetzner Cloud VPS + Docker Compose, Cloudflare in front |

See `docs/01_PROJECT_OVERVIEW.md` for the full picture.

---

## Documentation Index

### Core docs (`docs/`)
| Document | Purpose |
|----------|---------|
| `00_EXECUTIVE_SUMMARY.md` | Business case, stakeholders, positioning |
| `01_PROJECT_OVERVIEW.md` | Scope, stack, workflows, success metrics |
| `02_DATABASE_SCHEMA.md` | Human-readable schema reference (33 tables) |
| `03_API_SPECIFICATION.md` | REST endpoints (see also `OPENAPI_SPEC.yaml`) |
| `04_MCP_INTEGRATION.md` | AI / Model Context Protocol server |
| `05_FRONTEND_ARCHITECTURE.md` | Web + mobile architecture overview |
| `06_DEVELOPMENT_ROADMAP.md` | 10-week sprint plan |
| `07_DEPLOYMENT_GUIDE.md` | Infra, Docker, CI/CD, app-store publishing |
| `OPENAPI_SPEC.yaml` | Machine-readable API contract |

### Backend specs (`backend-specs/`)
`laravel_structure.md` · `rbac_permissions.md` · `billing_service.md` · `route_optimization.md` · `google_maps_integration.md` · `push_notifications.md` · `notification_jobs.md` · `integration_webhooks.md`

### Frontend specs (`frontend-specs/`)
`nextjs_structure.md` · `react_native_structure.md` · `driver_mobile_spec.md` · `parent_mobile_spec.md`

### Planning (`planning/`)
`entity_diagram.md` · `wireframes.md` · `notification_templates.md`

### Database (`database/`)
`schema.sql` (authoritative DDL, 33 tables) · `seed_data.sql` (sample data)

---

## Source of Truth

When documents disagree, defer to:
- **Schema:** `database/schema.sql` (over `docs/02_DATABASE_SCHEMA.md`)
- **API:** `docs/OPENAPI_SPEC.yaml` (over the prose in `docs/03_API_SPECIFICATION.md`)
- **Frontend structure:** the per-platform files in `frontend-specs/` (over the overview in `docs/05_FRONTEND_ARCHITECTURE.md`)

---

## Repository Layout

```
FleetPilot/
├── backend/        # Laravel 11 API (PHP) — scaffolded, /api/v1 prefix
├── web/            # Next.js 14 web app (TypeScript + Tailwind) — scaffolded
├── mobile/         # Expo / React Native app (TypeScript) — scaffolded
├── optimization/   # Python OR-Tools microservice (Flask) — implemented
├── docs/           # Project documentation
├── backend-specs/  # Backend design specs
├── frontend-specs/ # Frontend design specs
├── planning/       # ERD, wireframes, templates
├── database/       # schema.sql + seed_data.sql (authoritative DDL)
└── docker-compose.yml   # Local dev: PostGIS + Redis + OR-Tools
```

---

## Getting Started

Prerequisites: **WAMP** (MySQL 8 + PHP 8.2+), Node.js 20+, Composer. Docker is optional and not required for local dev.

### 1. Database (MySQL via WAMP)

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS fleetpilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend API (Laravel)

```bash
cd backend
cp .env.example .env          # MySQL: DB_DATABASE=fleetpilot, DB_USERNAME=root
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve              # http://127.0.0.1:8000  →  GET /api/v1/health
```

Demo login: `admin@fleetpilot.test` / `password`

### 3. Web app (Next.js)

```bash
cd web
npm install
npm run dev                   # http://localhost:3000/login
```

Sign in at **http://localhost:3000/login** (or `/login/` — both work).

### 4. Mobile app (Expo)

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your machine's LAN IP when testing on a physical device.

> **Note:** npm and Composer caches on this machine may use `D:\fp-cache` if the C: drive is low on space.

---

## Status

**Sprint 1 foundation in progress.** MySQL migrations, JWT auth, RBAC, demo seed data, and the dispatch web login + dashboard modules are implemented. See `docs/06_DEVELOPMENT_ROADMAP.md`.
