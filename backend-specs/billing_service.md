# Billing Service Specification

## Overview

The billing system manages contractor payroll, district cost tracking, and on-demand fare calculation. It auto-generates billing line items from completed run assignments and produces invoices for contractor payment.

---

## Billing Architecture

```
Run Assignment Completed
    |
    v
BillingItemGenerator  (Daily cron or manual trigger)
    |
    +---> Contractor Items
    |         |
    |         v
    |     Invoice Generator
    |         |
    |         v
    |     PDF / CSV Export
    |
    +---> District Items (future)
```

---

## Rate Cards

Rate cards define how much to pay or charge for different scenarios.

### Rate Types

| Type | Unit | Use Case |
|------|------|----------|
| per_mile | Dollars per mile | Contractor reimbursement by distance driven |
| per_hour | Dollars per hour | Driver hourly wage |
| per_trip | Dollars per trip | Flat rate per completed run |
| flat_daily | Dollars per day | Daily contractor retainer |

### Rate Resolution Logic

When a run is completed, the system finds the most specific applicable rate card:

1. Exact match: driver-specific rate (if configured)
2. Match by vehicle type AND route type
3. Match by vehicle type only
4. Match by route type only
5. Default organization-wide rate for the item type

The system checks that the rate is active and that the assignment date falls within the rate's effective date range.

---

## Billing Item Generation

### Auto-Generate from Assignment

When a driver marks a run as complete, the system evaluates whether to generate billing items:

- Only contractor drivers generate billing items automatically
- Employee drivers may optionally generate items for district cost tracking
- Duplicate prevention: one billing item set per run assignment

Based on the driver's pay type, the system generates the appropriate item:

**Per Mile Drivers:**
- Quantity = Actual distance driven (or estimated distance if actual is unavailable)
- Unit rate = Resolved rate card amount
- Amount = Quantity multiplied by unit rate

**Per Hour Drivers:**
- Quantity = Actual hours worked (start time to end time)
- Unit rate = Resolved rate card amount
- Amount = Quantity multiplied by unit rate

**Per Trip Drivers:**
- Quantity = 1
- Unit rate = Resolved rate card amount
- Amount = Unit rate

### Daily Batch Command

A scheduled command runs nightly to generate billing items for all completed assignments that day. It can also be triggered manually by dispatchers for a specific date range or driver.

---

## Invoice Generation

### Create Invoice from Billing Items

Invoices group billing items by driver and time period (typically weekly).

Process:
1. Select all pending billing items for the driver within the period
2. Calculate subtotal (sum of all item amounts)
3. Apply any adjustments (bonuses, penalties)
4. Calculate total amount
5. Generate unique invoice number
6. Link billing items to the invoice
7. Set status to Draft (pending admin approval)

### Invoice States

| Status | Meaning |
|--------|---------|
| Draft | Created but not yet sent |
| Sent | Emailed or delivered to contractor |
| Paid | Payment recorded by admin |
| Overdue | Past payment terms without payment |
| Cancelled | Voided by admin |

### PDF Export

Invoices export as PDF documents containing:
- Organization header and contact information
- Invoice number, date, and billing period
- Contractor name and address
- Line item table: Date, Run ID, Description, Quantity, Rate, Amount
- Subtotal, adjustments, and total
- Payment terms and remittance instructions

---

## Earnings Calculation

### Driver Earnings Summary

For any date range, the system calculates:

- Total earnings (sum of all billing item amounts)
- Total assignments completed
- Earnings breakdown by type (mileage, hourly, trip, wait time)
- Pending payment amount (invoiced but not paid)
- Paid amount

### Reconciliation Report

A daily report identifies discrepancies:

- Completed assignments missing billing items
- Billing items with unusually high mileage compared to route estimates
- Drivers with zero billing items for days they were assigned

---

## API Endpoints

### Billing Rates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/billing/rates | List all rate cards |
| POST | /api/v1/billing/rates | Create new rate card |
| PUT | /api/v1/billing/rates/{id} | Update rate card |
| DELETE | /api/v1/billing/rates/{id} | Deactivate rate card |

### Billing Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/billing/items | List billing line items |
| POST | /api/v1/billing/items/generate | Auto-generate from completed assignments |
| GET | /api/v1/billing/items/{id} | View item detail |
| PUT | /api/v1/billing/items/{id} | Adjust item amount or description |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/billing/invoices | List invoices |
| POST | /api/v1/billing/invoices | Create invoice from pending items |
| GET | /api/v1/billing/invoices/{id} | View invoice with line items |
| PUT | /api/v1/billing/invoices/{id}/send | Mark as sent |
| PUT | /api/v1/billing/invoices/{id}/pay | Record payment |
| GET | /api/v1/billing/invoices/{id}/download | Download PDF |

### Driver Earnings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/driver/earnings | Current driver's earnings history |
| GET | /api/v1/drivers/{id}/earnings | Admin view of driver earnings |
| GET | /api/v1/billing/summary | Dashboard billing overview |

---

*Version: 1.0 | Last Updated: June 5, 2026*
