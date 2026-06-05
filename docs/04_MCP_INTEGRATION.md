# MCP Integration Specification

## Overview

This document defines the **Model Context Protocol (MCP)** server embedded within the Laravel backend. The MCP layer enables AI assistants (Claude, ChatGPT, custom LLMs) to securely query dispatch data, receive real-time updates, and execute approved actions.

**Why MCP for K-12 Transportation?**
- Dispatchers can ask natural-language questions: *"Which drivers are running late today?"*
- AI can suggest optimal on-demand assignments: *"Assign request ODR-2026-0042 to Driver Smith — he's 4 minutes from pickup."*
- Future Phase 2: Predictive delay alerts, automatic route optimization suggestions.

**MCP Transport:** HTTP POST (`/mcp/v1/`) with Server-Sent Events (SSE) for streaming.  
**Protocol Version:** MCP 2024-11-05  
**Authentication:** Same JWT Bearer token as REST API (`Authorization: Bearer <token>`).

---

## Architecture

```
┌─────────────────┐      HTTP/SSE      ┌──────────────────┐
│  AI Assistant   │ ◄────────────────► │  MCP Server      │
│  (Claude/etc)   │   JSON-RPC 2.0     │  Laravel Module  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                           ┌────────────────────┼────────────────────┐
                           │                    │                    │
                    ┌──────▼──────┐    ┌───────▼────────┐   ┌──────▼──────┐
                    │   Tools     │    │  Resources     │   │  Prompts    │
                    │  (Actions)  │    │  (Read-Only)   │   │ (Templates) │
                    └─────────────┘    └────────────────┘   └─────────────┘
```

---

## MCP Server Configuration

**Endpoint:** `POST /mcp/v1`  
**Content-Type:** `application/json`  
**SSE Endpoint:** `GET /mcp/v1/sse` (for real-time push)

### Server Info
```json
{
  "name": "k12-transport-mcp",
  "version": "1.0.0",
  "capabilities": {
    "tools": {},
    "resources": {},
    "prompts": {},
    "sampling": {}
  }
}
```

---

## Resources (Read-Only Data Views)

Resources provide structured, queryable data snapshots. Each resource has a URI and MIME type.

### 1. `dispatch://today`
Today's complete dispatch board.

```json
{
  "uri": "dispatch://today",
  "mimeType": "application/json",
  "data": {
    "date": "2026-06-05",
    "summary": {
      "total_runs": 47,
      "in_progress": 12,
      "completed": 8,
      "delayed": 3,
      "cancelled": 0
    },
    "runs": [
      {
        "run_id": "E-S613ABEA",
        "route": "E-613",
        "driver": "John Smith",
        "vehicle": "V-104",
        "status": "in_progress",
        "next_stop": "Stop B (Dropoff)",
        "eta": "07:52 AM",
        "delay_minutes": 5
      }
    ],
    "alerts": [
      {
        "type": "delay",
        "severity": "medium",
        "message": "Run E-S613ABEA delayed 5 min — traffic on Main St"
      }
    ]
  }
}
```

### 2. `fleet://status`
Real-time fleet status.

```json
{
  "uri": "fleet://status",
  "mimeType": "application/json",
  "data": {
    "vehicles": [
      {
        "vehicle_number": "V-104",
        "driver": "John Smith",
        "status": "on_route",
        "location": { "lat": 40.7128, "lng": -74.0060 },
        "speed_mph": 35,
        "ignition": true,
        "last_seen": "2026-06-05T12:34:56Z"
      }
    ],
    "available": 4,
    "on_route": 12,
    "in_garage": 6,
    "maintenance": 2
  }
}
```

### 3. `runs://{run_id}/manifest`
Full manifest for a specific run.

```json
{
  "uri": "runs://E-S613ABEA/manifest",
  "mimeType": "application/json",
  "data": {
    "run_id": "E-S613ABEA",
    "route": "E-613",
    "direction": "am_pickup",
    "driver": "John Smith",
    "vehicle": "V-104",
    "stops": [
      {
        "sequence": 1,
        "name": "Garage",
        "time": "07:09 AM",
        "type": "garage",
        "status": "completed",
        "completed_at": "07:08 AM"
      },
      {
        "sequence": 2,
        "name": "Stop A",
        "time": "07:27 AM",
        "type": "pickup",
        "status": "completed",
        "passengers": 3,
        "completed_at": "07:29 AM"
      },
      {
        "sequence": 3,
        "name": "Stop B",
        "time": "07:45 AM",
        "type": "dropoff",
        "status": "pending",
        "passengers": 3,
        "eta": "07:52 AM"
      }
    ]
  }
}
```

### 4. `drivers://{driver_id}/profile`
Driver profile with upcoming assignments.

### 5. `on-demand://pending`
List of pending on-demand requests awaiting approval.

### 6. `reports://performance/{date_range}`
On-time performance summary.

---

## Tools (Callable Actions)

Tools are JSON-RPC methods the AI can invoke. All write operations require explicit human approval in the client UI.

### Tool: `search_runs`
Find runs matching criteria.

**Input:**
```json
{
  "status": "in_progress",
  "date": "2026-06-05",
  "driver_name": "Smith",
  "route_code": "E-613"
}
```

**Output:**
```json
{
  "runs": [
    {
      "run_id": "E-S613ABEA",
      "route": "E-613",
      "driver": "John Smith",
      "vehicle": "V-104",
      "status": "in_progress",
      "delay_minutes": 5
    }
  ]
}
```

### Tool: `get_vehicle_location`
Get real-time GPS for a vehicle.

**Input:**
```json
{ "vehicle_number": "V-104" }
```

**Output:**
```json
{
  "vehicle_number": "V-104",
  "location": { "lat": 40.7128, "lng": -74.0060 },
  "speed_mph": 35,
  "heading": 180,
  "last_updated": "2026-06-05T12:34:56Z"
}
```

### Tool: `find_nearest_driver`
Find nearest available driver to a location (for on-demand assignment).

**Input:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "vehicle_type": "van",
  "wheelchair_needed": false
}
```

**Output:**
```json
{
  "candidates": [
    {
      "driver_id": "uuid",
      "driver_name": "John Smith",
      "vehicle_number": "V-104",
      "distance_miles": 2.3,
      "estimated_arrival_minutes": 8,
      "current_status": "available"
    },
    {
      "driver_id": "uuid-2",
      "driver_name": "Sarah Jones",
      "vehicle_number": "V-107",
      "distance_miles": 4.1,
      "estimated_arrival_minutes": 14,
      "current_status": "returning_to_garage"
    }
  ]
}
```

### Tool: `send_notification` ⭐ Approval Required
Send SMS/email notification to parents/schools.

**Input:**
```json
{
  "run_assignment_id": "uuid",
  "channel": "sms",
  "template_key": "delay_alert",
  "variables": {
    "delay_minutes": 15,
    "reason": "Traffic on I-95"
  }
}
```

**Output:**
```json
{
  "notification_id": "uuid",
  "recipients_count": 12,
  "status": "queued",
  "estimated_delivery": "2026-06-05T12:35:00Z"
}
```

### Tool: `update_run_status` ⭐ Approval Required
Change run assignment status (e.g., mark delayed, cancelled).

**Input:**
```json
{
  "run_assignment_id": "uuid",
  "status": "delayed",
  "delay_minutes": 10,
  "reason": "Flat tire — replacement vehicle en route"
}
```

### Tool: `approve_on_demand` ⭐ Approval Required
Approve an on-demand request and optionally assign driver.

**Input:**
```json
{
  "request_id": "uuid",
  "assign_driver_id": "uuid",
  "fare_estimate": 45.00,
  "notes": "Approved for 2:00 PM pickup"
}
```

### Tool: `get_performance_summary`
Query historical performance metrics.

**Input:**
```json
{
  "date_from": "2026-05-01",
  "date_to": "2026-05-31",
  "group_by": "route",
  "metrics": ["on_time_rate", "avg_delay_minutes", "total_miles"]
}
```

**Output:**
```json
{
  "summary": {
    "total_runs": 940,
    "on_time_rate": 0.87,
    "avg_delay_minutes": 4.2,
    "total_miles": 18420.5
  },
  "by_route": [
    {
      "route": "E-613",
      "runs": 120,
      "on_time_rate": 0.91,
      "avg_delay_minutes": 2.1,
      "total_miles": 2450.0
    }
  ]
}
```

### Tool: `flag_expiring_documents`
List drivers/vehicles with documents expiring within N days.

**Input:**
```json
{ "days": 30 }
```

**Output:**
```json
{
  "drivers": [
    {
      "driver_id": "uuid",
      "driver_name": "John Smith",
      "document_type": "medical_cert",
      "expiry_date": "2026-06-28",
      "days_remaining": 23
    }
  ],
  "vehicles": [
    {
      "vehicle_id": "uuid",
      "vehicle_number": "V-104",
      "document_type": "inspection",
      "expiry_date": "2026-06-20",
      "days_remaining": 15
    }
  ]
}
```

### Tool: `create_run_from_on_demand` ⭐ Approval Required
Convert an approved on-demand request into a scheduled run.

**Input:**
```json
{
  "request_id": "uuid",
  "route_code": "OD-2026-0042",
  "stops": [
    { "stop_id": "pickup-stop-uuid", "sequence": 1, "time": "14:00" },
    { "stop_id": "dropoff-stop-uuid", "sequence": 2, "time": "14:25" }
  ]
}
```

---

## Prompts (Pre-built Templates)

Prompts are reusable conversation starters that the AI can offer to dispatchers.

### 1. `daily-briefing`
**Description:** Generate a morning briefing for the dispatcher.  
**Template:**
```
You are a transportation dispatch assistant. Here is today's schedule:
{{dispatch://today}}

Please provide:
1. A 2-sentence summary of today's operations.
2. Any runs at risk of delay (based on historical patterns).
3. Drivers with expiring documents in the next 14 days.
4. A suggested priority order for the dispatcher to review.
```

### 2. `on-demand-recommendation`
**Description:** Analyze pending on-demand requests and recommend assignments.  
**Template:**
```
Here are the pending on-demand requests:
{{on-demand://pending}}

Here is the available fleet status:
{{fleet://status}}

For each pending request, recommend:
1. The best available driver (nearest, appropriate vehicle).
2. Estimated pickup time.
3. Any conflicts with scheduled runs.
```

### 3. `incident-report-drafting`
**Description:** Draft an incident report from event logs.  
**Template:**
```
Here are the events for run {{run_id}}:
{{runs://{run_id}/events}}

Draft a formal incident report including:
- Time and location
- Sequence of events
- Actions taken by the driver
- Recommended follow-up
```

---

## Approval Gating (Human-in-the-Loop)

All tools marked ⭐ require explicit human approval before execution. The MCP server responds with:

```json
{
  "approval_required": true,
  "tool": "send_notification",
  "request_id": "uuid",
  "preview": {
    "channel": "sms",
    "recipients": 12,
    "message_preview": "Route E-613 is delayed 15 minutes due to traffic..."
  },
  "approve_url": "/mcp/v1/approve/uuid",
  "expires_at": "2026-06-05T12:39:56Z"
}
```

The dispatcher clicks **Approve** or **Deny** in the dashboard UI. The AI cannot send notifications, change statuses, or approve requests without this step.

---

## Security & Permissions

| Role | Resources | Tools (Read) | Tools (Write) |
|------|-----------|--------------|---------------|
| Admin | All | All | All (with approval) |
| Dispatcher | All | All | send_notification, update_run_status, approve_on_demand, create_run_from_on_demand (with approval) |
| Driver | Own profile, assigned runs only | get_vehicle_location (own vehicle only) | None |
| Contractor | Own profile, accepted runs | get_vehicle_location (own vehicle only) | None |

---

## Implementation Notes (Laravel)

**Directory:** `app/Mcp/`  
**Key Classes:**
- `McpServer` – Handles JSON-RPC routing
- `McpToolRegistry` – Registers available tools
- `McpResourceProvider` – Resolves resource URIs to data
- `McpApprovalMiddleware` – Gates write operations

**Packages:**
- No external MCP SDK required; implement lightweight JSON-RPC handler (~300 LOC).
- Use Laravel's `Authorization` gates for permission checks.
- Use existing Eloquent models; no separate data layer needed.

---

*Version: 1.0 | MCP Protocol: 2024-11-05*
