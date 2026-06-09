# Frontend Architecture

## Overview

The platform ships **two frontend codebases** that share one Laravel API, one JWT auth scheme, and one design language:

1. **Web Application — Next.js 14 (App Router)**
   Serves the Dispatch Dashboard, the Driver Web Portal, the Parent Web Portal, and public pages (marketing, on-demand request, contractor application, public tracking).

2. **Mobile Application — React Native (Expo SDK 51)**
   A single Expo codebase that renders the Driver App and the Parent App, branching by user role after login.

> Detailed structure, directory layout, and screen specs live in:
> - `frontend-specs/nextjs_structure.md` — web app
> - `frontend-specs/react_native_structure.md` — mobile app
> - `frontend-specs/driver_mobile_spec.md` — driver app screens
> - `frontend-specs/parent_mobile_spec.md` — parent app screens
>
> This document is the high-level architecture that ties those together. Where details differ, the per-platform spec files are authoritative.

---

## Why Two Codebases (Not One)

| Concern | Decision |
|---------|----------|
| Dispatcher experience | Desktop/tablet, data-dense grids, maps, drag-and-drop → best on web (Next.js) |
| Driver/Parent daily use | Native push, background GPS, offline manifest, app-store presence → best on native (React Native) |
| Driver/Parent web access | Responsive Next.js portals cover schedule, earnings, history, and tracking without requiring the app |
| Shared logic | API client patterns, TypeScript types, Zod validators, and design tokens are kept consistent across both repos |

The mobile app is **not** a PWA wrapper. The web portals are server-rendered Next.js, not a Vite SPA.

---

## Shared Foundations

| Layer | Web (Next.js) | Mobile (React Native) |
|-------|---------------|------------------------|
| Language | TypeScript 5.4+ | TypeScript 5.4+ |
| State (client) | Zustand 4.5+ | Zustand 4.5+ |
| Server state | TanStack Query 5.x | TanStack Query 5.x |
| Forms / validation | React Hook Form + Zod | React Hook Form + Zod |
| Auth | JWT (Axios interceptors, refresh) | JWT (expo-secure-store, refresh) |
| Maps | Google Maps (`@vis.gl/react-google-maps`) | `react-native-maps` (Google provider) |
| Push | FCM (web push) | Expo Notifications → FCM / APNs |
| Real-time | WebSocket (Laravel Reverb / Pusher) | WebSocket (Laravel Reverb / Pusher) |

**Design system:** A shared token set (colors, typography, spacing) is defined once and mirrored into Tailwind config (web) and a theme constants module (mobile) so both surfaces stay visually aligned.

---

## Web Application (Next.js 14)

### Experiences and Route Groups

| Group | URLs | Audience | Layout |
|-------|------|----------|--------|
| `(dashboard)` | `/`, `/routes`, `/runs`, `/billing`, `/vehicles`, `/drivers`, `/on-demand`, `/contractors`, `/reports`, `/settings` | Admin, Dispatcher | Sidebar + header + detail panel |
| `(driver)` | `/driver/...` | Driver, Contractor | Responsive, simplified shell |
| `(parent)` | `/parent/...` | Parent | Clean, family-friendly shell |
| `(public)` | `/`, `/request-ride`, `/track/[token]`, `/drive-with-us` | Public (no auth) | Marketing header/footer |

### Rendering Strategy

- **Public pages:** statically generated / SSR for SEO and fast first paint.
- **Authenticated app pages:** client-side data fetching via TanStack Query against the Laravel API; JWT attached by Axios interceptors.
- **Dispatch is desktop/tablet first.** Below `md` (768px) the dashboard shows a "use a tablet or desktop" notice; the driver and parent web portals remain fully responsive.

> Full directory tree, component inventory, store shapes, and auth flow: `frontend-specs/nextjs_structure.md`.

---

## Mobile Application (React Native + Expo)

### Experiences

- **Driver App:** today's runs, manifest, one-tap stop actions, delay reporting, offline queue, background GPS, earnings.
- **Parent App:** linked children, live tracking, ETAs, delay alerts, pickup/dropoff confirmations, ride history, on-demand requests.

The root layout gates on auth and routes the user into the `(driver)` or `(parent)` segment based on role. Both ship in **one binary** (`com.fleetpilot.app`).

### Offline & Background Behavior (Driver)

1. **Manifest caching** — today's manifest is cached locally (AsyncStorage / WatermelonDB) on load and remains readable offline.
2. **Action queue** — stop completions, delay reports, and run start/end are queued locally with a stable client-generated UUID and synced when connectivity returns.
3. **Optimistic UI** — actions reflect immediately; server confirmation reconciles later.
4. **Background location** — while a run is active, location is sampled (~10s) and batch-uploaded (~60s); offline samples upload on reconnect.

> Full directory tree, navigation, `app.json`, and sync queue schema: `frontend-specs/react_native_structure.md`.

---

## Real-Time Updates (Both Platforms)

A WebSocket connection keeps dispatch boards, fleet maps, and parent tracking live. Messages update the TanStack Query cache.

### Event Types

| Event | Effect |
|-------|--------|
| `run.started` | Move run to In Progress |
| `run.completed` | Move run to Completed |
| `run.delayed` | Surface delay alert |
| `vehicle.location` | Update fleet/tracking map marker |
| `notification` | Toast / push |

---

## Accessibility & Performance

- Touch targets ≥ 44×44px on driver/parent surfaces.
- WCAG 2.1 AA contrast; keyboard navigation on the dispatch dashboard; screen-reader labels on icons; `prefers-reduced-motion` respected.

| Metric | Target |
|--------|--------|
| Dispatch dashboard load | < 2s |
| Cached mobile manifest load | < 500ms |
| Fleet map render (50 markers) | < 1s |
| Delay notification delivery | < 30s from trigger |

---

*Version: 2.0 | Web: Next.js 14 · Mobile: React Native (Expo SDK 51) | Aligned with frontend-specs/*
