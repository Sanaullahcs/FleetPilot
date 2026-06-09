# Driver Mobile Application Specification

## Overview

The Driver Mobile App is a React Native application that enables drivers to manage their daily routes, complete stops, report delays, and track earnings. It is designed for one-handed operation while standing at a bus stop, with large touch targets and minimal cognitive load.

---

## User Stories

### Daily Workflow
- As a driver, I want to see my assigned runs for today so I can plan my day
- As a driver, I want to start a run with one tap so the system knows I am on the road
- As a driver, I want to mark each stop as arrived and completed so parents are notified
- As a driver, I want to report delays quickly so parents know when to expect us
- As a driver, I want to view my earnings so I know how much I have made
- As a driver, I want to upload documents so my credentials stay current

### Offline Scenarios
- As a driver, I want to complete stops even without cell service so my route is not interrupted
- As a driver, I want my completed actions to sync automatically when I regain connectivity

---

## Screens

### 1. Today Screen (Home)

**Purpose:** Show all runs assigned to the driver for today.

**Layout:**
- Header: Date, greeting, notification bell
- Run cards: Each card shows run ID, route code, direction (AM/PM/Midday), vehicle number, scheduled times, number of stops
- Status indicator: Scheduled (gray), In Progress (blue), Completed (green), Delayed (orange)
- Action button: "Start Run" for scheduled runs

**Interactions:**
- Tap card to open manifest screen
- Tap "Start Run" to begin (requires confirmation)

---

### 2. Manifest Screen

**Purpose:** Guide the driver through each stop in sequence.

**Layout:**
- Header: Run ID, current status, elapsed time
- Stop list: Scrollable list of all stops in sequence
- Stop row: Sequence number, stop name, scheduled time, stop type (pickup/dropoff/garage), passenger count
- Status indicator per stop: Pending (empty), Arrived (half circle), Completed (full circle)
- Current stop: Highlighted and pinned to top

**Actions:**
- "Mark Arrived": Records GPS location and timestamp
- "Mark Complete": Records completion, passenger count confirmation, optional notes
- "Report Delay": Quick-action button for immediate delay reporting
- "End Run": Available after final stop

**Bottom Sheet (Stop Completion):**
- Passenger count: Confirm number picked up or dropped off
- Wheelchair indicator: Toggle if wheelchair user present
- Notes: Free text for special instructions or incidents
- Photo: Optional camera capture for documentation
- "Complete Stop" button

---

### 3. Schedule Screen

**Purpose:** View upcoming assignments beyond today.

**Layout:**
- Weekly calendar view
- Day selector: Tap a day to see assigned runs
- Run list for selected day
- Empty state: "No runs scheduled" with contact dispatch option

---

### 4. Earnings Screen

**Purpose:** Show pay summary and historical earnings.

**Layout:**
- Summary card: Current period earnings, total assignments, average per run
- Period selector: This week, last week, this month, custom range
- Earnings list: Date, run ID, type (mileage/hourly/trip), amount
- Invoice status: Pending, invoiced, paid

---

### 5. History Screen

**Purpose:** Review past runs and their details.

**Layout:**
- Searchable list of completed runs
- Filter by date range
- Run detail: Stops completed, actual times, delays reported, distance driven

---

### 6. Profile Screen

**Purpose:** Manage account and documents.

**Layout:**
- Profile header: Name, photo, employee/contractor badge
- Contact info: Phone, email (editable)
- Documents section: List of uploaded documents with expiry dates
  - Driver's license
  - Medical certificate
  - Insurance
  - Background check
- Upload button: Add new document or replace expired one
- Settings: Notification preferences, app version, logout

---

## Key Interactions

### Starting a Run
1. Driver taps "Start Run" on Today screen
2. App requests confirmation: "Start E-S613ABEA?"
3. On confirm, app records GPS location and timestamp
4. App sends event to server (or queues if offline)
5. Manifest screen opens automatically
6. Push notification sent to parents: "Bus is on the way"

### Completing a Stop
1. Driver arrives at stop and taps "Mark Arrived"
2. GPS location recorded
3. Driver opens door, assists students
4. Driver taps "Mark Complete"
5. Bottom sheet opens for confirmation
6. Driver confirms passenger count, adds notes if needed
7. Tap "Complete Stop"
8. System records completion and sends parent notification
9. App highlights next stop

### Reporting a Delay
1. Driver taps "Report Delay" button (available anytime during active run)
2. Modal opens with preset delay options: 5, 10, 15, 20, 30 minutes
3. Driver selects delay duration
4. Driver selects or types reason: Traffic, Mechanical, Weather, Other
5. Tap "Send Alert"
6. System immediately notifies all parents on the route via push and SMS

---

## Offline Behavior

### Offline Indicator
- A persistent banner shows "Offline Mode" when connectivity is lost
- Color: Amber/orange to indicate caution but not error

### Allowed Actions Offline
- Start run
- Mark stop arrived
- Mark stop complete
- Report delay
- End run

### Sync Behavior
- When connectivity returns, a "Syncing..." indicator appears
- Actions upload in chronological order
- If a conflict occurs (e.g., server already has a different status), the driver's local action takes precedence and an alert is shown

---

## GPS and Background Tracking

### Permission Request
On first run start, the app explains:
"We use your location to track route progress and share accurate arrival times with parents. Your location is only shared while you are on an active run."

### Tracking Behavior
- Location updates every 10 seconds during active runs
- Updates are batched and sent every 60 seconds
- If app is backgrounded, tracking continues via expo-location background task
- Tracking stops when driver taps "End Run"

### Battery Optimization
- Location accuracy reduced to "balanced" when app is backgrounded
- Tracking automatically stops after 4 hours to prevent battery drain

---

## Error Handling

| Scenario | User Experience |
|----------|----------------|
| Server error on start run | Show retry button; allow offline start |
| GPS unavailable | Show warning; allow manual override with note |
| Push notification fails | Log error; do not block driver workflow |
| Document upload fails | Show retry option; save locally |
| Invalid run assignment | Show error and contact dispatch option |

---

*Version: 1.0 | Last Updated: June 5, 2026*
