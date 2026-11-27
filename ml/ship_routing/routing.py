"""
routing.py
==========
Weather-aware ship routing on a maritime waypoint graph.

Part of: Supply Chain and Coastal Chain Intelligence Platform
Module : ml/ship_routing   (independent of ml/port_congestion)

Main entry point
----------------
    plan_route(G, request, provider, config) -> dict  (JSON-serialisable)

The request is the same structure the future backend will send:
    {"source_port": "INNSA", "destination_port": "INMAA",
     "vessel_speed": 15, "vessel_type": "container_ship",
     "vessel_specs": {"draft_m": 12.5}, "departure_time": "2026-11-28T06:00:00Z"}

IMPORTANT SAFETY NOTE
---------------------
All thresholds, vessel limits and penalties in this file are PROTOTYPE
values for an academic project. They are NOT certified maritime safety
limits. Real use needs vessel-specific data (stability booklet, class
rules, master's judgement) and professional maritime guidance. A low route
cost does NOT mean a route is safe.
"""

from __future__ import annotations

import copy
import heapq
import json
import logging
import math
from dataclasses import dataclass, field, asdict, replace
from datetime import datetime, timedelta, timezone
from typing import Callable, Dict, List, Optional, Sequence, Tuple

import networkx as nx
import pandas as pd

from weather_service import (WeatherProvider, empty_point_weather, point_key, to_utc)

logger = logging.getLogger("ship_routing.routing")

# >>> NB-CELL: routing_config
# ---------------------------------------------------------------------------
# Configuration: risk thresholds, penalties, weights and vessel profiles
# (ALL VALUES ARE PROTOTYPE VALUES - NOT CERTIFIED SAFETY LIMITS)
# ---------------------------------------------------------------------------

RISK_LABELS = ["Low", "Moderate", "High", "Severe"]   # index = risk level 0..3


@dataclass
class RoutingConfig:
    # Thresholds are the lower bounds of Moderate, High and Severe.
    # Wave height (m): Low < 2.0 <= Moderate < 3.5 <= High < 5.0 <= Severe
    wave_thresholds_m: Tuple[float, float, float] = (2.0, 3.5, 5.0)
    # Sustained wind (knots), roughly Beaufort 5 / 7 / 9 boundaries
    wind_thresholds_kn: Tuple[float, float, float] = (17.0, 28.0, 41.0)
    # Gusts (knots)
    gust_thresholds_kn: Tuple[float, float, float] = (25.0, 40.0, 55.0)

    # Wave direction relative to the ship's heading (0 deg = waves from dead
    # ahead, 90 = on the beam, 180 = from astern). The wave height is
    # multiplied by this factor BEFORE classification (prototype heuristic:
    # beam seas cause heavy rolling, head seas cause slamming).
    head_sea_max_angle: float = 45.0
    following_sea_min_angle: float = 135.0
    head_sea_factor: float = 1.10
    beam_sea_factor: float = 1.20
    following_sea_factor: float = 1.00

    # Edge cost = distance_weight * km + weather_weight * weather_penalty
    # weather_penalty = km * penalty_multiplier[risk level]
    distance_weight: float = 1.0
    weather_weight: float = 1.0
    penalty_multipliers: Tuple[float, float, float, float] = (0.0, 0.3, 1.5, 4.0)

    # Hard constraints
    block_severe_segments: bool = True     # Severe segments become unavailable
    under_keel_clearance_m: float = 1.5    # draft + clearance must be <= depth

    # Missing weather data: "conservative" (assume at least Moderate + extra
    # penalty), "block" (segment unavailable) or "ignore" (use what exists)
    missing_data_policy: str = "conservative"
    missing_data_min_level: int = 1
    missing_data_penalty_multiplier: float = 0.2

    # Speed loss in bad weather (fraction of service speed) per risk level
    speed_loss_fraction: Tuple[float, float, float, float] = (0.0, 0.05, 0.15, 0.30)

    # Weather sampling along each segment
    sample_spacing_km: float = 100.0
    # Weather planning window (hours from departure). None = automatic
    weather_window_hours: Optional[int] = None
    max_weather_window_hours: int = 168

    algorithm: str = "dijkstra"            # "dijkstra" or "astar"

    def to_dict(self) -> dict:
        return {k: (list(v) if isinstance(v, tuple) else v) for k, v in asdict(self).items()}

    @classmethod
    def from_dict(cls, d: dict) -> "RoutingConfig":
        fields_ = {f for f in cls.__dataclass_fields__}
        clean = {k: (tuple(v) if isinstance(v, list) else v) for k, v in d.items() if k in fields_}
        return cls(**clean)


@dataclass
class VesselProfile:
    vessel_type: str
    service_speed_kn: float
    draft_m: float
    max_wave_height_m: float        # hard limit on significant wave height
    max_wind_speed_kn: float        # hard limit on sustained wind
    wave_thresholds_m: Optional[Tuple[float, float, float]] = None  # overrides config
    notes: str = "prototype values - replace with real vessel data"


# Illustrative presets only. Replace with data from the Shipping Company module.
VESSEL_PRESETS: Dict[str, VesselProfile] = {
    "container_ship": VesselProfile("container_ship", 16.0, 12.5, 6.0, 45.0),
    "bulk_carrier":   VesselProfile("bulk_carrier",   13.0, 11.5, 5.5, 40.0),
    "tanker":         VesselProfile("tanker",         14.0, 13.0, 6.0, 45.0),
    "general_cargo":  VesselProfile("general_cargo",  12.0,  8.0, 4.5, 38.0),
    "small_coastal_vessel": VesselProfile("small_coastal_vessel", 10.0, 2.5, 3.5, 34.0,
                                          wave_thresholds_m=(1.25, 2.0, 3.0)),
}


def get_vessel_profile(vessel_type: str = "container_ship",
                       vessel_speed: Optional[float] = None,
                       vessel_specs: Optional[dict] = None) -> VesselProfile:
    """Start from a preset and apply speed/spec overrides from the request."""
    key = (vessel_type or "container_ship").strip().lower()
    if key not in VESSEL_PRESETS:
        raise ValueError(f"Unknown vessel_type '{vessel_type}'. "
                         f"Known types: {sorted(VESSEL_PRESETS)}")
    vessel = replace(VESSEL_PRESETS[key])
    if vessel_speed is not None:
        vessel.service_speed_kn = float(vessel_speed)
    allowed = {"draft_m", "max_wave_height_m", "max_wind_speed_kn"}
    for k, v in (vessel_specs or {}).items():
        if k in allowed and v is not None:
            setattr(vessel, k, float(v))
        elif k == "wave_thresholds_m" and v:
            vessel.wave_thresholds_m = tuple(float(x) for x in v)
    if not (0 < vessel.service_speed_kn <= 40):
        raise ValueError("vessel_speed must be between 0 and 40 knots")
    if vessel.draft_m <= 0:
        raise ValueError("draft_m must be positive")
    return vessel


# >>> NB-CELL: graph_build
# ---------------------------------------------------------------------------
# Building the maritime graph (nodes = ports/waypoints, edges = sea lanes)
# ---------------------------------------------------------------------------

REQUIRED_NODE_COLS = {"node_id", "name", "type", "lat", "lon"}
REQUIRED_EDGE_COLS = {"u", "v", "lane_type", "min_depth_m", "navigable"}


def validate_network_tables(waypoints: pd.DataFrame, edges: pd.DataFrame) -> None:
    """Raise ValueError with a clear message if the tables are malformed."""
    missing = REQUIRED_NODE_COLS - set(waypoints.columns)
    if missing:
        raise ValueError(f"waypoints table is missing columns: {sorted(missing)}")
    missing = REQUIRED_EDGE_COLS - set(edges.columns)
    if missing:
        raise ValueError(f"edges table is missing columns: {sorted(missing)}")
    dup = waypoints["node_id"][waypoints["node_id"].duplicated()].tolist()
    if dup:
        raise ValueError(f"duplicate node_id values: {dup}")
    bad = waypoints[(waypoints.lat.abs() > 90) | (waypoints.lon.abs() > 180)]
    if len(bad):
        raise ValueError(f"invalid coordinates for: {bad.node_id.tolist()}")
    ids = set(waypoints["node_id"])
    unknown = sorted((set(edges.u) | set(edges.v)) - ids)
    if unknown:
        raise ValueError(f"edges reference unknown nodes: {unknown}")
    loops = edges[edges.u == edges.v]
    if len(loops):
        raise ValueError(f"self-loop edges found: {loops.u.tolist()}")


def build_graph(waypoints: pd.DataFrame, edges: pd.DataFrame, data_notice: str = "") -> nx.DiGraph:
    """
    Create a DIRECTED graph. Each sea lane is added in both directions
    (unless bidirectional=False) because the ship's heading - and therefore
    the wave direction relative to the ship - is different each way.
    """
    validate_network_tables(waypoints, edges)
    G = nx.DiGraph(data_notice=data_notice)
    for row in waypoints.itertuples(index=False):
        G.add_node(row.node_id, name=row.name, type=row.type,
                   lat=float(row.lat), lon=float(row.lon),
                   data_status=getattr(row, "data_status", "unknown"))
    for row in edges.itertuples(index=False):
        attrs = dict(lane_type=row.lane_type, min_depth_m=float(row.min_depth_m),
                     navigable=bool(row.navigable),
                     data_status=getattr(row, "data_status", "unknown"))
        G.add_edge(row.u, row.v, **attrs)
        if bool(getattr(row, "bidirectional", True)):
            G.add_edge(row.v, row.u, **attrs)
    return G


# >>> NB-CELL: geo
# ---------------------------------------------------------------------------
# Geographic helpers (great-circle maths) and edge geometry
# ---------------------------------------------------------------------------

EARTH_RADIUS_KM = 6371.0088
KM_PER_NM = 1.852


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def km_to_nm(km: float) -> float:
    return km / KM_PER_NM


def initial_bearing_deg(lat1, lon1, lat2, lon2) -> float:
    """Compass direction (0-360, 0 = north) the ship steers at the start of the segment."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def intermediate_point(lat1, lon1, lat2, lon2, fraction: float) -> Tuple[float, float]:
    """Point at `fraction` (0..1) of the way along the great circle."""
    p1, l1, p2, l2 = map(math.radians, (lat1, lon1, lat2, lon2))
    d = 2 * math.asin(math.sqrt(math.sin((p2 - p1) / 2) ** 2 +
                                math.cos(p1) * math.cos(p2) * math.sin((l2 - l1) / 2) ** 2))
    if d == 0:
        return lat1, lon1
    a = math.sin((1 - fraction) * d) / math.sin(d)
    b = math.sin(fraction * d) / math.sin(d)
    x = a * math.cos(p1) * math.cos(l1) + b * math.cos(p2) * math.cos(l2)
    y = a * math.cos(p1) * math.sin(l1) + b * math.cos(p2) * math.sin(l2)
    z = a * math.sin(p1) + b * math.sin(p2)
    return math.degrees(math.atan2(z, math.hypot(x, y))), math.degrees(math.atan2(y, x))


def add_geometry(G: nx.DiGraph) -> nx.DiGraph:
    """Attach distance (km, nm) and heading to every edge."""
    for u, v, data in G.edges(data=True):
        a, b = G.nodes[u], G.nodes[v]
        km = haversine_km(a["lat"], a["lon"], b["lat"], b["lon"])
        data["distance_km"] = km
        data["distance_nm"] = km_to_nm(km)
        data["bearing_deg"] = initial_bearing_deg(a["lat"], a["lon"], b["lat"], b["lon"])
    return G


def load_network_from_dataframes(waypoints, edges, data_notice="") -> nx.DiGraph:
    return add_geometry(build_graph(waypoints, edges, data_notice))


def load_network_from_csv(waypoints_csv: str, edges_csv: str, data_notice: str = "") -> nx.DiGraph:
    """Load any network that uses the same column names (real data can be plugged in here)."""
    return load_network_from_dataframes(pd.read_csv(waypoints_csv), pd.read_csv(edges_csv), data_notice)


# >>> NB-CELL: segment_weather
# ---------------------------------------------------------------------------
# Sampling points along segments and fetching their weather
# ---------------------------------------------------------------------------

def sample_points_for_edge(G: nx.DiGraph, u: str, v: str, spacing_km: float = 100.0):
    """Both end points plus evenly spaced points every ~spacing_km (at least the midpoint)."""
    a, b = G.nodes[u], G.nodes[v]
    km = G.edges[u, v]["distance_km"]
    n = max(2, int(math.ceil(km / spacing_km)))
    return [intermediate_point(a["lat"], a["lon"], b["lat"], b["lon"], i / n) for i in range(n + 1)]


def collect_sample_points(G: nx.DiGraph, spacing_km: float = 100.0):
    """Unique sample points for the whole graph + mapping edge -> point keys."""
    unique: Dict[str, Tuple[float, float]] = {}
    edge_points: Dict[Tuple[str, str], List[str]] = {}
    for u, v in G.edges():
        keys = []
        for lat, lon in sample_points_for_edge(G, u, v, spacing_km):
            k = point_key(lat, lon)
            unique.setdefault(k, (round(lat, 2), round(lon, 2)))
            keys.append(k)
        edge_points[(u, v)] = keys
    return unique, edge_points


def auto_window_hours(G, source, target, speed_kn, config: "RoutingConfig") -> int:
    """Hours of forecast to consider: rough voyage time (great circle x1.6) + 12 h buffer."""
    if config.weather_window_hours:
        return int(min(config.weather_window_hours, config.max_weather_window_hours))
    a, b = G.nodes[source], G.nodes[target]
    nm = km_to_nm(haversine_km(a["lat"], a["lon"], b["lat"], b["lon"]))
    hours = int(math.ceil(nm * 1.6 / max(speed_kn, 1.0))) + 12
    return int(min(max(hours, 12), config.max_weather_window_hours))


def fetch_network_weather(G, provider: WeatherProvider, departure, window_hours: int,
                          spacing_km: float = 100.0):
    """Fetch weather for every sample point. Never raises: a provider crash
    becomes 'missing' records so routing can still decide conservatively."""
    unique, edge_points = collect_sample_points(G, spacing_km)
    try:
        weather = provider.fetch_points(list(unique.values()), departure, window_hours)
    except Exception as exc:          # noqa: BLE001 - protect the caller
        logger.error("Weather provider failed: %s", exc)
        weather = {}
        err = f"provider exception: {exc.__class__.__name__}: {exc}"
    else:
        err = "no record returned"
    for k in unique:
        if k not in weather:
            weather[k] = empty_point_weather(getattr(provider, "name", "unknown"), error=err)
    return weather, edge_points


# >>> NB-CELL: risk
# ---------------------------------------------------------------------------
# Weather risk scoring for points and segments
# ---------------------------------------------------------------------------

def classify_value(value: Optional[float], thresholds: Sequence[float]) -> Optional[int]:
    """0=Low, 1=Moderate, 2=High, 3=Severe. None if value missing."""
    if value is None:
        return None
    level = 0
    for t in thresholds:
        if value >= t:
            level += 1
    return level


def relative_wave_angle(wave_from_deg: Optional[float], heading_deg: float) -> Optional[float]:
    """0 = waves from dead ahead, 90 = beam, 180 = from astern."""
    if wave_from_deg is None:
        return None
    diff = abs((wave_from_deg - heading_deg + 180) % 360 - 180)
    return diff


def encounter_type(angle: Optional[float], config: RoutingConfig) -> Tuple[str, float]:
    if angle is None:
        return "unknown", config.beam_sea_factor       # unknown direction -> worst case factor
    if angle <= config.head_sea_max_angle:
        return "head sea", config.head_sea_factor
    if angle >= config.following_sea_min_angle:
        return "following sea", config.following_sea_factor
    return "beam sea", config.beam_sea_factor


def assess_point(rec: dict, heading_deg: float, vessel: VesselProfile, config: RoutingConfig) -> dict:
    """Risk assessment of one weather record for a ship on a given heading."""
    wave_thr = vessel.wave_thresholds_m or config.wave_thresholds_m
    hs = rec.get("wave_height_m")
    angle = relative_wave_angle(rec.get("wave_direction_deg"), heading_deg)
    enc, factor = encounter_type(angle, config)
    eff = hs * factor if hs is not None else None
    wind = rec.get("wind_speed_kn")
    gust = rec.get("wind_gusts_kn")
    levels = {"wave": classify_value(eff, wave_thr),
              "wind": classify_value(wind, config.wind_thresholds_kn),
              "gust": classify_value(gust, config.gust_thresholds_kn)}
    available = [l for l in levels.values() if l is not None]
    complete = hs is not None and wind is not None
    level = max(available) if available else 0
    ratios = []
    if eff is not None:
        ratios.append(eff / wave_thr[2])
    if wind is not None:
        ratios.append(wind / config.wind_thresholds_kn[2])
    if gust is not None:
        ratios.append(gust / config.gust_thresholds_kn[2])
    severity = max(ratios) if ratios else None

    reasons = []
    if hs is not None and hs > vessel.max_wave_height_m:
        reasons.append(f"wave height {hs:.1f} m exceeds vessel limit {vessel.max_wave_height_m} m")
    if wind is not None and wind > vessel.max_wind_speed_kn:
        reasons.append(f"wind {wind:.0f} kn exceeds vessel limit {vessel.max_wind_speed_kn} kn")
    if not complete:
        if config.missing_data_policy == "conservative":
            level = max(level, config.missing_data_min_level)
        elif config.missing_data_policy == "block":
            reasons.append("weather data missing (policy = block)")
    if level == 3 and config.block_severe_segments:
        reasons.append("Severe weather risk (severe segments are blocked)")
    return {"risk_level": level, "levels": levels, "severity_index": severity,
            "effective_wave_height_m": eff, "relative_wave_angle_deg": angle,
            "encounter": enc, "data_complete": complete, "violations": reasons,
            "record": rec}


def assess_segment(point_recs: List[dict], heading_deg: float, km: float,
                   vessel: VesselProfile, config: RoutingConfig) -> dict:
    """Segment risk = WORST sample point on the segment (conservative)."""
    pts = [assess_point(r, heading_deg, vessel, config) for r in point_recs]
    worst = max(pts, key=lambda p: (p["risk_level"], p["severity_index"] or 0))
    complete = all(p["data_complete"] for p in pts)
    # Report the violations of the worst point (avoids repeating similar messages)
    violations = worst["violations"] or sorted({v for p in pts for v in p["violations"]})
    level = max(p["risk_level"] for p in pts)
    penalty = km * config.penalty_multipliers[level]
    if not complete and config.missing_data_policy == "conservative":
        penalty += km * config.missing_data_penalty_multiplier
    rec = worst["record"]
    sources = sorted({str(p["record"].get("source")) for p in pts})
    errors = sorted({p["record"]["error"] for p in pts if p["record"].get("error")})
    return {
        "risk_level": level, "risk_label": RISK_LABELS[level],
        "severity_index": worst["severity_index"],
        "weather_penalty": penalty, "weather_feasible": not violations,
        "violations": violations, "data_complete": complete,
        "missing_points": sum(not p["data_complete"] for p in pts), "points_sampled": len(pts),
        "wave_height_m": rec.get("wave_height_m"), "wave_direction_deg": rec.get("wave_direction_deg"),
        "wave_period_s": rec.get("wave_period_s"), "swell_wave_height_m": rec.get("swell_wave_height_m"),
        "effective_wave_height_m": worst["effective_wave_height_m"],
        "relative_wave_angle_deg": worst["relative_wave_angle_deg"], "encounter": worst["encounter"],
        "wind_speed_kn": rec.get("wind_speed_kn"), "wind_direction_deg": rec.get("wind_direction_deg"),
        "wind_gusts_kn": rec.get("wind_gusts_kn"),
        "max_wave_height_on_segment_m": max((p["record"].get("wave_height_m") or 0) for p in pts) if any(
            p["record"].get("wave_height_m") is not None for p in pts) else None,
        "max_wind_on_segment_kn": max((p["record"].get("wind_speed_kn") or 0) for p in pts) if any(
            p["record"].get("wind_speed_kn") is not None for p in pts) else None,
        "data_sources": sources, "data_errors": errors[:3],
    }


def annotate_graph_with_weather(G: nx.DiGraph, weather: Dict[str, dict], edge_points,
                                vessel: VesselProfile, config: RoutingConfig) -> nx.DiGraph:
    """Store a weather assessment and navigational feasibility on every edge."""
    for u, v, data in G.edges(data=True):
        recs = [weather[k] for k in edge_points[(u, v)]]
        data["weather"] = assess_segment(recs, data["bearing_deg"], data["distance_km"], vessel, config)
        data["nav_feasible"], data["nav_reason"] = navigational_check(data, vessel, config)
    return G


def navigational_check(edge: dict, vessel: VesselProfile, config: RoutingConfig):
    """Depth / navigability check (independent of weather)."""
    if not edge.get("navigable", True):
        return False, "segment marked non-navigable"
    need = vessel.draft_m + config.under_keel_clearance_m
    if edge.get("min_depth_m", 1e9) < need:
        return False, (f"depth {edge['min_depth_m']:.1f} m < draft {vessel.draft_m} m + "
                       f"clearance {config.under_keel_clearance_m} m")
    return True, None


# >>> NB-CELL: dijkstra
# ---------------------------------------------------------------------------
# Dijkstra's algorithm and the shortest-distance route
# ---------------------------------------------------------------------------

def make_distance_weight(G: nx.DiGraph):
    """Weight = distance only. Navigationally impossible edges are hidden (None).
    Weather is IGNORED here on purpose - this is the baseline route."""
    def weight(u, v, d):
        if not d.get("nav_feasible", True):
            return None
        return d["distance_km"]
    return weight


def dijkstra_manual(G: nx.DiGraph, source: str, target: str, weight_fn: Callable):
    """
    Textbook Dijkstra with a priority queue (for learning; NetworkX is used
    in production and the notebook checks both give the same answer).
    Returns (cost, path) or (inf, None) if unreachable.
    """
    dist = {source: 0.0}
    prev: Dict[str, Optional[str]] = {source: None}
    heap = [(0.0, source)]
    visited = set()
    while heap:
        d_u, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)
        if u == target:
            path = []
            while u is not None:
                path.append(u)
                u = prev[u]
            return d_u, path[::-1]
        for v, data in G[u].items():
            w = weight_fn(u, v, data)
            if w is None or v in visited:      # None = edge not allowed
                continue
            nd = d_u + w
            if nd < dist.get(v, math.inf):
                dist[v], prev[v] = nd, u
                heapq.heappush(heap, (nd, v))
    return math.inf, None


def shortest_distance_route(G: nx.DiGraph, source: str, target: str) -> Optional[List[str]]:
    try:
        return nx.dijkstra_path(G, source, target, weight=make_distance_weight(G))
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None


# >>> NB-CELL: weather_aware
# ---------------------------------------------------------------------------
# Weather-aware optimisation (Dijkstra or A*) and route summaries
# ---------------------------------------------------------------------------

def make_weather_weight(G: nx.DiGraph, config: RoutingConfig):
    """Edge cost = distance_weight*km + weather_weight*penalty.
    Edges that break navigational OR weather constraints are hidden (None)."""
    def weight(u, v, d):
        if not d.get("nav_feasible", True):
            return None
        w = d.get("weather")
        if w is None:
            return None                      # never assume unknown = safe
        if not w["weather_feasible"]:
            return None
        return config.distance_weight * d["distance_km"] + config.weather_weight * w["weather_penalty"]
    return weight


def weather_aware_route(G: nx.DiGraph, source: str, target: str, config: RoutingConfig):
    weight = make_weather_weight(G, config)
    try:
        if config.algorithm == "astar":
            t = G.nodes[target]
            # Admissible heuristic: straight-line distance never overestimates
            heuristic = lambda n, _t: config.distance_weight * haversine_km(
                G.nodes[n]["lat"], G.nodes[n]["lon"], t["lat"], t["lon"])
            return nx.astar_path(G, source, target, heuristic=heuristic, weight=weight)
        return nx.dijkstra_path(G, source, target, weight=weight)
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None


def format_duration(hours: float) -> str:
    total_min = int(round(hours * 60))
    d, rem = divmod(total_min, 24 * 60)
    h, m = divmod(rem, 60)
    return (f"{d} d " if d else "") + f"{h} h {m:02d} min"


def _r(x, n=2):
    return None if x is None else round(float(x), n)


def summarize_route(G: nx.DiGraph, path: Optional[List[str]], vessel: VesselProfile,
                    config: RoutingConfig, departure: datetime) -> Optional[dict]:
    """Totals, risk counts, travel time and per-segment details for a path."""
    if not path:
        return None
    segs, km, penalty, hours, cost = [], 0.0, 0.0, 0.0, 0.0
    for u, v in zip(path[:-1], path[1:]):
        d = G.edges[u, v]
        w = d["weather"]
        speed = vessel.service_speed_kn * (1 - config.speed_loss_fraction[w["risk_level"]])
        t_h = d["distance_nm"] / speed
        km += d["distance_km"]; penalty += w["weather_penalty"]; hours += t_h
        cost += config.distance_weight * d["distance_km"] + config.weather_weight * w["weather_penalty"]
        segs.append({
            "from": u, "to": v, "from_name": G.nodes[u]["name"], "to_name": G.nodes[v]["name"],
            "lane_type": d["lane_type"], "distance_km": _r(d["distance_km"], 1),
            "distance_nm": _r(d["distance_nm"], 1), "heading_deg": _r(d["bearing_deg"], 0),
            "risk_level": w["risk_level"], "risk_label": w["risk_label"],
            "severity_index": _r(w["severity_index"], 2), "weather_penalty": _r(w["weather_penalty"], 1),
            "wave_height_m": _r(w["wave_height_m"]), "max_wave_height_on_segment_m": _r(w["max_wave_height_on_segment_m"]),
            "wave_direction_deg": _r(w["wave_direction_deg"], 0),
            "relative_wave_angle_deg": _r(w["relative_wave_angle_deg"], 0), "encounter": w["encounter"],
            "effective_wave_height_m": _r(w["effective_wave_height_m"]),
            "wave_period_s": _r(w["wave_period_s"], 1), "swell_wave_height_m": _r(w["swell_wave_height_m"]),
            "wind_speed_kn": _r(w["wind_speed_kn"], 1), "max_wind_on_segment_kn": _r(w["max_wind_on_segment_kn"], 1),
            "wind_gusts_kn": _r(w["wind_gusts_kn"], 1), "wind_direction_deg": _r(w["wind_direction_deg"], 0),
            "data_complete": w["data_complete"], "data_sources": w["data_sources"],
            "data_errors": w["data_errors"], "nav_feasible": d["nav_feasible"],
            "weather_feasible": w["weather_feasible"], "violations": w["violations"],
            "planned_speed_kn": _r(speed, 1), "segment_time_h": _r(t_h, 2),
        })
    worst = max(s["risk_level"] for s in segs)
    return {
        "path": path, "path_names": [G.nodes[n]["name"] for n in path],
        "distance_km": _r(km, 1), "distance_nautical_miles": _r(km_to_nm(km), 1),
        "total_weather_penalty": _r(penalty, 1), "total_cost": _r(cost, 1),
        "weather_risk": RISK_LABELS[worst], "weather_risk_level": worst,
        "low_risk_segments": sum(s["risk_level"] == 0 for s in segs),
        "moderate_risk_segments": sum(s["risk_level"] == 1 for s in segs),
        "high_risk_segments": sum(s["risk_level"] == 2 for s in segs),
        "severe_risk_segments": sum(s["risk_level"] == 3 for s in segs),
        "segments_with_missing_weather": sum(not s["data_complete"] for s in segs),
        "weather_data_complete": all(s["data_complete"] for s in segs),
        "meets_constraints": all(s["nav_feasible"] and s["weather_feasible"] for s in segs),
        "constraint_violations": [f"{s['from']}->{s['to']}: {v}" for s in segs for v in s["violations"]],
        "estimated_travel_time": {"hours": _r(hours, 1), "text": format_duration(hours),
                                  "eta_utc": (departure + timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                                  "basis": f"service speed {vessel.service_speed_kn} kn reduced by "
                                           f"prototype weather speed-loss factors"},
        "segments": segs,
    }


# >>> NB-CELL: compare
# ---------------------------------------------------------------------------
# Route comparison, explanation and the main plan_route() entry point
# ---------------------------------------------------------------------------

DISCLAIMER = ("Prototype decision-support output for an academic project. Risk thresholds and "
              "vessel limits are configurable prototype values, not certified maritime safety "
              "limits. A low route cost does not mean the route is safe. Verify with official "
              "forecasts, nautical charts and professional maritime guidance.")


def resolve_port(G: nx.DiGraph, query) -> Optional[str]:
    """Accept a port id (e.g. 'INNSA') or a name / unique part of a name ('mumbai')."""
    if not isinstance(query, str) or not query.strip():
        return None
    q = query.strip().lower()
    ports = [n for n, d in G.nodes(data=True) if d.get("type") == "port"]
    for n in ports:
        if n.lower() == q or G.nodes[n]["name"].lower() == q:
            return n
    hits = [n for n in ports if q in G.nodes[n]["name"].lower()]
    return hits[0] if len(hits) == 1 else None


def list_ports(G):
    return {n: d["name"] for n, d in G.nodes(data=True) if d.get("type") == "port"}


def comparison_table(shortest: Optional[dict], recommended: Optional[dict]) -> pd.DataFrame:
    rows = [("Path", lambda r: " -> ".join(r["path"])),
            ("Distance (km)", lambda r: r["distance_km"]),
            ("Distance (nautical miles)", lambda r: r["distance_nautical_miles"]),
            ("Estimated travel time", lambda r: r["estimated_travel_time"]["text"]),
            ("ETA (UTC)", lambda r: r["estimated_travel_time"]["eta_utc"]),
            ("Total weather penalty", lambda r: r["total_weather_penalty"]),
            ("Total route cost", lambda r: r["total_cost"]),
            ("Overall weather risk", lambda r: r["weather_risk"]),
            ("High-risk segments", lambda r: r["high_risk_segments"]),
            ("Severe-risk segments", lambda r: r["severe_risk_segments"]),
            ("Segments with missing weather", lambda r: r["segments_with_missing_weather"]),
            ("Meets all constraints", lambda r: r["meets_constraints"])]
    data = {"Metric": [n for n, _ in rows],
            "Shortest-distance route": [f(shortest) if shortest else "no route" for _, f in rows],
            "Weather-aware route": [f(recommended) if recommended else "NO FEASIBLE ROUTE" for _, f in rows]}
    return pd.DataFrame(data).set_index("Metric")


def explain_routes(shortest: Optional[dict], recommended: Optional[dict], G=None) -> str:
    if recommended is None:
        if shortest is None:
            return "No navigable connection exists between these ports in the network."
        v = shortest["constraint_violations"][:4]
        return ("NO FEASIBLE ROUTE FOUND. Every connection between the ports passes through at least "
                "one segment that violates the configured safety constraints, so no route is "
                "recommended. The shortest-distance route is shown only for reference and must NOT be "
                "used. Examples of blocked segments: " + "; ".join(v) +
                ". Options: delay departure, use a vessel with higher limits, or review constraints "
                "with maritime professionals.")
    parts = []
    if shortest and shortest["path"] == recommended["path"]:
        parts.append(f"The shortest-distance route ({recommended['distance_km']} km) is also the "
                     f"weather-aware recommendation: its weather risk is {recommended['weather_risk']}, "
                     "so no detour is justified.")
    elif shortest:
        extra = recommended["distance_km"] - shortest["distance_km"]
        pct = 100 * extra / shortest["distance_km"] if shortest["distance_km"] else 0
        reason = []
        if not shortest["meets_constraints"]:
            reason.append("the shortest route violates safety constraints (" +
                          "; ".join(shortest["constraint_violations"][:3]) + ")")
        if shortest["high_risk_segments"] or shortest["severe_risk_segments"]:
            reason.append(f"the shortest route has {shortest['high_risk_segments']} high-risk and "
                          f"{shortest['severe_risk_segments']} severe-risk segment(s)")
        if not reason:
            reason.append("the shortest route has a higher combined distance + weather cost")
        parts.append(f"The weather-aware route was selected because {' and '.join(reason)}. It is "
                     f"{extra:.0f} km ({pct:.1f}%) longer, but its overall risk is "
                     f"{recommended['weather_risk']} and its weather penalty is "
                     f"{recommended['total_weather_penalty']} versus {shortest['total_weather_penalty']} "
                     f"(total cost {recommended['total_cost']} vs {shortest['total_cost']}).")
    if recommended["high_risk_segments"] or recommended["severe_risk_segments"]:
        parts.append(f"Caution: the recommended route still contains {recommended['high_risk_segments']} "
                     "high-risk segment(s); it was the lowest-cost route that meets the constraints.")
    if not recommended["weather_data_complete"]:
        parts.append(f"WARNING: weather data was missing for {recommended['segments_with_missing_weather']} "
                     "segment(s); those were treated conservatively but their risk is NOT verified.")
    return " ".join(parts)


def plan_route(G_base: nx.DiGraph, request: dict, provider: WeatherProvider,
               config: Optional[RoutingConfig] = None) -> dict:
    """
    Main entry point. Never raises for bad input or weather failures:
    returns {"status": "ok" | "no_feasible_route" | "no_route" | "error", ...}.
    """
    config = config or RoutingConfig()
    base = {"status": "error", "request": request, "disclaimer": DISCLAIMER,
            "data_notice": G_base.graph.get("data_notice", ""), "warnings": []}
    # 1. validate the request
    try:
        src = resolve_port(G_base, request.get("source_port"))
        dst = resolve_port(G_base, request.get("destination_port"))
        if src is None or dst is None:
            bad = request.get("source_port") if src is None else request.get("destination_port")
            raise ValueError(f"Unknown port '{bad}'. Valid ports: {list_ports(G_base)}")
        if src == dst:
            raise ValueError("source_port and destination_port must be different")
        vessel = get_vessel_profile(request.get("vessel_type", "container_ship"),
                                    request.get("vessel_speed"), request.get("vessel_specs"))
        dep = request.get("departure_time")
        departure = to_utc(dep) if dep else datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    except (ValueError, TypeError) as exc:
        base["error"] = str(exc)
        return base

    # 2. weather for every segment (work on a copy so requests never interfere)
    G = G_base.copy()
    window = auto_window_hours(G, src, dst, vessel.service_speed_kn, config)
    weather, edge_points = fetch_network_weather(G, provider, departure, window, config.sample_spacing_km)
    annotate_graph_with_weather(G, weather, edge_points, vessel, config)
    n_missing = sum(1 for r in weather.values() if r.get("wave_height_m") is None or r.get("wind_speed_kn") is None)
    if n_missing:
        base["warnings"].append(f"Weather data missing for {n_missing} of {len(weather)} sample points "
                                f"(policy: {config.missing_data_policy}).")

    # 3. routes
    short_path = shortest_distance_route(G, src, dst)
    rec_path = weather_aware_route(G, src, dst, config) if short_path else None
    shortest = summarize_route(G, short_path, vessel, config, departure)
    recommended = summarize_route(G, rec_path, vessel, config, departure)

    status = "ok" if recommended else ("no_feasible_route" if shortest else "no_route")
    base.update({
        "status": status,
        "source_port": {"id": src, "name": G.nodes[src]["name"]},
        "destination_port": {"id": dst, "name": G.nodes[dst]["name"]},
        "vessel": asdict(vessel),
        "departure_time_utc": departure.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "weather_window_hours": window,
        "weather_source": sorted({str(r.get("source")) for r in weather.values()}),
        "algorithm": config.algorithm,
        "recommended_route": recommended,
        "alternative_route": shortest,
        "alternative_route_role": "shortest-distance route (ignores weather; for comparison only)",
        "distance_km": recommended["distance_km"] if recommended else None,
        "distance_nautical_miles": recommended["distance_nautical_miles"] if recommended else None,
        "estimated_travel_time": recommended["estimated_travel_time"] if recommended else None,
        "weather_risk": recommended["weather_risk"] if recommended else "No feasible route",
        "segment_weather_details": recommended["segments"] if recommended else
                                   (shortest["segments"] if shortest else []),
        "route_explanation": explain_routes(shortest, recommended, G),
    })
    if status == "no_route":
        base["route_explanation"] = ("No navigable connection exists between "
                                     f"{src} and {dst} for this vessel (graph is disconnected or "
                                     "every link fails depth/navigability checks).")
    if any(str(s).startswith("synthetic") for s in base["weather_source"]):
        base["warnings"].append("Weather data is SYNTHETIC test data, not a real forecast.")
    base["_graph"] = G   # annotated graph for visualisation (removed by to_json_safe)
    return base


# >>> NB-CELL: json_api
# ---------------------------------------------------------------------------
# JSON request/response layer (what a FastAPI endpoint will call later)
# ---------------------------------------------------------------------------

def to_json_safe(result: dict) -> dict:
    """Drop internal objects (the graph) and make everything JSON-serialisable."""
    clean = {k: v for k, v in result.items() if not k.startswith("_")}
    return json.loads(json.dumps(clean, default=str))


def handle_route_request(request_json, G: nx.DiGraph, provider: WeatherProvider,
                         config: Optional[RoutingConfig] = None) -> str:
    """Accepts a JSON string or dict, returns a JSON string (backend-friendly)."""
    try:
        request = json.loads(request_json) if isinstance(request_json, str) else dict(request_json)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        return json.dumps({"status": "error", "error": f"invalid JSON request: {exc}"})
    required = ["source_port", "destination_port"]
    missing = [k for k in required if not request.get(k)]
    if missing:
        return json.dumps({"status": "error", "error": f"missing required fields: {missing}"})
    return json.dumps(to_json_safe(plan_route(G, request, provider, config)), indent=2)
