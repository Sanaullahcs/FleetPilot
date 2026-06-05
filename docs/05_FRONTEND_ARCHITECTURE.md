# Frontend Architecture

## Overview

A single React 18 application built with Vite, serving **two distinct experiences** from one codebase:

1. **Dispatch Dashboard** – Desktop-first, tablet-optimized. Complex grids, drag-and-drop, maps.
2. **Driver Portal** – Mobile-first PWA. Large buttons, offline-capable manifest, GPS tracking.

Both share the same component library, API client, and state management but render different route trees based on user role.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3+ |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.4+ |
| Styling | Tailwind CSS | 3.4+ |
| UI Components | Headless UI + Radix UI | Latest |
| State Management | Zustand | 4.5+ |
| Data Fetching | TanStack Query (React Query) | 5.x |
| Routing | React Router | 6.23+ |
| Maps | Leaflet + React-Leaflet | Latest |
| Charts | Recharts | 2.x |
| Forms | React Hook Form + Zod | Latest |
| PWA | Vite PWA Plugin | Latest |
| Notifications | OneSignal (web push) | Latest |

---

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json              # PWA manifest
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Root component, role-based routing
│   ├── index.css                  # Tailwind directives + custom CSS
│   │
│   ├── api/                       # API client layer
│   │   ├── client.ts              # Axios instance with interceptors
│   │   ├── auth.ts                # Auth endpoints
│   │   ├── routes.ts              # Route endpoints
│   │   ├── runs.ts                # Run endpoints
│   │   ├── driver.ts              # Driver portal endpoints
│   │   ├── onDemand.ts            # On-demand endpoints
│   │   └── notifications.ts       # Notification endpoints
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # Primitive components (Button, Input, Modal)
│   │   ├── layout/                # Shell components (Sidebar, Header, MobileNav)
│   │   ├── maps/                  # Map components (FleetMap, RouteMap, StopMarker)
│   │   └── data-display/          # Tables, cards, charts
│   │
│   ├── features/                  # Domain-specific feature modules
│   │   ├── dispatch/
│   │   │   ├── components/        # RunBoard, AssignmentPanel, StopEditor
│   │   │   ├── hooks/             # useTodayRuns, useFleetStatus
│   │   │   └── pages/             # Dashboard, RouteManager, VehicleManager
│   │   ├── driver/
│   │   │   ├── components/        # ManifestView, StopActionSheet, DelayReporter
│   │   │   ├── hooks/             # useManifest, useGeolocation
│   │   │   └── pages/             # TodayView, RunDetail, Profile
│   │   ├── on-demand/
│   │   │   ├── components/        # RequestForm, RequestCard, TrackingView
│   │   │   └── pages/             # PublicRequest, DispatcherQueue
│   │   └── contractors/
│   │       ├── components/        # ApplicationForm, DocumentUploader
│   │       └── pages/             # Apply, ApplicationStatus
│   │
│   ├── hooks/                     # Global custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   ├── useWebSocket.ts        # Real-time updates
│   │   └── useGeolocation.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── dispatchStore.ts       # Active run selection, filters
│   │   ├── driverStore.ts         # Active manifest, offline queue
│   │   └── uiStore.ts             # Sidebar state, modals, toasts
│   │
│   ├── types/                     # TypeScript interfaces
│   │   ├── auth.ts
│   │   ├── route.ts
│   │   ├── run.ts
│   │   ├── stop.ts
│   │   ├── vehicle.ts
│   │   ├── driver.ts
│   │   └── notification.ts
│   │
│   ├── utils/                     # Helpers
│   │   ├── date.ts                # Timezone-aware formatting
│   │   ├── geo.ts                 # Distance calculations
│   │   ├── validators.ts          # Zod schemas
│   │   └── offline.ts             # Service worker helpers
│   │
│   └── workers/                   # Web Workers
│       └── offlineSync.ts         # Background sync queue
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Routing Strategy

React Router with lazy-loaded route components.

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

function App() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <LoginPage />;

  // Role-based route branching
  if (user.role === 'driver' || user.role === 'contractor') {
    return <DriverApp />;  // Mobile PWA experience
  }

  return <DispatchApp />;  // Desktop/tablet dashboard
}

// Dispatch Routes
function DispatchApp() {
  return (
    <Layout sidebar={<DispatchSidebar />} header={<DispatchHeader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:id" element={<RouteDetailPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/runs/:id" element={<RunDetailPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/on-demand" element={<OnDemandQueuePage />} />
        <Route path="/contractors" element={<ContractorApplicationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

// Driver Routes
function DriverApp() {
  return (
    <MobileLayout nav={<BottomNav />}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/runs/:assignmentId" element={<ManifestPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MobileLayout>
  );
}
```

---

## State Management

### Zustand Stores

**authStore.ts**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**dispatchStore.ts**
```typescript
interface DispatchState {
  selectedDate: Date;
  selectedRunId: string | null;
  filterStatus: RunStatus | 'all';
  filterRoute: string | 'all';
  sidebarOpen: boolean;
  setSelectedDate: (date: Date) => void;
  setSelectedRun: (id: string | null) => void;
  toggleSidebar: () => void;
}
```

**driverStore.ts**
```typescript
interface DriverState {
  activeAssignment: RunAssignment | null;
  manifest: ManifestStop[];
  offlineQueue: OfflineAction[];
  gpsEnabled: boolean;
  setActiveAssignment: (assignment: RunAssignment) => void;
  completeStop: (stopId: string, data: StopCompletionData) => void;
  queueOfflineAction: (action: OfflineAction) => void;
  syncOfflineQueue: () => Promise<void>;
}
```

### TanStack Query (Server State)

```typescript
// Hook for today's runs
export function useTodayRuns(date: string) {
  return useQuery({
    queryKey: ['runs', 'today', date],
    queryFn: () => api.runs.getToday(date),
    staleTime: 30 * 1000,     // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Hook for fleet GPS
export function useFleetStatus() {
  return useQuery({
    queryKey: ['fleet', 'status'],
    queryFn: () => api.vehicles.getFleetStatus(),
    refetchInterval: 15 * 1000, // 15 seconds for live map
  });
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets (dispatch dashboard minimum) |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large monitors |

### Dispatch Dashboard Layout
- **Desktop (lg+):** Fixed left sidebar (280px), main content area, right detail panel (350px)
- **Tablet (md-lg):** Collapsible sidebar, full-width content
- **Mobile (<md):** Not supported for dispatch; redirect to "Use tablet or desktop" message

### Driver Portal Layout
- **Mobile (default):** Bottom tab navigation, full-screen pages, swipe gestures
- **Tablet:** Same layout but with larger touch targets

---

## Component Library

### Primitive Components (`components/ui/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `loading`, `icon` | Primary, secondary, danger, ghost |
| `Input` | `label`, `error`, `icon` | Form inputs with validation states |
| `Select` | `options`, `multiple`, `searchable` | Dropdown with search |
| `Modal` | `isOpen`, `onClose`, `title`, `size` | Overlay dialogs |
| `Toast` | `type`, `message`, `duration` | Notification toasts |
| `Badge` | `variant`, `size` | Status indicators |
| `Avatar` | `src`, `name`, `size` | User/driver avatars |
| `Skeleton` | `lines`, `height` | Loading placeholders |
| `EmptyState` | `icon`, `title`, `action` | No-data views |

### Map Components (`components/maps/`)

| Component | Description |
|-----------|-------------|
| `FleetMap` | Live vehicle positions, route polylines |
| `RouteEditorMap` | Click-to-add stops, drag-to-reorder |
| `StopMarker` | Custom marker with pickup/dropoff/garage icons |
| `RoutePolyline` | Colored lines for active routes |
| `GeofenceLayer` | School zone boundaries |

### Data Display Components

| Component | Description |
|-----------|-------------|
| `RunCard` | Compact run summary for board view |
| `RunBoard` | Kanban-style board (Scheduled → In Progress → Completed) |
| `StopList` | Ordered stop list with times and status |
| `ManifestView` | Driver's scrollable manifest with action buttons |
| `AssignmentPanel` | Drag-drop vehicle/driver assignment |
| `StatusBadge` | `on_time`, `delayed`, `completed`, `cancelled` |
| `DelayAlert` | Inline delay warning with reason input |

---

## PWA Configuration (Driver Portal)

### Vite PWA Plugin Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'K12 Driver Portal',
        short_name: 'DriverApp',
        description: 'Daily manifest and route management',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.transportsystem\.com\/api\/v1\/driver\/today/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'manifest-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /^https:\/\/api\.transportsystem\.com\/api\/v1\/driver\/runs/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'run-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
});
```

### Offline Behavior
1. **Manifest Caching:** Today's manifest cached on load. Readable offline.
2. **Action Queue:** Stop completions, delay reports queued locally if offline.
3. **Background Sync:** Service worker syncs queued actions when connectivity returns.
4. **GPS Logging:** Location tracked and stored locally; batch-uploaded on reconnect.

---

## Real-Time Updates

### WebSocket Connection
```typescript
// hooks/useWebSocket.ts
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://api.transportsystem.com/ws');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message); // Updates TanStack Query cache
    };

    return () => ws.close();
  }, []);

  return { isConnected };
}
```

### Event Types
- `run.started` – Update run status to in_progress
- `run.completed` – Move to completed column
- `run.delayed` – Show delay alert
- `vehicle.location` – Update fleet map marker
- `notification` – Show toast

---

## Forms & Validation

All forms use React Hook Form + Zod.

```typescript
// validators.ts
export const createRunSchema = z.object({
  route_id: z.string().uuid(),
  run_id: z.string().min(3).max(100),
  direction: z.enum(['am_pickup', 'pm_dropoff', 'midday', 'reverse', 'special']),
  effective_date: z.string().date(),
  scheduled_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  scheduled_end_time: z.string().regex(/^\d{2}:\d{2}$/),
  stops: z.array(z.object({
    stop_id: z.string().uuid(),
    sequence_order: z.number().min(1),
    scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
    stop_type: z.enum(['pickup', 'dropoff', 'both', 'garage', 'school'])
  })).min(2)
});
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (Driver) | < 1.5s | Lighthouse |
| Time to Interactive (Driver) | < 3s | Lighthouse |
| Dashboard Load | < 2s | Manual |
| Manifest Load (Cached) | < 500ms | Manual |
| Map Render (50 markers) | < 1s | Manual |
| API Response Cache Hit | < 100ms | Network tab |

---

## Accessibility

- All interactive elements minimum 44x44px touch target (driver portal)
- WCAG 2.1 AA contrast ratios
- Keyboard navigation for dispatch dashboard
- Screen reader labels on all icons
- Reduced motion support (`prefers-reduced-motion`)

---

*Version: 1.0 | Last Updated: 2026-06-05*
