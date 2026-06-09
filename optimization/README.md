# FleetPilot Route Optimization Service

Python + Flask microservice that wraps Google OR-Tools to optimize stop sequences
for a run. The Laravel backend calls it over HTTP; results are stored in the
`route_optimizations` table for dispatcher review.

See `backend-specs/route_optimization.md` for the full contract and workflow.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/optimize` | Optimize a run's stop sequence |

## Run locally

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py            # serves on http://localhost:5000
```

## Run with Docker

```bash
docker build -t fleetpilot-ortools .
docker run -p 5000:5000 fleetpilot-ortools
```

## Example request

```bash
curl -X POST http://localhost:5000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      {"id": "garage", "latitude": 40.7128, "longitude": -74.0060, "type": "garage"},
      {"id": "stop-a", "latitude": 40.7300, "longitude": -73.9950, "type": "pickup"},
      {"id": "stop-b", "latitude": 40.7150, "longitude": -73.9900, "type": "dropoff"}
    ],
    "vehicle": {"start_stop_id": "garage", "end_stop_id": "garage"},
    "constraints": {"strategy": "shortest_distance"}
  }'
```

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `5000` | HTTP port |
| `AVG_SPEED_MPH` | `25` | Speed used to estimate duration from distance |
| `SOLVER_TIME_LIMIT_S` | `5` | Max solver wall-clock time |
