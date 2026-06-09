# Wireframes and UI Specifications

## Design Philosophy
- **Dispatch Dashboard:** Desktop-first, information-dense, color-coded status indicators.
- **Driver Portal:** Mobile-first, minimal cognitive load, large touch targets (minimum 48 pixels).
- **On-Demand Form:** Public-facing, trustworthy, accessible.

---

## 1. Dispatch Dashboard — Main View

### Layout (Desktop, 1280px and above)

```
+-------------------------------------------------------------+
|  LOGO   Dashboard  Routes  Runs  Vehicles  Drivers  Reports |
+---------+------------------------------------+--------------+
|         |  Date: June 5, 2026    [+ New Run]|              |
|         |  +----------+ +----------+ +------+|   DETAIL     |
|  RUN    |  | Total 47 | | In Prog  | | Delay|   PANEL      |
|  LIST   |  | Active 18| | Complete | | Pend |              |
|         |  +----------+ +----------+ +------+|              |
|         |  [Filter dropdowns]  [Search...]   |  Run:        |
|         |                                     |  E-S613..    |
|         |  +--------------------------------+ |              |
|         |  | E-S613ABEA  E-613  AM  JS  V104| |  Driver:     |
|         |  | 7:09 AM to 7:59 AM   [On Time] | |  John Smith  |
|         |  +--------------------------------+ |              |
|         |  | E-S613ABEP  E-613  PM  SJ  V107| |  Vehicle:    |
|         |  | 10:50 AM to 11:38 AM [Delayed] | |  V-104       |
|         |  +--------------------------------+ |              |
|         |                                     |  Stops: 6    |
|         |  +--------------------------------+ |              |
|         |  | LIVE FLEET MAP                 | |  [Start]     |
|         |  | [Map with vehicle markers]     | |  [Delay]     |
|         |  +--------------------------------+ |  [Cancel]    |
+---------+------------------------------------+--------------+
|  Alerts: E-S613ABEP delayed | V-102 inspection expires soon|
+-------------------------------------------------------------+
```

### Layout (Tablet, 768px to 1023px)
- Collapsible left sidebar (280px to icon-only 60px)
- Full-width content, no right panel (detail opens in modal)
- Map below run list

---

## 2. Dispatch Dashboard — Route Builder

### Stop Sequencer

```
+---------------------------------------------------+
|  Route: E-613  |  Direction: AM Pickup  | M-F     |
+---------------------------------------------------+
|  [Save] [Duplicate] [Archive]  [Preview Map]      |
+---------------------------------------------------+
|                                                   |
|  [1]  07:09 AM  Garage (Depart)           [x]     |
|       v                                           |
|  [2]  07:27 AM  Stop A - Oak St (Pickup)  [x]     |
|             3 students  No wheelchair             |
|             Notes: 3 Pickups                      |
|       v                                           |
|  [3]  07:45 AM  Stop B - Pine Ave (Drop)  [x]     |
|             3 students                            |
|       v                                           |
|  [+ Add Stop]                                     |
|                                                   |
|  Drag handles on left of each stop to reorder     |
|                                                   |
+---------------------------------------------------+
|  Total Distance: 20.29 mi  |  Duration: 50 min    |
+---------------------------------------------------+
```

---

## 3. Dispatch Dashboard — Assignment Calendar

```
+---------------------------------------------------------+
|  Weekly Assignments — June 2026    [Prev] [Today] [Next]|
+---------------------------------------------------------+
|  Mon 6/2    Tue 6/3    Wed 6/4    Thu 6/5    Fri 6/6   |
+---------------------------------------------------------+
|  +--------+  +--------+  +--------+  +--------+         |
|  |E-S613AB|  |E-S613AB|  |E-S613AB|  |E-S613AB|        |
|  |EA  JS  |  |EA  JS  |  |EA  JS  |  |EA  JS  |        |
|  |V104    |  |V104    |  |V104    |  |V104    |        |
|  +--------+  +--------+  +--------+  +--------+         |
|  +--------+  +--------+  +--------+  +--------+         |
|  |E-S613AB|  |E-S613AB|  |E-S613AB|  |E-S613AB|        |
|  |EP  JS  |  |EP  JS  |  |EP  JS  |  |EP  SJ  |        |
|  |V104    |  |V104    |  |V104    |  |V107    |        |
|  +--------+  +--------+  +--------+  +--------+         |
|                                                         |
|  Click any cell to edit. Drag to reassign.              |
+---------------------------------------------------------+
```

---

## 4. Driver Portal — Today View (Mobile)

```
+-------------------------+
|  Menu  Driver Portal  Profile |
+-------------------------+
|  Thursday, June 5       |
|  ---------------------  |
|                         |
|  Your Runs Today        |
|                         |
|  +-------------------+  |
|  | E-S613ABEA        |  |
|  | AM Pickup         |  |
|  | 7:09 AM - 7:59 AM |  |
|  | Vehicle: V-104    |  |
|  | 6 stops           |  |
|  |                   |  |
|  |  [ START RUN ]    |  |
|  +-------------------+  |
|                         |
|  +-------------------+  |
|  | E-S613ABEP        |  |
|  | PM Dropoff        |  |
|  | 10:50-11:38 AM    |  |
|  | Vehicle: V-104    |  |
|  | 3 stops           |  |
|  |                   |  |
|  |   Not yet started |  |
|  +-------------------+  |
|                         |
+-------------------------+
|  Home  Runs  History  Me|
+-------------------------+
```

---

## 5. Driver Portal — Manifest View (Mobile)

```
+-------------------------+
|  Back  E-S613ABEA  Alert|
|  AM Pickup | V-104       |
+-------------------------+
|  Elapsed: 0:18          |
|  ---------------------  |
|                         |
|  [1] Garage             |
|     7:09 AM (7:08 AM)   |
|     -----------------   |
|  [2] Stop A - Oak St    |
|     7:27 AM             |
|     3 Pickups           |
|                         |
|  +-------------------+  |
|  | MARK ARRIVED      |  |
|  +-------------------+  |
|                         |
|  [3] Stop B - Pine Ave  |
|     7:45 AM             |
|     3 Dropoffs          |
|                         |
|  ---------------------  |
|  [ REPORT DELAY ]       |
|  [ CALL DISPATCH ]      |
|  [ END RUN ]            |
+-------------------------+
```

---

## 6. Driver Portal — Delay Reporter

```
+-------------------------+
|  Back  Report Delay     |
+-------------------------+
|  How many minutes?      |
|                         |
|  [ 5 ] [10] [15] [20]   |
|  [25] [30] [45] [60]    |
|                         |
|  Or enter custom:       |
|  [______] minutes       |
|                         |
|  Reason:                |
|  [Traffic dropdown]     |
|    Traffic              |
|    Mechanical issue     |
|    Weather              |
|    Student issue        |
|    Other                |
|                         |
|  Additional notes:      |
|  [________________]     |
|                         |
|  This will notify all   |
|  parents on this route. |
|                         |
|  +-------------------+  |
|  |  SEND ALERT       |  |
|  +-------------------+  |
+-------------------------+
```

---

## 7. On-Demand Request (Public Form)

```
+-------------------------+
|  Request a Ride         |
+-------------------------+
|  Need transportation?   |
|  Fill out this form.    |
|  ---------------------  |
|                         |
|  Your Name *            |
|  [________________]     |
|                         |
|  Phone *                |
|  [________________]     |
|                         |
|  Email                  |
|  [________________]     |
|                         |
|  I am a...              |
|  [Parent dropdown]      |
|                         |
|  Pickup Address *       |
|  [________________]     |
|                         |
|  Dropoff Address *      |
|  [________________]     |
|                         |
|  Date Needed *          |
|  [ 06/10/2026 ]         |
|                         |
|  Preferred Time         |
|  [ 2:00 PM ]            |
|                         |
|  Passengers: [1]        |
|  Wheelchair needed?     |
|  [Toggle: off]          |
|                         |
|  Purpose:               |
|  [________________]     |
|                         |
|  +-------------------+  |
|  |  SUBMIT REQUEST   |  |
|  +-------------------+  |
|                         |
|  You will receive a     |
|  text confirmation.     |
+-------------------------+
```

---

## 8. On-Demand Dispatcher Queue

```
+-----------------------------------------------------+
|  On-Demand Requests              [+ Manual Request] |
+-----------------------------------------------------+
|  [Pending 2] [Approved 5] [In Progress 1] [All]     |
+-----------------------------------------------------+
|  +-----------------------------------------------+  |
|  | PENDING  ODR-2026-0042  Maria Garcia           |  |
|  |    Pickup: 789 Pine St -> Lincoln Elementary   |  |
|  |    Date: Jun 7, 2:00 PM  |  1 passenger        |  |
|  |                                                |  |
|  |    [Deny]  [Message]  [Approve and Assign]     |  |
|  +-----------------------------------------------+  |
|  +-----------------------------------------------+  |
|  | PENDING  ODR-2026-0041  David Kim              |  |
|  |    Pickup: 456 Elm Dr -> Roosevelt Middle      |  |
|  |    Date: Jun 8, 8:00 AM  |  2 passengers, WC   |  |
|  |                                                |  |
|  |    [Deny]  [Message]  [Approve and Assign]     |  |
|  +-----------------------------------------------+  |
+-----------------------------------------------------+
```

---

## 9. Contractor Sign-Up Flow

### Step 1: Personal Info
```
+-------------------------+
|  Drive With Us          |
+-------------------------+
|  Step 1 of 4            |
|  ####----               |
|                         |
|  First Name *           |
|  [________________]     |
|  Last Name *            |
|  [________________]     |
|  Email *                |
|  [________________]     |
|  Phone *                |
|  [________________]     |
|  Address                |
|  [________________]     |
|                         |
|  [Continue]             |
+-------------------------+
```

### Step 2: Vehicle Info
```
|  Vehicle Type: [Van]    |
|  Year: [2023]           |
|  Make: [Ford]           |
|  Model: [Transit]       |
|  Capacity: [12]         |
|  Wheelchair accessible? |
|  [Toggle]               |
```

### Step 3: Documents
```
|  Driver License *       |
|  [Upload]               |
|  License Number: [___]  |
|  State: [NY]            |
|  Expiry: [2027-03-15]   |
|                         |
|  Insurance Card *       |
|  [Upload]               |
|  Provider: [State Farm] |
|  Expiry: [2026-12-31]   |
|                         |
|  Vehicle Registration * |
|  [Upload]               |
```

### Step 4: Consent and Submit
```
|  Background Check       |
|  [x] I consent to a     |
|      background check   |
|                         |
|  Drug Test              |
|  [x] I consent to       |
|      random drug testing|
|                         |
|  [x] I certify all      |
|      information is true|
|                         |
|  +-------------------+  |
|  |  SUBMIT           |  |
|  +-------------------+  |
|                         |
|  We will review within  |
|  3-5 business days.     |
+-------------------------+
```

---

## 10. Notification Center

```
+------------------------------------------+
|  Alert: Route Delay                      |
|  Route E-S613ABEP is running 10 minutes  |
|  late due to traffic.                    |
|                       [Dismiss] [View]   |
+------------------------------------------+
```

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #0f172a | Headers, primary buttons, navigation |
| primary-light | #1e293b | Card headers, hover states |
| accent | #3b82f6 | Links, active states, map routes |
| accent-hover | #2563eb | Button hover |
| success | #22c55e | On time, completed, success toast |
| warning | #f59e0b | Delayed, pending, warning toast |
| danger | #ef4444 | Cancelled, error, critical alert |
| info | #06b6d4 | In progress, info toast |
| neutral | #6b7280 | Scheduled, inactive, secondary text |
| bg | #f8fafc | Page background |
| card | #ffffff | Cards, modals |
| border | #e2e8f0 | Dividers, borders |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Inter | 24px | 700 |
| Section header | Inter | 18px | 600 |
| Card title | Inter | 16px | 600 |
| Body text | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |
| Mobile H1 | Inter | 20px | 700 |
| Mobile body | Inter | 16px | 400 |
| Mobile button | Inter | 16px | 600 |

---

*Version: 1.0 | Last Updated: June 5, 2026*
