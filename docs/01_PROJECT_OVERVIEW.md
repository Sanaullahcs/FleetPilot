# K-12 Student Transportation Management System (MVP)

## Project Summary

A professional, operationally-strong platform for managing K-12 student transportation with a mixed fleet of buses and vans. Positioned between lightweight tools and expensive enterprise systems. The platform serves **dispatchers, drivers, parents, schools, and contractors** through both a responsive web portal and a dedicated mobile app.

**Previous System:** Base44-built solution (operational for current year)  
**Launch Target:** Mid-August rollout, end-of-August operational  
**Positioning:** Mid-market — more powerful than small tools, more affordable than Traversa, BusPlanner, or Verifone.

**Competitive Landscape Reviewed:**
| Platform | Gap We Fill |
|----------|-------------|
| CSTMN | They lack integrated billing & contractor management |
| Transportation Plus | Enterprise pricing; we offer similar ops at fraction of cost |
| HopSkipDrive | On-demand focused; we do tiered routes + on-demand combined |
| EverDriven | SPED-centric; we serve regular ed, midday, and SPED uniformly |

---

## Business Context

### Fleet & Operations
- **Fleet Type:** Mixed (buses + vans + minivans + wheelchair vans)
- **Route Types:**
  - Tiered AM Routes (morning pickups → schools)
  - Tiered PM Routes (afternoon dismissals)
  - Midday Routes (midday shuttles, RTC transfers)
  - On-Demand Trips (special requests, field trips)
- **Service Days:** Monday–Friday (with some routes Mon–Thu only)
- **Billing:** Per-mile, per-hour, and per-trip rates for contractors; district billing summaries

### Key Stakeholders & Platform Access

| Stakeholder | Web Portal (Next.js) | Mobile App (React Native) | Primary Use |
|-------------|---------------------|---------------------------|-------------|
| **Super Admin** | Full system access | Not needed | Organization setup, user management, billing oversight, role configuration |
| **Admin / Dispatcher** | Full dashboard | Not needed | Route planning, assignments, billing, reports |
| **Drivers (Employee)** | View schedule, history, profile | Daily manifest, GPS, events | Complete runs, report delays, mark stops |
| **Drivers (Contractors)** | View available runs, earnings, docs | Accept runs, manifest, GPS | Same as employee drivers + earnings tracking |
| **Parents / Guardians** | Track child, view route, notifications | Real-time tracking, alerts | Child safety, ETAs, delay notifications |
| **School Staff** | View route schedules, delay alerts | Optional (notifications only) | Coordinate with transportation |
| **On-Demand Riders** | Request form, tracking | Request form, tracking | Community transportation requests |

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | Laravel 11 (PHP 8.3) | Rapid development, robust ORM, built-in auth, queues |
| **Web Frontend** | Next.js 14 (App Router) | SSR for SEO/public pages, API routes, unified codebase |
| **Mobile App** | React Native (Expo) | One codebase for iOS + Android, native feel, push notifications |
| **Database** | PostgreSQL 16 + PostGIS | JSON support, geospatial routing, ACID compliance |
| **Queue** | Redis + Laravel Horizon | Background jobs, notifications, GPS sync |
| **Maps** | Google Maps Platform | Route optimization, distance matrix, directions API |
| **SMS** | Twilio | Reliable US delivery |
| **Email** | Amazon SES | Cost-effective |
| **Hosting** | Hetzner Cloud / DigitalOcean | Scalable VPS infrastructure |
| **File Storage** | AWS S3 | Documents, photos, reports |
| **Push Notifications** | Firebase Cloud Messaging | Cross-platform push |
| **Route Optimization** | Google OR-Tools (Python microservice) | Solves VRP for stop sequencing |

---

## MVP Scope (Phase 1) — UPDATED

###  IN SCOPE

| Feature | Priority | Description |
|---------|----------|-------------|
| **Dispatch Dashboard** | P0 | Web-based, desktop-first, tablet-friendly route management |
| **Routing Tools** | P0 | AM, PM, midday routes with drag-and-drop stop editor |
| **Route Optimization** | P0 | Auto-optimize stop sequences for efficiency (Google OR-Tools) |
| **On-Demand Requests** | P0 | Public web form + mobile app; dispatcher approval workflow |
| **Driver Web Portal** | P0 | Schedule, history, earnings, document uploads |
| **Driver Mobile App** | P0 | Native manifest, GPS tracking, offline mode, push notifications |
| **Parent Web Portal** | P0 | Child tracking, route view, notification preferences |
| **Parent Mobile App** | P0 | Real-time ETAs, delay alerts, pickup/dropoff confirmations |
| **Billing & Invoicing** | P0 | Contractor payroll, district billing summaries, rate management |
| **Contractor Sign-Up** | P1 | Registration, document upload, approval workflow |
| **Notifications** | P0 | SMS/email/push for delays, confirmations, reminders |
| **Samsara GPS/Cameras** | P1 | Vehicle tracking, camera snapshots |
| **Diga Talk Radios** | P2 | Radio status display |
| **Reporting** | P1 | On-time performance, mileage, cost efficiency, driver hours |
| **MCP AI Integration** | P2 | AI-assisted dispatch queries and suggestions |

###  OUT OF SCOPE

- Predictive analytics
- Multilingual support
- Complex compliance dashboards (DOE reporting)
- Two-way SIS integration (manual CSV import for MVP)
- NEMT-specific workflows (future Phase 3)

---

## Multi-Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Laravel 11 API                         │
│                  REST + WebSocket + MCP                     │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16  │  Redis  │  S3  │  Queue Workers          │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
    ┌────┴────┐       ┌────┴────┐         ┌────┴────┐
    ▼         ▼       ▼         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐  ┌──────────────────────┐
│ Next.js│ │ Next.js│ │ React  │  │     React Native     │
│ Web    │ │ Public │ │ Native │  │    Mobile App        │
│ Admin  │ │ Pages  │ │ Driver │  │  (iOS + Android)     │
│Portal  │ │(SEO)   │ │Portal  │  │                      │
└────────┘ └────────┘ └────────┘  │ • Driver Module      │
                                  │ • Parent Module      │
                                  │ • On-Demand Module   │
                                  └──────────────────────┘
```

**Auth Strategy:** JWT tokens shared across web and mobile. Same `users` table, role-based access.

---

## Example Route Data (Reference)

```
Run ID:       E-S613ABEA
Route:        E-613
Distance:     20.29 mi
Duration:     50 min
Days:         Mon–Fri
Schedule:     7:09 AM Garage → 7:27 AM Stop A (Pickup) → 7:45 AM Stop B (Dropoff)

Run ID:       E-S613ABEA-OPT
Route:        E-613 (Optimized)
Distance:     18.15 mi  ← 10% reduction
Duration:     44 min     ← 12% reduction
Optimized:    7:09 AM Garage → 7:24 AM Stop B (Pickup) → 7:42 AM Stop A (Dropoff)
```

---

## Core Workflows

### 1. Daily Dispatch Workflow
```
Dispatcher opens Dashboard → Views today's runs → Auto-optimizes routes
→ Assigns vehicles & drivers → Publishes manifests
→ Drivers receive mobile push notifications → Real-time GPS tracking
→ Parents see live ETAs → Delay alerts triggered automatically
```

### 2. Driver Cross-Platform Workflow
```
Driver opens Mobile App → Views assigned manifest → Starts run
→ Navigates to stops (in-app navigation) → Marks stops complete
→ Reports delays → Ends run → Views earnings in web portal later
```

### 3. Parent Cross-Platform Workflow
```
Parent registers (web or app) → Links children → Views assigned routes
→ Receives push when bus is 5 min away → Gets SMS on delays
→ Confirms pickup/dropoff in app → Views history in web portal
```

### 4. Billing Workflow
```
Runs completed daily → System calculates contractor pay (mile/hour/trip)
→ Generates weekly invoices → Admin reviews & approves
→ Exports to QuickBooks/CSV → Contractor views earnings in portal
```

---

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Route optimization time savings | > 15% distance reduction |
| Dispatcher route creation time | < 5 minutes per run |
| Driver app load time | < 2 seconds |
| Parent app load time | < 2 seconds |
| Delay notification delivery | < 30 seconds from trigger |
| Billing invoice generation | < 1 minute for 50 drivers |
| System uptime | 99.5% |
| App store rating | > 4.2 stars |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Mid-August deadline | 10-week sprint plan; daily standups; MVP feature freeze by week 6 |
| Route optimization complexity | Google OR-Tools microservice; manual override always available |
| Billing accuracy | Daily reconciliation reports; admin approval before invoice send |
| Driver app adoption | In-person training; simple 3-tap flow; offline support |
| Parent onboarding | SMS invite link; simple child code linking; web-first then app |
| Cross-platform sync | Single API + WebSocket; optimistic UI updates |

---

## Future Roadmap (Post-MVP)

### Phase 2 — Fall 2026
- Student RFID/barcode scanning
- Advanced analytics & predictive ETAs
- Payroll integration (Gusto, ADP)
- School district SIS import automation
- AI-powered demand forecasting

### Phase 3 — 2027
- NEMT (Non-Emergency Medical Transportation) module
- Multi-district support
- Compliance reporting (IDEA, McKinney-Vento)
- White-label option for other districts

---

## Document Index

| Document | Purpose |
|----------|---------|
| `01_PROJECT_OVERVIEW.md` | This file — high-level context |
| `02_DATABASE_SCHEMA.md` | Complete entity-relationship design (includes billing) |
| `03_API_SPECIFICATION.md` | REST endpoint documentation |
| `04_MCP_INTEGRATION.md` | Model Context Protocol for AI features |
| `05_FRONTEND_ARCHITECTURE.md` | Next.js web + React Native mobile architecture |
| `06_DEVELOPMENT_ROADMAP.md` | Sprint plan for mid-August launch |
| `07_DEPLOYMENT_GUIDE.md` | Infrastructure, CI/CD, app store publishing |
| `database/schema.sql` | Executable PostgreSQL DDL |
| `database/seed_data.sql` | Sample data |

---

*Document Version: 2.0*  
*Last Updated: 2026-06-05*  
*Prepared for: K-12 Transportation Client*
