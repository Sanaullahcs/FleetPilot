# Development Roadmap

## Timeline Overview

**Total Duration:** 10 weeks  
**Kickoff:** June 9, 2026 (Sprint 1)  
**Launch Target:** Mid-August 2026 (Sprint 10, Aug 11–15)  
**Operational Target:** End of August 2026 (~two weeks after launch)

---

## Sprint Breakdown

### Sprint 1: Foundation (Week 1) — June 9–13

| Task | Hours | Deliverable |
|------|-------|-------------|
| Laravel 11 project scaffold + Docker | 5 | Backend repo with Docker Compose |
| PostgreSQL + PostGIS setup | 2 | Migration system, spatial extensions |
| Database migrations (all tables) | 8 | All 33 tables from `database/schema.sql` |
| JWT authentication API | 5 | Login, refresh, register-parent, logout |
| Granular RBAC (roles, permissions, user_roles tables) | 4 | Spatie-style permission system with Super Admin hierarchy |
| Next.js 14 project scaffold | 4 | Web frontend repo with Tailwind, shadcn/ui |
| Expo React Native scaffold | 4 | Mobile repo with navigation shell |
| Shared design system (colors, typography) | 3 | Constants shared between web and mobile |
| **Sprint Total** | **34 hrs** | |

**Milestone:** Developer can log in as admin, driver, parent. Database seeded. Both web and mobile projects build successfully.

---

### Sprint 2: Master Data (Week 2) — June 16–20

| Task | Hours | Deliverable |
|------|-------|-------------|
| Schools CRUD API + UI | 4 | Full school management |
| Stops CRUD API + UI (with Google Maps geocoding) | 5 | Stop library with address autocomplete and map picker |
| Vehicles CRUD API + UI | 4 | Fleet management, document uploads |
| Drivers CRUD API + UI | 5 | Driver profiles, contractor flag, docs |
| Parent registration API + UI | 4 | Parent self-registration, verification |
| Student CRUD + parent linking | 5 | Students, parent_students junction |
| CSV import for stops/schools/students | 3 | Bulk upload tool |
| Document expiry alert job | 3 | Background cron + dashboard widget |
| **Sprint Total** | **33 hrs** | |

**Milestone:** Dispatcher can manage all master data. Parents can register and link children.

---

### Sprint 3: Routes & Optimization (Week 3) — June 23–27

| Task | Hours | Deliverable |
|------|-------|-------------|
| Routes CRUD API + UI | 4 | Route definitions with service days |
| Runs CRUD API + UI | 5 | Run creation with stop sequencing |
| Drag-and-drop stop reordering | 4 | Interactive route builder |
| Run publishing workflow | 2 | Draft → Published → Archived |
| **Route Optimization microservice** | 8 | Python + OR-Tools Docker container |
| Optimize API endpoint | 3 | `/runs/{id}/optimize` |
| Apply/reject optimization UI | 3 | Compare original vs. optimized |
| Route duplication / cloning | 2 | Clone for new season |
| Conflict detection | 3 | Double-booked driver/vehicle validation |
| **Sprint Total** | **34 hrs** | |

**Milestone:** Dispatcher can build routes, auto-optimize, and see >10% distance savings on test data.

---

### Sprint 4: Assignments & Driver Web (Week 4) — June 30–July 4

| Task | Hours | Deliverable |
|------|-------|-------------|
| Daily assignment API + UI | 5 | Assign vehicle + driver for date |
| Assignment calendar view | 4 | Weekly calendar |
| Run events API | 4 | Start, stop arrival, completion, delay |
| Driver web portal — dashboard | 4 | Today's runs, schedule, history |
| Driver web portal — earnings view | 3 | Pay summary, assignment history |
| Driver web portal — profile & docs | 3 | Document upload, profile edit |
| WebSocket real-time setup | 3 | Laravel Reverb or Pusher |
| GPS snapshot ingestion | 4 | Samsara webhook + manual entry |
| **Sprint Total** | **30 hrs** | |

**Milestone:** Driver can log into web portal, view schedule, see earnings. Dispatcher can assign daily.

---

### Sprint 5: Driver Mobile App (Week 5) — July 7–11

| Task | Hours | Deliverable |
|------|-------|-------------|
| Driver app auth & navigation | 4 | Login, tab navigator, profile |
| Today's runs screen | 4 | Assigned runs list |
| Manifest screen | 6 | Scrollable stops, one-tap actions |
| Start / Complete run | 3 | GPS-tagged events |
| Stop arrival / completion | 4 | Bottom sheet action UI |
| Delay reporting | 3 | Quick-reason picker |
| Offline mode + sync queue | 5 | AsyncStorage queue, background sync |
| Push notification setup (FCM) | 4 | Device token registration, push handlers |
| In-app navigation (Google Maps) | 3 | Navigate to next stop |
| **Sprint Total** | **36 hrs** | |

**Milestone:** Driver app ready for internal testing. Offline mode functional. Push notifications working.

---

### Sprint 6: Parent Platform (Week 6) — July 14–18

| Task | Hours | Deliverable |
|------|-------|-------------|
| Parent web portal — dashboard | 4 | Children overview, quick actions |
| Parent web portal — tracking | 5 | Live map with bus location |
| Parent web portal — history | 3 | Past ridership |
| Parent mobile app — auth & home | 4 | Register, login, children list |
| Parent mobile app — tracking | 6 | Real-time map, ETA, route timeline |
| Parent mobile app — notifications | 4 | Push preferences, notification history |
| Child linking flow (web + mobile) | 4 | Verification code, relationship |
| Notification templates (push) | 3 | Push titles/bodies for all templates |
| **Sprint Total** | **33 hrs** | |

**Milestone:** Parent can track child in real-time on web and mobile. Push notifications deliver in <30s.

---

### Sprint 7: On-Demand & Billing (Week 7) — July 21–25

| Task | Hours | Deliverable |
|------|-------|-------------|
| Public on-demand request form (web) | 3 | Mobile-friendly, no auth |
| On-demand request form (mobile) | 3 | React Native form |
| Dispatcher on-demand queue | 4 | Approval/rejection UI |
| On-demand → Run conversion | 3 | Auto-create run from approved request |
| Rate cards CRUD | 4 | Billing rates management |
| Auto-generate billing items | 5 | From completed assignments |
| Invoice generation & PDF export | 5 | wkhtmltopdf / DomPDF |
| Contractor earnings dashboard | 4 | Web + mobile earnings views |
| Payment status tracking | 3 | Paid, overdue, sent |
| **Sprint Total** | **34 hrs** | |

**Milestone:** Public can request trips. Billing auto-generates from runs. Invoices exportable as PDF.

---

### Sprint 8: Notifications & Integrations (Week 8) — July 28–Aug 1

| Task | Hours | Deliverable |
|------|-------|-------------|
| Twilio SMS integration | 4 | SMS dispatch, template rendering |
| Amazon SES email integration | 3 | Email dispatch |
| FCM push notification service | 4 | Cross-platform push |
| Samsara webhook receiver | 4 | GPS ingestion, vehicle location |
| Samsara camera snapshot | 2 | Display in vehicle detail |
| Diga Talk API hooks | 3 | Radio status display |
| Notification templates CRUD | 3 | Dispatcher-editable copy |
| Delay alert auto-trigger | 3 | GPS-based or manual → auto-notify |
| MCP server scaffold + tools | 4 | Read tools + approval-gated write tools |
| **Sprint Total** | **30 hrs** | |

**Milestone:** All notification channels working. GPS tracking live. MCP server responding.

---

### Sprint 9: Testing & Polish (Week 9) — Aug 4–8

| Task | Hours | Deliverable |
|------|-------|-------------|
| End-to-end flow testing | 6 | Full dispatcher → driver → parent cycle |
| Mobile device testing (iOS + Android) | 5 | Multiple screen sizes, OS versions |
| Offline mode stress testing | 3 | Airplane mode → reconnect → sync |
| Billing accuracy validation | 3 | Reconcile against manual calculations |
| Route optimization validation | 3 | Compare OR-Tools vs. manual routes |
| API load testing | 3 | 50 concurrent drivers, 5 dispatchers |
| Security audit | 3 | JWT, XSS, SQL injection |
| Bug fixes & UI polish | 8 | Refinements, edge cases |
| **Sprint Total** | **34 hrs** | |

**Milestone:** System passes QA. No critical bugs. Optimization validated. Billing reconciled.

---

### Sprint 10: Deployment & Launch (Week 10) — Aug 11–15

| Task | Hours | Deliverable |
|------|-------|-------------|
| Production VPS provisioning | 3 | Hetzner/DigitalOcean, Ubuntu 24.04 |
| Docker Compose production setup | 4 | App, Nginx, PostgreSQL, Redis, OR-Tools |
| SSL + DNS configuration | 2 | Let's Encrypt, domain pointing |
| Next.js production build & deploy | 3 | Vercel or VPS static export |
| Expo EAS build (iOS + Android) | 4 | Production app binaries |
| App Store submission preparation | 3 | Screenshots, descriptions, review notes |
| TestFlight / Internal testing | 2 | Invite client testers |
| Database migration + seed | 2 | Production data setup |
| Monitoring & backups | 3 | Uptime Kuma, daily S3 backups |
| Client training session | 3 | 2-hour video call + recorded demo |
| Final documentation handover | 3 | Admin guide, driver guide, parent guide |
| **Sprint Total** | **32 hrs** | |

**Milestone:** System live. Apps submitted to stores. Client trained. Backups running.

---

## Total Effort Summary

| Sprint | Dev Hours | QA Hours |
|--------|-----------|----------|
| 1 | 34 | 0 |
| 2 | 33 | 0 |
| 3 | 34 | 0 |
| 4 | 30 | 0 |
| 5 | 36 | 0 |
| 6 | 33 | 0 |
| 7 | 34 | 0 |
| 8 | 30 | 0 |
| 9 | 34 | 12 |
| 10 | 32 | 0 |
| **Total** | **330** | **12** |

---

## Weekly Client Checkpoints

| Week | Checkpoint | Demo |
|------|-----------|------|
| 1 | End of Sprint 1 | Login across web + mobile |
| 2 | End of Sprint 2 | Master data management, parent registration |
| 3 | End of Sprint 3 | Route building + optimization demo |
| 4 | End of Sprint 4 | Driver web portal, daily assignments |
| 5 | End of Sprint 5 | Driver mobile app (internal TestFlight) |
| 6 | End of Sprint 6 | Parent tracking (web + mobile) |
| 7 | End of Sprint 7 | On-demand form + billing invoice generation |
| 8 | End of Sprint 8 | SMS/push notifications, live GPS map |
| 9 | End of Sprint 9 | Full system UAT link |
| 10 | End of Sprint 10 | Production go-live, app store submission |

---


---

*Version: 2.0 | Timeline: 10 Weeks | Target: Mid-August 2026*
