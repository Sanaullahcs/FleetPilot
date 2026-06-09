"""
FleetPilot Route Optimization Service.

A small Flask service that wraps Google OR-Tools to solve the stop-sequencing
(TSP/VRP) problem for a single run. The Laravel backend calls POST /optimize with
the run's stops; the service returns an optimized ordering plus distance/time
savings. See backend-specs/route_optimization.md for the contract.
"""
from __future__ import annotations

import math
import os
import time

from flask import Flask, jsonify, request
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

app = Flask(__name__)

# Average road speed (mph) used to convert distance to a time estimate.
DEFAULT_SPEED_MPH = float(os.environ.get("AVG_SPEED_MPH", "25"))
# Solver wall-clock limit in seconds.
SOLVER_TIME_LIMIT_S = int(os.environ.get("SOLVER_TIME_LIMIT_S", "5"))
# Distances are scaled to integers for the solver (meters * SCALE keeps precision).
SCALE = 1000


def haversine_miles(a: dict, b: dict) -> float:
    """Great-circle distance between two {latitude, longitude} points, in miles."""
    r = 3958.7613  # Earth radius in miles
    lat1, lon1 = math.radians(a["latitude"]), math.radians(a["longitude"])
    lat2, lon2 = math.radians(b["latitude"]), math.radians(b["longitude"])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def build_distance_matrix(stops: list[dict]) -> list[list[int]]:
    """Scaled integer distance matrix between every pair of stops."""
    n = len(stops)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i][j] = int(round(haversine_miles(stops[i], stops[j]) * SCALE))
    return matrix


def sequence_distance_miles(stops: list[dict], order: list[int]) -> float:
    """Total miles travelled following `order` (open path, not returning to start)."""
    total = 0.0
    for i in range(len(order) - 1):
        total += haversine_miles(stops[order[i]], stops[order[i + 1]])
    return total


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "fleetpilot-optimization"})


@app.post("/optimize")
def optimize():
    payload = request.get_json(silent=True) or {}
    stops = payload.get("stops", [])
    if len(stops) < 2:
        return jsonify({"success": False, "error": "At least two stops are required."}), 400

    vehicle = payload.get("vehicle", {})
    start_id = vehicle.get("start_stop_id", stops[0]["id"])
    end_id = vehicle.get("end_stop_id")

    id_to_index = {s["id"]: idx for idx, s in enumerate(stops)}
    start_index = id_to_index.get(start_id, 0)
    end_index = id_to_index.get(end_id, start_index) if end_id else start_index

    started = time.perf_counter()
    distance_matrix = build_distance_matrix(stops)

    manager = pywrapcp.RoutingIndexManager(len(stops), 1, [start_index], [end_index])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        return distance_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(SOLVER_TIME_LIMIT_S)

    solution = routing.SolveWithParameters(search_parameters)
    if not solution:
        return jsonify({"success": False, "error": "No solution found."}), 422

    order: list[int] = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        order.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))
    order.append(manager.IndexToNode(index))

    original_order = list(range(len(stops)))
    original_distance = round(sequence_distance_miles(stops, original_order), 2)
    optimized_distance = round(sequence_distance_miles(stops, order), 2)
    savings = 0.0
    if original_distance > 0:
        savings = round((original_distance - optimized_distance) / original_distance * 100, 2)

    optimized_sequence = [
        {"stop_id": stops[node]["id"], "sequence": pos + 1}
        for pos, node in enumerate(order)
    ]

    return jsonify(
        {
            "success": True,
            "original_distance_miles": original_distance,
            "optimized_distance_miles": optimized_distance,
            "savings_percent": savings,
            "original_duration_minutes": int(original_distance / DEFAULT_SPEED_MPH * 60),
            "optimized_duration_minutes": int(optimized_distance / DEFAULT_SPEED_MPH * 60),
            "optimized_sequence": optimized_sequence,
            "solver_status": "OPTIMAL" if solution else "NONE",
            "compute_time_ms": int((time.perf_counter() - started) * 1000),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
