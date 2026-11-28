"""
fastapi_app_example.py
======================
EXAMPLE ONLY - shows how the routing module can be exposed as a FastAPI
service later. It is not used by the notebook.

Run (from the ml/ship_routing folder, after `pip install fastapi uvicorn`):
    uvicorn fastapi_app_example:app --reload --port 8001

Then POST to http://localhost:8001/route with a JSON body such as:
    {"source_port": "INNSA", "destination_port": "INMAA",
     "vessel_speed": 15, "vessel_type": "container_ship",
     "vessel_specs": {"draft_m": 12.5},
     "departure_time": "2026-12-01T06:00:00Z"}
"""

import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from routing import RoutingConfig, list_ports, load_network_from_csv, plan_route, to_json_safe
from sample_network import DATA_NOTICE
from weather_service import OpenMeteoProvider, WeatherConfig

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Load the network and weather provider ONCE when the service starts
GRAPH = load_network_from_csv(os.path.join(DATA_DIR, "waypoints.csv"),
                              os.path.join(DATA_DIR, "edges.csv"), DATA_NOTICE)
PROVIDER = OpenMeteoProvider(WeatherConfig(cache_file=os.path.join(BASE_DIR, "results", "cache",
                                                                   "weather_cache.json")))
CONFIG = RoutingConfig()

app = FastAPI(title="Weather-Aware Ship Routing (prototype)", version="0.1.0")


class VesselSpecs(BaseModel):
    draft_m: Optional[float] = Field(None, gt=0)
    max_wave_height_m: Optional[float] = Field(None, gt=0)
    max_wind_speed_kn: Optional[float] = Field(None, gt=0)


class RouteRequest(BaseModel):
    source_port: str
    destination_port: str
    vessel_speed: Optional[float] = Field(None, gt=0, le=40)
    vessel_type: str = "container_ship"
    vessel_specs: Optional[VesselSpecs] = None
    departure_time: Optional[str] = None      # ISO 8601, UTC recommended


@app.get("/health")
def health():
    return {"status": "ok", "nodes": GRAPH.number_of_nodes(), "edges": GRAPH.number_of_edges()}


@app.get("/ports")
def ports():
    return list_ports(GRAPH)


@app.post("/route")
def route(req: RouteRequest):
    # A plain `def` endpoint runs in a worker thread, so the blocking HTTP
    # calls to the weather API do not freeze the server.
    result = to_json_safe(plan_route(GRAPH, req.model_dump(exclude_none=True), PROVIDER, CONFIG))
    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result.get("error"))
    return result
