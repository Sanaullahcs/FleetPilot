# Push Notification Service

## Overview

Cross-platform push notification system using Firebase Cloud Messaging (FCM). Supports both driver and parent mobile applications built with React Native and Expo.

---

## Architecture

```
Laravel Backend
    |
    | Trigger: delay_alert, run_started, stop_completed
    v
SendPushNotification Job (Redis Queue)
    |
    v
FCM HTTP v1 API (Firebase)
    |
    +---> iOS (via APNs)
    +---> Android (via FCM)
```

---

## Device Token Management

### Registration Flow

When a user installs and opens the mobile app:

1. The app requests push notification permission from the operating system
2. Upon approval, Expo SDK retrieves an FCM device token
3. The app sends the token to the backend via POST /auth/devices
4. The backend stores the token in the `app_devices` table, linked to the user

### Token Lifecycle

- Tokens are refreshed periodically by the operating system
- The app re-registers on each launch if the token has changed
- If FCM returns a "Not Found" error, the device is marked inactive
- Inactive tokens are not sent notifications

---

## Notification Delivery

### Job Processing

Push notifications are queued via Laravel's Redis queue system:

1. When a trigger event occurs (delay, stop completion, run start), the system creates a notification record
2. If the notification channel includes "push", the SendPushNotification job is dispatched
3. The job queries all active devices for the recipient user
4. FCM messages are sent to each device token
5. Delivery status is recorded in the notification record

### Message Content

Each push notification contains:

- Title: Short, action-oriented (e.g., "Route Delay", "Bus En Route")
- Body: Human-readable message with key details
- Data payload: Machine-readable fields for deep linking (notification type, related IDs)
- Default sounds for iOS and Android

---

## Notification Types and Triggers

| Type | Trigger | Recipient | Channels |
|------|---------|-----------|----------|
| Delay Alert | Driver reports delay OR GPS detects significant deviation | Parents on affected run | Push, SMS, Email |
| Run Started | Driver taps "Start Run" | Parents on run | Push |
| Stop Completed | Driver marks pickup/dropoff | Parent of specific student | Push |
| On-Demand Confirmed | Dispatcher approves request | Requester | Push, SMS, Email |
| Document Expiry | Daily cron check | Admin, affected driver | Email |
| Emergency Alert | Manual dispatcher action | All parents on run, school | Push, SMS, Email |

---

## React Native Integration

### Permission Request

The app requests notification permission on first launch. If denied, the user can enable later through device settings. The app explains why notifications are needed (child safety, delay alerts).

### Foreground Handling

When the app is open and a notification arrives:
- An in-app banner displays the notification
- Tapping the banner navigates to the relevant screen (tracking, history, etc.)
- The notification does not play a sound if the user is actively using the app

### Background Handling

When the app is closed or in the background:
- The operating system displays the notification in the system tray
- Tapping the notification opens the app and navigates to the relevant screen
- Badge count increments on iOS

### Deep Linking

Notification data payloads include a click action that maps to app screens:

| Action | Screen |
|--------|--------|
| open_tracking | Live tracking map |
| open_history | Ride history list |
| open_manifest | Driver manifest |
| open_earnings | Earnings summary |

---

## Testing

### Expo Push Notification Tool

Developers can send test pushes via command line:

```
npx expo push:send --token "ExponentPushToken[xxxx]" --title "Test" --message "Hello"
```

### FCM Test via cURL

Direct FCM API testing for production tokens:

```
curl -X POST https://fcm.googleapis.com/v1/projects/PROJECT_ID/messages:send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "message": { "token": "DEVICE_TOKEN", "notification": { "title": "Test", "body": "Hello" } } }'
```

---

*Version: 1.0 | FCM HTTP v1 | Expo SDK 51 | Last Updated: June 5, 2026*
