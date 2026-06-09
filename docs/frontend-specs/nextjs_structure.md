# Next.js Web Application Structure

## Overview

The web application serves three distinct user experiences from a single Next.js 14 codebase using the App Router:

1. **Dispatch Dashboard** — Desktop-first, tablet-optimized. Complex grids, maps, calendars, billing.
2. **Driver Web Portal** — Responsive. Schedule, history, earnings, document management.
3. **Parent Web Portal** — Responsive. Child tracking, route view, notification preferences.

Public pages (marketing, on-demand request, contractor application, tracking) use static export for SEO.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Server-side rendering, API routes, file-based routing |
| Language | TypeScript 5.4+ | Type safety across the codebase |
| Styling | Tailwind CSS 3.4+ | Utility-first CSS |
| UI Components | shadcn/ui + Radix UI | Accessible, customizable primitives |
| State Management | Zustand 4.5+ | Lightweight global state |
| Data Fetching | TanStack Query 5.x | Server state caching, synchronization |
| Forms | React Hook Form + Zod | Type-safe form validation |
| Maps | Google Maps React | Fleet tracking, route visualization |
| Charts | Recharts 2.x | Billing dashboards, performance reports |
| Auth | JWT via Axios interceptors | Token management, automatic refresh |

---

## Directory Structure

```
web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── page.tsx                          # Dispatcher home
│   │   ├── routes/
│   │   │   ├── page.tsx                      # Route list
│   │   │   ├── [id]/page.tsx                 # Route detail
│   │   │   └── [id]/edit/page.tsx            # Route editor
│   │   ├── runs/
│   │   │   ├── page.tsx                      # Run list
│   │   │   └── [id]/page.tsx                 # Run detail
│   │   ├── vehicles/page.tsx
│   │   ├── drivers/page.tsx
│   │   ├── on-demand/page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx                      # Billing dashboard
│   │   │   ├── rates/page.tsx                # Rate cards
│   │   │   ├── invoices/page.tsx             # Invoice list
│   │   │   └── [id]/page.tsx                 # Invoice detail
│   │   ├── contractors/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx                        # Dashboard shell
│   │
│   ├── (driver)/                             # Driver web portal
│   │   ├── dashboard/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── earnings/page.tsx
│   │   ├── history/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (parent)/                             # Parent web portal
│   │   ├── dashboard/page.tsx
│   │   ├── children/page.tsx
│   │   ├── tracking/page.tsx
│   │   ├── history/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (public)/
│   │   ├── page.tsx                          # Landing / marketing
│   │   ├── request-ride/page.tsx             # On-demand public form
│   │   ├── track/[token]/page.tsx            # Public tracking
│   │   ├── drive-with-us/page.tsx            # Contractor application
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   └── proxy/                            # Optional API proxy
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                                   # shadcn/ui primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Dialog.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   └── Card.tsx
│   │
│   ├── layout/
│   │   ├── DashboardShell.tsx                # Sidebar + header wrapper
│   │   ├── Sidebar.tsx                       # Navigation sidebar
│   │   ├── MobileNav.tsx                     # Mobile hamburger menu
│   │   ├── Header.tsx                        # Top bar with search, alerts
│   │   └── Breadcrumb.tsx
│   │
│   ├── maps/
│   │   ├── FleetMap.tsx                      # Live vehicle positions
│   │   ├── RouteMap.tsx                      # Route editor map
│   │   ├── TrackingMap.tsx                   # Parent tracking map
│   │   └── StopMarker.tsx
│   │
│   ├── billing/
│   │   ├── BillingDashboard.tsx
│   │   ├── InvoiceTable.tsx
│   │   ├── RateCardForm.tsx
│   │   └── EarningsChart.tsx
│   │
│   ├── routes/
│   │   ├── RunBoard.tsx                      # Kanban-style run board
│   │   ├── StopEditor.tsx                    # Drag-drop stop list
│   │   ├── RouteOptimizer.tsx                # Original vs. optimized comparison
│   │   └── AssignmentCalendar.tsx            # Weekly assignment grid
│   │
│   └── shared/
│       ├── DataTable.tsx                     # Reusable sortable table
│       ├── StatusBadge.tsx                   # Run status indicators
│       ├── EmptyState.tsx
│       ├── LoadingSkeleton.tsx
│       └── PageHeader.tsx
│
├── lib/
│   ├── api.ts                                # Axios instance with interceptors
│   ├── auth.ts                               # Auth helpers, token refresh
│   ├── utils.ts
│   └── validators.ts                         # Zod schemas
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts                       # Real-time updates
│   └── useGeolocation.ts
│
├── stores/
│   ├── authStore.ts
│   ├── dispatchStore.ts                      # Active run selection, filters
│   └── billingStore.ts                       # Billing period, invoice filters
│
├── types/
│   ├── auth.ts
│   ├── route.ts
│   ├── billing.ts
│   └── index.ts
│
├── public/
│   └── images/
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Route Groups

Next.js App Router groups enable separate layouts for different user types without URL prefixes:

### Dispatch Group
- URL: `/`, `/routes`, `/runs`, `/billing`, etc.
- Layout: Full dashboard shell with sidebar, header, and right panel
- Auth: Admin or dispatcher role required

### Driver Group
- URL: `/driver/dashboard`, `/driver/schedule`, `/driver/earnings`
- Layout: Simplified header, mobile-responsive
- Auth: Driver or contractor role required

### Parent Group
- URL: `/parent/dashboard`, `/parent/tracking`, `/parent/history`
- Layout: Clean, family-friendly design
- Auth: Parent role required

### Public Group
- URL: `/`, `/request-ride`, `/track/abc123`, `/drive-with-us`
- Layout: Marketing-style header/footer
- Auth: None required

---

## Authentication Flow

1. User visits any protected page
2. Middleware checks for valid JWT in cookies or localStorage
3. If missing or expired, redirect to `/login`
4. After successful login, store JWT and redirect to role-appropriate dashboard
5. Axios interceptors automatically attach tokens to API requests
6. Token refresh happens silently before expiration

---

## Responsive Design

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Small | Under 640px | Not supported for dispatch; driver/parent layouts adapt |
| Medium | 640px to 1023px | Collapsible sidebar, single column content |
| Large | 1024px to 1279px | Fixed sidebar, main content area |
| Extra Large | 1280px and above | Sidebar, content, and right detail panel |

---

## State Management

### Auth Store
- User profile, role, token
- Login, logout, refresh methods
- Permission checks (isAdmin, isDispatcher, isDriver, isParent)

### Dispatch Store
- Selected date, selected run, filter criteria
- Sidebar open/closed state
- Active tab in multi-panel views

### Billing Store
- Selected billing period
- Selected driver for earnings view
- Invoice status filter

---

## Performance Considerations

- Static export for public pages (marketing, tracking)
- Server-side rendering for SEO-critical pages
- Client-side data fetching for dashboard content via TanStack Query
- Image optimization via Next.js Image component
- Code splitting by route group

---

*Version: 1.0 | Next.js 14 App Router | Last Updated: June 5, 2026*
