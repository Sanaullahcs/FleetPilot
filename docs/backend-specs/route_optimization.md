# Route Optimization Service

## Overview

A Python microservice using Google OR-Tools to solve vehicle routing problems for school bus routes. It analyzes stop sequences and suggests optimized orders that minimize total distance and drive time while respecting time windows.

---

## Architecture

```
Laravel Backend
    |
    | POST /optimize
    | { stops, vehicle, constraints }
    v
OR-Tools Service (Python + Flask, Docker)
    Port: 5000
    |
    +---> Distance Matrix (Haversine formula)
    +---> OR-Tools Solver
    |
    v
Optimized Sequence
    |
    +---> route_optimizations table (suggested)
    +---> Dispatcher review (approve/reject)
    +---> Applied to run_stops (if approved)
```

---

## Service API

### POST /optimize

**Request Body:**

```json
{
  "stops": [
    {
      "id": "stop-1",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "type": "garage",
      "time_window_start": "07:00",
      "time_window_end": "07:15",
      "service_time_minutes": 5
    },
    {
      "id": "stop-2",
      "latitude": 40.7150,
      "longitude": -73.9950,
      "type": "pickup",
      "time_window_start": "07:20",
      "time_window_end": "07:35",
      "service_time_minutes": 3
    }
  ],
  "vehicle": {
    "start_stop_id": "stop-1",
    "end_stop_id": "stop-1",
    "max_capacity": 48
  },
  "constraints": {
    "strategy": "shortest_distance",
    "max_ride_time_minutes": 60,
    "school_start_time": "08:00"
  }
}
```

**Response Body:**

```json
{
  "success": true,
  "original_distance_miles": 20.29,
  "optimized_distance_miles": 18.15,
  "savings_percent": 10.54,
  "original_duration_minutes": 50,
  "optimized_duration_minutes": 44,
  "optimized_sequence": [
    {
      "stop_id": "stop-1",
      "sequence": 1,
      "arrival_time": "07:09",
      "departure_time": "07:14"
    },
    {
      "stop_id": "stop-2",
      "sequence": 2,
      "arrival_time": "07:24",
      "departure_time": "07:27"
    }
  ],
  "solver_status": "OPTIMAL",
  "compute_time_ms": 45
}
```

---

## How It Works

1. **Distance Matrix:** The service calculates distances between all stop pairs using the Haversine formula (or Google Distance Matrix API for higher accuracy). Distances are scaled to integers for the solver.

2. **Time Windows:** If stops have scheduled times, the solver treats these as constraints. The bus must arrive within the specified window.

3. **Service Time:** Each stop requires a service time (default 3 minutes for pickup/dropoff, 5 minutes for garage). This is added to travel time.

4. **Solver Strategy:**
   - First solution: Path Cheapest Arc (greedy nearest neighbor)
   - Local search: Guided Local Search for refinement
   - Time limit: 5 seconds maximum

5. **Result Storage:** The suggested sequence is stored in the `route_optimizations` table with status "suggested". The dispatcher reviews before applying.

---

## Dispatcher Review Workflow

1. Dispatcher clicks "Optimize" on a run
2. System calls the OR-Tools service
3. Results display side-by-side: Original vs. Optimized
4. Dispatcher sees: distance savings, time savings, stop order changes, any time window impacts
5. Dispatcher clicks "Apply" or "Reject"
6. If applied, the system reorders `run_stops` and updates scheduled times

---

## Integration with Laravel

The Laravel backend communicates with the optimization service via HTTP:

- Endpoint configured in environment variable `OR_TOOLS_URL`
- Timeout: 10 seconds
- Fallback: If the service is unavailable, the system logs an error and allows manual routing

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Optimization compute time | Under 5 seconds for 20 stops |
| Average distance savings | Greater than 10 percent |
| Average time savings | Greater than 8 percent |
| Service uptime | 99.9 percent |

---

*Version: 1.0 | OR-Tools 9.x | Last Updated: June 5, 2026*
