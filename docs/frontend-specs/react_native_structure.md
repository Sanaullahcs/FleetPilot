# React Native Mobile Application Structure

## Overview

A single React Native codebase using Expo SDK 51 serves two distinct mobile applications:

1. **Driver App** — Daily manifest, GPS tracking, offline mode, earnings
2. **Parent App** — Real-time child tracking, notifications, ride history

Both apps share core infrastructure (API client, authentication, maps, notifications) while maintaining separate navigation structures and feature modules.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native 0.74+ | Cross-platform mobile development |
| Expo SDK | Expo 51 | Build tooling, OTA updates, native modules |
| Language | TypeScript 5.4+ | Type safety |
| Navigation | React Navigation 6.x | Stack, tab, and drawer navigators |
| State Management | Zustand 4.5+ | Global state |
| Data Fetching | TanStack Query 5.x | Server state caching |
| Maps | react-native-maps | Google Maps integration |
| Push Notifications | Expo Notifications | FCM and APNs handling |
| Offline Storage | AsyncStorage + WatermelonDB | Local data persistence |
| Background Location | expo-location | GPS tracking while app is backgrounded |
| Auth Storage | expo-secure-store | Encrypted JWT storage |

---

## Directory Structure

```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   │
│   ├── (driver)/
│   │   ├── index.tsx                           # Driver home / today
│   │   ├── manifest/
│   │   │   └── [assignmentId].tsx              # Active manifest
│   │   ├── schedule.tsx                        # Weekly calendar
│   │   ├── earnings.tsx                        # Pay summary
│   │   ├── history.tsx                         # Past runs
│   │   ├── profile.tsx                         # Account and docs
│   │   └── _layout.tsx                         # Driver tab navigator
│   │
│   ├── (parent)/
│   │   ├── index.tsx                           # Parent home
│   │   ├── children.tsx                        # Linked children list
│   │   ├── tracking/
│   │   │   └── [studentId].tsx                 # Live tracking
│   │   ├── history.tsx                         # Ride history
│   │   ├── notifications.tsx                   # Alert history
│   │   ├── profile.tsx                         # Account settings
│   │   └── _layout.tsx                         # Parent tab navigator
│   │
│   ├── (on-demand)/
│   │   ├── request.tsx                         # Submit request
│   │   ├── status/
│   │   │   └── [token].tsx                     # Track request
│   │   └── _layout.tsx
│   │
│   ├── _layout.tsx                             # Root layout with auth gate
│   └── +not-found.tsx
│
├── src/
│   ├── api/
│   │   ├── client.ts                           # Axios instance
│   │   ├── auth.ts
│   │   ├── driver.ts
│   │   ├── parent.ts
│   │   └── onDemand.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── ListItem.tsx
│   │   │
│   │   ├── driver/
│   │   │   ├── ManifestStopItem.tsx            # Stop row in manifest
│   │   │   ├── StopActionSheet.tsx             # Bottom sheet for actions
│   │   │   ├── DelayReporter.tsx               # Delay input modal
│   │   │   └── EarningsCard.tsx                # Earnings summary card
│   │   │
│   │   ├── parent/
│   │   │   ├── ChildCard.tsx                   # Child info card
│   │   │   ├── TrackingMap.tsx                 # Live map component
│   │   │   ├── RouteTimeline.tsx               # Stop timeline view
│   │   │   └── NotificationItem.tsx            # Alert list row
│   │   │
│   │   └── maps/
│   │       ├── MapView.tsx
│   │       ├── VehicleMarker.tsx
│   │       └── RoutePolyline.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocationTracking.ts              # Background GPS
│   │   ├── usePushNotifications.ts             # FCM registration
│   │   ├── useOfflineSync.ts                   # Queue management
│   │   └── useManifest.ts                      # Manifest state
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── driverStore.ts                      # Active manifest, offline queue
│   │   ├── parentStore.ts                      # Selected child, tracking data
│   │   └── syncStore.ts                        # Pending actions, sync status
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── driver.ts
│   │   ├── parent.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── date.ts                             # Timezone formatting
│   │   ├── geo.ts                              # Distance calculations
│   │   ├── notifications.ts                    # Push payload handlers
│   │   └── offline.ts                          # Queue helpers
│   │
│   └── services/
│       ├── locationService.ts                  # GPS tracking logic
│       ├── syncService.ts                      # Background sync
│       └── notificationService.ts              # FCM integration
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── driver-icon.png
│   │   └── parent-icon.png
│   └── fonts/
│       └── Inter-Regular.ttf
│
├── app.json                                    # Expo configuration
├── eas.json                                    # EAS Build configuration
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

---

## App.json Configuration

```json
{
  "expo": {
    "name": "FleetPilot",
    "slug": "fleetpilot",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.fleetpilot.app",
      "infoPlist": {
        "NSLocationAlwaysUsageDescription": "This app uses your location to track route progress and provide accurate ETAs to parents.",
        "NSCameraUsageDescription": "This app uses the camera to document vehicle condition or incidents.",
        "UIBackgroundModes": ["location"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.fleetpilot.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "POST_NOTIFICATIONS"
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      "expo-location",
      "expo-notifications"
    ],
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

---

## Navigation Structure

### Driver Tab Navigator

| Tab | Screen | Icon |
|-----|--------|------|
| Today | Today's assigned runs | Home |
| Schedule | Weekly calendar view | Calendar |
| Earnings | Pay summary and history | DollarSign |
| Profile | Account, documents, settings | User |

### Parent Tab Navigator

| Tab | Screen | Icon |
|-----|--------|------|
| Home | Children overview and quick actions | Home |
| Tracking | Live map and ETA | MapPin |
| Notifications | Alerts and messages | Bell |
| Profile | Account and preferences | User |

### Auth Stack Navigator

- Login screen (shared)
- Registration screen (role selection: driver or parent)
- Forgot password screen

---

## Offline Support

### Strategy

The driver app must function without cellular coverage because many routes pass through rural areas:

1. **Manifest Caching:** When the driver opens the app with connectivity, today's manifest is cached locally via AsyncStorage
2. **Action Queue:** Stop completions, delay reports, and other actions are stored in a local queue when offline
3. **Background Sync:** Expo BackgroundFetch attempts to sync the queue every 15 minutes when connectivity returns
4. **Optimistic UI:** The user interface updates immediately upon action, even before server confirmation

### Sync Queue Structure

```typescript
interface SyncAction {
  id: string;                    // UUID generated locally
  type: 'stop_complete' | 'delay_report' | 'run_start' | 'run_end';
  payload: object;               // Action-specific data
  timestamp: string;             // ISO 8601
  retry_count: number;           // Incremented on failure
  status: 'pending' | 'syncing' | 'failed';
}
```

---

## Background Location Tracking

### Driver App

When a run is active, the app tracks location in the background:

1. Driver taps "Start Run"
2. App requests location permission (always allow)
3. Location updates every 10 seconds while the run is active
4. Updates are batched and sent to the server every 60 seconds
5. If offline, locations are stored locally and uploaded on reconnect
6. Driver taps "End Run" to stop tracking

### Parent App

The parent app does not track location. It receives vehicle location updates from the server via WebSocket or push notification.

---

## App Store Publishing

### Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| Development | Local development | Expo Go |
| Preview | Internal testing | TestFlight (iOS), APK (Android) |
| Production | App Store / Play Store | App Store, Google Play |

### Submission Checklist

**iOS:**
- Apple Developer Program enrollment
- App Store Connect app record
- App icons in all required sizes
- Screenshots for iPhone and iPad
- Privacy policy URL
- Required permission usage descriptions in Info.plist

**Android:**
- Google Play Developer account
- App bundle (AAB) generated via EAS
- Store listing with description, screenshots, feature graphic
- Content rating questionnaire
- Privacy policy URL

---

*Version: 1.0 | React Native 0.74 | Expo SDK 51 | Last Updated: June 5, 2026*
