# Executive Summary: FleetPilot — K-12 Student Transportation Management Platform

---

## 1. Business Problem

Your organization currently operates K-12 student transportation using a Base44-built system. While functional, it lacks the operational depth required for growth, contractor management, parent communication, and financial tracking. As you expand services and compete for district contracts, you need a purpose-built platform that:

- Reduces dispatcher workload through intelligent route optimization
- Provides real-time visibility to parents and schools
- Automates contractor payroll and billing reconciliation
- Supports both scheduled tiered routes and on-demand requests within one system
- Delivers a professional mobile experience for drivers and parents
- Positions your company between basic tools and expensive enterprise systems

---

## 2. Proposed Solution

We will build a unified transportation operations platform consisting of:

- **Dispatch Web Portal:** A professional desktop and tablet interface for route planning, daily assignments, real-time fleet tracking, and billing management
- **Driver Mobile Application:** A native iOS and Android app for daily manifests, GPS-tracked stop completions, delay reporting, and earnings visibility
- **Driver Web Portal:** A responsive web interface where drivers can view schedules, historical runs, uploaded documents, and pay summaries
- **Parent Mobile Application:** A native iOS and Android app for real-time child tracking, delay notifications, and ride history
- **Parent Web Portal:** A responsive web interface for account management, notification preferences, and historical ridership review
- **On-Demand Request System:** Public-facing web and mobile forms for special trip requests, with dispatcher approval workflow
- **Contractor Portal:** Registration, document submission, and onboarding workflow for independent drivers

All components share a single backend system, ensuring consistent data, unified authentication, and centralized reporting.

---

## 3. Key Capabilities

### Route Operations
- Build and manage tiered AM, PM, and midday routes with drag-and-drop stop sequencing
- Auto-optimize routes using Google OR-Tools to reduce mileage and drive time
- Publish runs to drivers with one click
- Assign vehicles and drivers to daily runs with conflict detection
- Track runs in real time via GPS integration

### Driver Management
- Mobile manifest with one-tap stop completion and GPS verification
- Offline mode: drivers can complete stops without cellular coverage; data syncs automatically
- Delay reporting with automatic parent notification
- Document upload and expiration tracking (license, medical, insurance)
- Earnings tracking for contractor drivers

### Parent Communication
- Real-time bus tracking with estimated arrival times
- Push, SMS, and email notifications for delays, pickups, and dropoffs
- Child linking via secure verification code
- Historical ride log for peace of mind and dispute resolution

### On-Demand Services
- Public request form (web and mobile) for special transportation needs
- Dispatcher approval queue with driver assignment
- Fare estimation and billing for non-contract trips

### Billing and Payroll
- Rate card management (per mile, per hour, per trip, flat daily)
- Automatic billing item generation from completed runs
- Weekly invoice generation for contractors with PDF export
- Payment status tracking and reconciliation reports

### Reporting and Analytics
- On-time performance by route and driver
- Mileage and fuel efficiency summaries
- Contractor earnings and cost analysis
- Daily operational dashboards

---

## 4. Stakeholders and Benefits

### Dispatchers and Operations Managers
- Reduce route planning time by 30-50% with optimization
- Single view of all active runs, delays, and vehicle locations
- Automated billing reduces manual spreadsheet work
- Historical data supports contract bidding and service expansion

### Drivers (Employees and Contractors)
- Clear daily manifest with turn-by-turn navigation
- No paperwork: all stops logged digitally with timestamps
- Immediate delay communication to dispatch and parents
- Contractors see earnings in real time and receive itemized invoices

### Parents and Guardians
- Know exactly where the bus is and when it will arrive
- Receive instant alerts if delays occur
- Confirm their child boarded and exited safely
- Access ride history for any date

### School Districts
- Professional partner with modern tracking and communication
- Delay notifications reduce front office call volume
- On-demand trip coordination for field trips and special events
- Data-driven reporting on service quality

### Business Ownership
- Competitive differentiator against smaller operators
- Lower operational overhead through automation
- Scalable foundation for future NEMT (Non-Emergency Medical Transportation) expansion
- Asset value: proprietary platform increases company valuation

---

## 5. Operational Flow: A Day in the Life

### Morning: Dispatcher (6:30 AM)
1. Opens the dispatch dashboard and reviews today's automatically generated run list
2. Checks GPS to confirm all vehicles are at the garage
3. Reviews any route optimization suggestions from the system
4. Publishes final manifests; drivers receive push notifications on their phones
5. Monitors the live map as runs begin

### Morning: Driver (7:00 AM)
1. Opens the driver mobile app and sees today's assigned run
2. Taps "Start Run" when leaving the garage
3. Navigates to each stop using in-app directions
4. Taps "Complete" at each pickup; parents receive "Your child was picked up" notifications
5. Reports a 10-minute delay due to traffic; system automatically alerts all parents on the route

### Morning: Parent (7:15 AM)
1. Receives push notification: "Bus E-613 is 5 minutes from Stop A"
2. Sees real-time map showing the bus approaching
3. Receives confirmation: "Emma Johnson was picked up at 7:27 AM"

### Afternoon: Dispatcher (2:00 PM)
1. Reviews an on-demand request for tomorrow's field trip
2. Approves the request and assigns it to the nearest available contractor
3. System automatically creates the run and notifies the driver

### End of Day: System (11:00 PM)
1. Automatically generates billing items for all completed contractor runs
2. Flags any assignments missing billing data for dispatcher review
3. Sends document expiry alerts for licenses or inspections expiring within 30 days

---

## 6. Competitive Positioning

| Competitor | Their Strength | Our Advantage |
|------------|---------------|---------------|
| CSTMN | Established brand | Integrated billing and contractor management they lack |
| Transportation Plus | Enterprise scale | Similar operational power at a fraction of the cost |
| HopSkipDrive | On-demand focus | We combine scheduled routes AND on-demand in one platform |
| EverDriven | Special education expertise | We serve regular education, midday, and SPED uniformly |
| Base44 (your current tool) | Already working | Purpose-built for transportation with optimization and billing |

**Market Position:** Mid-market. More powerful than small tools. More affordable and agile than enterprise systems. Purpose-built for mixed fleet K-12 operations.

---

## 7. Technology Approach

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend API | Laravel 11 (PHP) | Rapid development, robust security, proven at scale |
| Database | PostgreSQL + PostGIS | Handles geographic data for routing and GPS tracking |
| Web Portal | Next.js 14 | Professional user experience, SEO for public pages |
| Mobile Apps | React Native + Expo | One codebase for iOS and Android; rapid deployment |
| Route Optimization | Google OR-Tools (Python) | Industry-standard solver for vehicle routing problems |
| Maps and Navigation | Google Maps Platform | Reliable routing, distance matrix, geocoding |
| Notifications | Twilio (SMS) + Amazon SES (Email) + Firebase (Push) | Multi-channel delivery |
| Hosting | Hetzner Cloud VPS | Cost-effective, reliable, scalable |

---

## 8. Success Metrics

We will measure operational improvement using the following metrics:

| Metric | Baseline (Current) | Target |
|--------|-------------------|--------|
| Route planning time per run | 15 minutes | Under 5 minutes |
| Dispatcher manual billing hours per week | 8 hours | Under 1 hour |
| Parent complaint calls about delays | High | Reduced by 60% |
| Driver paperwork errors | Occasional | Near zero |
| Route distance efficiency | Manual planning | 10%+ improvement via optimization |
| On-time performance visibility | Limited | Real-time dashboard for all runs |

---

## 9. Future Expansion Roadmap

### Phase 2 (Fall 2026)
- Student RFID or barcode scanning for automated attendance
- Advanced analytics: predictive ETAs based on traffic patterns
- Payroll integration with Gusto or ADP
- Automated school information system (SIS) data imports

### Phase 3 (2027)
- NEMT (Non-Emergency Medical Transportation) module expansion
- Multi-district support for shared services contracts
- Compliance reporting for IDEA and McKinney-Vento requirements
- White-label licensing option for other transportation providers

---

## 10. Next Steps

1. Review and approve this executive summary
2. Review the detailed technical documentation (database schema, API specifications, architecture diagrams)
3. Confirm scope and timeline
4. Initiate development with Week 1 foundation sprint

---

*Document Version: 1.0*
*Prepared: June 5, 2026*
*Classification: Business Planning*
