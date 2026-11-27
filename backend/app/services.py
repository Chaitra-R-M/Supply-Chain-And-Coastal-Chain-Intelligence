import json
import math
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy.orm import Session
from .models import Berth, CargoItem, CoastalRoute, Port, RiskAlert, Vessel, Warehouse


# ---------------------------------------------------------------------------
# Simple in-process weather cache  { port_id: (fetched_at_epoch, payload) }
# ---------------------------------------------------------------------------
_weather_cache: Dict[str, tuple] = {}
_CACHE_TTL_SECONDS = 600  # 10 minutes


def fetch_live_weather(lat: float, lon: float, port_id: str) -> Dict[str, Any]:
    """
    Fetch current weather from OpenWeatherMap for the given coordinates.
    Returns a dict with the same keys the rest of the app expects:
        sea_state, wave_height_m, wind_knots, visibility_nm,
        tidal_window, temperature_c, description, source
    Falls back to route-table estimates when the API key is absent or the
    call fails so the dashboard never breaks.
    """
    now = time.time()
    cached = _weather_cache.get(port_id)
    if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
        return cached[1]

    api_key = os.getenv("OPENWEATHER_API_KEY", "")

    if api_key:
        try:
            url = (
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            )
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(url)
                resp.raise_for_status()
                raw = resp.json()

            wind_ms   = raw.get("wind", {}).get("speed", 0.0)       # m/s
            wind_kn   = round(wind_ms * 1.94384, 1)                 # → knots
            vis_m     = raw.get("visibility", 9000)
            vis_nm    = round(vis_m / 1852, 1)
            temp_c    = round(raw.get("main", {}).get("temp", 28.0), 1)
            desc      = raw.get("weather", [{}])[0].get("description", "").capitalize()

            # OpenWeatherMap free tier has no wave data; estimate from wind
            wave_m    = round(0.0248 * (wind_kn ** 1.1), 2)         # empirical coastal estimate
            sea_state = _beaufort_description(wind_kn)

            payload = {
                "sea_state":       sea_state,
                "wave_height_m":   wave_m,
                "wind_knots":      wind_kn,
                "visibility_nm":   vis_nm,
                "temperature_c":   temp_c,
                "description":     desc,
                "tidal_window":    "High Tide 14:20 IST (+1.6m)",   # static; no free tidal API
                "source":          "OpenWeatherMap (live)",
                "fetched_at":      datetime.now(timezone.utc).isoformat(),
            }
            _weather_cache[port_id] = (now, payload)
            return payload

        except Exception:
            pass  # fall through to route-table fallback

    # -------------------------------------------------------------------
    # Fallback: return a sensible static payload labelled as estimated
    # -------------------------------------------------------------------
    fallback = {
        "sea_state":       "Moderate",
        "wave_height_m":   1.8,
        "wind_knots":      18.0,
        "visibility_nm":   9.0,
        "temperature_c":   28.0,
        "description":     "Partly cloudy",
        "tidal_window":    "High Tide 14:20 IST (+1.6m)",
        "source":          "Estimated (no API key configured)",
        "fetched_at":      datetime.now(timezone.utc).isoformat(),
    }
    _weather_cache[port_id] = (now, fallback)
    return fallback


def _beaufort_description(wind_kn: float) -> str:
    if wind_kn < 1:   return "Calm"
    if wind_kn < 7:   return "Light Breeze"
    if wind_kn < 17:  return "Gentle to Moderate Breeze"
    if wind_kn < 28:  return "Fresh Breeze"
    if wind_kn < 34:  return "Strong Breeze"
    if wind_kn < 48:  return "Near Gale"
    if wind_kn < 56:  return "Gale"
    return "Severe Storm"


def classify_congestion(score_pct: float) -> str:
    if score_pct < 45:
        return "Low"
    if score_pct < 70:
        return "Moderate"
    if score_pct < 85:
        return "High"
    return "Critical"


def compute_congestion_metrics(db: Session, port: Port) -> Dict[str, Any]:
    berths = db.query(Berth).filter(Berth.port_id == port.id).all()
    vessels = db.query(Vessel).filter(Vessel.port_id == port.id).all()
    warehouses = db.query(Warehouse).filter(Warehouse.port_id == port.id).all()

    total_berths = len(berths) or 1
    occupied_berths = sum(1 for b in berths if b.status == "Occupied")
    berth_util_pct = round((occupied_berths / total_berths) * 100, 1)

    total_wh_cap = sum(w.capacity_mt for w in warehouses) or 1.0
    total_wh_used = sum(w.utilized_mt for w in warehouses)
    warehouse_util_pct = round((total_wh_used / total_wh_cap) * 100, 1)

    waiting_vessels = [v for v in vessels if v.status in ("Anchored", "Delayed")]
    waiting_count = len(waiting_vessels)
    avg_wait_hrs = round(
        sum(max(v.eta_hours, 1.2) for v in waiting_vessels) / max(waiting_count, 1), 1
    ) if waiting_count else 0.4

    delayed_cargo = db.query(CargoItem).filter(
        CargoItem.port_id == port.id, CargoItem.status.in_(["Scheduled", "Unloading", "Loading"])
    ).count()
    handling_delay_hrs = round(1.2 + (waiting_count * 0.65) + (0.25 if warehouse_util_pct > 75 else 0.0), 1)

    # Composite congestion utilization index
    waiting_pressure = min(100.0, waiting_count * 16.0)
    composite_pct = round(
        min(99.0, 0.50 * berth_util_pct + 0.25 * warehouse_util_pct + 0.25 * waiting_pressure),
        1,
    )
    level = classify_congestion(composite_pct)

    # Generate 7-day trend anchored to current composite score
    now = datetime.now(timezone.utc)
    offsets = [-9.5, -6.0, -3.2, 2.5, -1.5, 1.8, 0.0]
    trends = []
    for i, off in enumerate(offsets):
        day = (now - timedelta(days=6 - i)).strftime("%b %d")
        val = round(max(18.0, min(96.0, composite_pct + off)), 1)
        trends.append({
            "label": day,
            "utilization_pct": val,
            "waiting_vessels": max(0, waiting_count + (1 if off > 1 else (-1 if off < -5 else 0))),
            "avg_wait_hrs": round(max(0.5, avg_wait_hrs + off * 0.08), 1),
        })

    return {
        "level": level,
        "utilization_pct": composite_pct,
        "berth_utilization_pct": berth_util_pct,
        "warehouse_utilization_pct": warehouse_util_pct,
        "waiting_vessels": waiting_count,
        "avg_waiting_time_hrs": avg_wait_hrs,
        "loading_unloading_delay_hrs": handling_delay_hrs,
        "active_handling_jobs": delayed_cargo,
        "trends": trends,
    }


def serialize_vessel(v: Vessel) -> Dict[str, Any]:
    """Serialize vessel strictly with Port-Authority-scoped operational fields (excludes private fleet financials)."""
    return {
        "id": v.id,
        "port_id": v.port_id,
        "name": v.name,
        "imo_number": v.imo_number,
        "shipping_company": v.shipping_company,
        "vessel_type": v.vessel_type,
        "capacity_dwt": v.capacity_dwt,
        "length_m": v.length_m,
        "draft_m": v.draft_m,
        "status": v.status,
        "latitude": round(v.latitude, 4),
        "longitude": round(v.longitude, 4),
        "map_x": round(v.map_x, 2),
        "map_y": round(v.map_y, 2),
        "speed_knots": round(v.speed_knots, 1),
        "heading_deg": round(v.heading_deg, 1),
        "origin_port": v.origin_port,
        "destination_port": v.destination_port,
        "eta_text": v.eta_text,
        "eta_hours": round(v.eta_hours, 2),
        "assigned_berth_code": v.assigned_berth_code,
        "route_deviation": v.route_deviation,
        "deviation_nm": round(v.deviation_nm, 2),
        "waypoints": json.loads(v.waypoints_json or "[]"),
        "arrival_time": v.arrival_time.isoformat() if v.arrival_time else None,
        "departure_time": v.departure_time.isoformat() if v.departure_time else None,
    }


def serialize_berth(b: Berth) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    occupancy_hrs = 0.0
    if b.occupied_since:
        occ = b.occupied_since.replace(tzinfo=timezone.utc) if b.occupied_since.tzinfo is None else b.occupied_since
        occupancy_hrs = round(max(0.0, (now - occ).total_seconds() / 3600.0), 1)
    return {
        "id": b.id,
        "port_id": b.port_id,
        "code": b.code,
        "name": b.name,
        "berth_type": b.berth_type,
        "max_length_m": b.max_length_m,
        "max_draft_m": b.max_draft_m,
        "capacity_mt": b.capacity_mt,
        "status": b.status,
        "current_vessel_id": b.current_vessel_id,
        "current_vessel_name": b.current_vessel_name,
        "operation": b.operation or "—",
        "progress_pct": b.progress_pct,
        "occupancy_duration_hrs": occupancy_hrs,
        "occupied_since": b.occupied_since.isoformat() if b.occupied_since else None,
        "scheduled_end": b.scheduled_end.isoformat() if b.scheduled_end else None,
        "utilization_pct": b.utilization_pct,
    }


def build_forecast_and_supply_demand(db: Session, port: Port) -> Dict[str, Any]:
    warehouses = db.query(Warehouse).filter(Warehouse.port_id == port.id).all()
    berths = db.query(Berth).filter(Berth.port_id == port.id).all()
    cargos = db.query(CargoItem).filter(CargoItem.port_id == port.id).all()

    total_storage_cap = sum(w.capacity_mt for w in warehouses) or port.max_storage_mt
    current_storage_used = sum(w.utilized_mt for w in warehouses)
    available_storage = max(0.0, total_storage_cap - current_storage_used)
    berth_capacity_mt = sum(b.capacity_mt for b in berths) or 250000.0

    # Base scale per port
    scale = max(0.65, port.total_cargo_handled_mt / 142850.0)

    timeline = [
        {"period": "Jun", "actual_mt": round(118000 * scale), "predicted_mt": round(115500 * scale), "type": "historical"},
        {"period": "Jul", "actual_mt": round(124500 * scale), "predicted_mt": round(122000 * scale), "type": "historical"},
        {"period": "Aug", "actual_mt": round(121000 * scale), "predicted_mt": round(123500 * scale), "type": "historical"},
        {"period": "Sep", "actual_mt": round(131200 * scale), "predicted_mt": round(129000 * scale), "type": "historical"},
        {"period": "Oct", "actual_mt": round(138600 * scale), "predicted_mt": round(136800 * scale), "type": "historical"},
        {"period": "Nov", "actual_mt": round(port.total_cargo_handled_mt), "predicted_mt": round(141200 * scale), "type": "historical"},
        {"period": "Dec", "actual_mt": None, "predicted_mt": round(156400 * scale), "type": "forecast"},
        {"period": "Jan", "actual_mt": None, "predicted_mt": round(164800 * scale), "type": "forecast"},
        {"period": "Feb", "actual_mt": None, "predicted_mt": round(158200 * scale), "type": "forecast"},
        {"period": "Mar", "actual_mt": None, "predicted_mt": round(174500 * scale), "type": "forecast"},
    ]

    categories = [
        {
            "category": "Containers",
            "current_mt": round(46200 * scale),
            "forecast_next_month_mt": round(52400 * scale),
            "growth_pct": 13.4,
            "peak_window": "Dec Wk 2 – Jan Wk 3",
        },
        {
            "category": "Dry Bulk",
            "current_mt": round(52400 * scale),
            "forecast_next_month_mt": round(58900 * scale),
            "growth_pct": 12.4,
            "peak_window": "Jan Wk 1 – Mar Wk 2",
        },
        {
            "category": "Liquid Bulk",
            "current_mt": round(27800 * scale),
            "forecast_next_month_mt": round(30100 * scale),
            "growth_pct": 8.3,
            "peak_window": "Dec Wk 3 – Jan Wk 2",
        },
        {
            "category": "Breakbulk",
            "current_mt": round(16450 * scale),
            "forecast_next_month_mt": round(15000 * scale),
            "growth_pct": -8.8,
            "peak_window": "Feb Wk 2 – Mar Wk 1",
        },
    ]

    next_month_expected_mt = sum(c["forecast_next_month_mt"] for c in categories)
    # Monthly throughput turns over ~1.4x through port storage; peak concurrent storage ~ 42% of monthly volume + baseline
    projected_storage_need_mt = round(current_storage_used * 0.45 + next_month_expected_mt * 0.62, 0)
    storage_gap_mt = round(total_storage_cap - projected_storage_need_mt, 0)
    storage_util_projected_pct = round((projected_storage_need_mt / total_storage_cap) * 100, 1)

    expected_vessel_calls = round(28 * scale)
    berth_slot_capacity = len(berths) * 6  # ~6 turns per berth/month at target SLA
    berth_gap = berth_slot_capacity - expected_vessel_calls
    berth_demand_util_pct = round((expected_vessel_calls / max(berth_slot_capacity, 1)) * 100, 1)

    active_cargo_mt = sum(c.quantity_mt for c in cargos)
    recommendations: List[Dict[str, str]] = []
    if storage_util_projected_pct > 85:
        recommendations.append({
            "priority": "High",
            "area": "Storage & Rail Evacuation",
            "recommendation": (
                f"Projected peak storage ({projected_storage_need_mt:,.0f} MT) nears capacity ({total_storage_cap:,.0f} MT). "
                "Increase daily rail rake dispatch by 20% for Dry Bulk shed WH-B2."
            ),
        })
    else:
        recommendations.append({
            "priority": "Moderate",
            "area": "Storage Buffer",
            "recommendation": "Pre-allocate overflow staging bays at Container Yard WH-A1 ahead of December export peak.",
        })

    if berth_demand_util_pct > 75:
        recommendations.append({
            "priority": "High",
            "area": "Berth Scheduling",
            "recommendation": (
                f"Expected {expected_vessel_calls} vessel calls vs {berth_slot_capacity} optimal berth slots. "
                "Enable night pilotage and pre-berth customs clearance to hold turnaround under 19 hrs."
            ),
        })
    else:
        recommendations.append({
            "priority": "Low",
            "area": "Berth Allocation",
            "recommendation": "Maintain dynamic feeder window on Berths B4 and B6 to absorb coastal weather delays.",
        })

    recommendations.append({
        "priority": "Moderate",
        "area": "Handling Equipment",
        "recommendation": "Deploy 2 additional mobile harbor cranes at Berth B2 during steel & container peak windows.",
    })

    return {
        "port_id": port.id,
        "port_name": port.name,
        "timeline": timeline,
        "categories": categories,
        "peak_periods": [
            {"window": "Dec 15 – Jan 10", "driver": "Agro & Container Export Surge", "expected_load_pct": 91},
            {"window": "Mar 05 – Mar 25", "driver": "Industrial Bulk & Coal Stocking", "expected_load_pct": 94},
        ],
        "supply_demand": {
            "total_storage_capacity_mt": total_storage_cap,
            "current_storage_used_mt": current_storage_used,
            "available_storage_mt": available_storage,
            "projected_storage_requirement_mt": projected_storage_need_mt,
            "storage_surplus_or_deficit_mt": storage_gap_mt,
            "projected_storage_utilization_pct": storage_util_projected_pct,
            "berth_capacity_mt": berth_capacity_mt,
            "expected_cargo_volume_mt": next_month_expected_mt,
            "expected_vessel_calls": expected_vessel_calls,
            "berth_slot_capacity": berth_slot_capacity,
            "berth_slot_gap": berth_gap,
            "berth_demand_utilization_pct": berth_demand_util_pct,
            "active_manifested_cargo_mt": active_cargo_mt,
            "shortage_detected": storage_gap_mt < 0 or berth_gap < 0 or storage_util_projected_pct > 88,
            "recommendations": recommendations,
        },
    }


def build_report_data(db: Session, port: Port, period: str) -> Dict[str, Any]:
    congestion = compute_congestion_metrics(db, port)
    berths = db.query(Berth).filter(Berth.port_id == port.id).all()
    cargos = db.query(CargoItem).filter(CargoItem.port_id == port.id).all()
    vessels = db.query(Vessel).filter(Vessel.port_id == port.id).all()

    mult = {"daily": 0.04, "weekly": 0.25, "monthly": 1.0}.get(period, 0.25)
    labels = {
        "daily": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        "weekly": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "monthly": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
    }.get(period, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

    base_throughput = round(port.total_cargo_handled_mt * mult, 1)
    series = []
    for idx, lbl in enumerate(labels):
        factor = 0.85 + ((idx % 4) * 0.1)
        series.append({
            "label": lbl,
            "throughput_mt": round((base_throughput / len(labels)) * factor, 1),
            "turnaround_hrs": round(max(14.0, port.avg_turnaround_hrs + ((idx % 3) - 1) * 0.9), 1),
            "berth_utilization_pct": round(min(98.0, congestion["berth_utilization_pct"] + ((idx % 3) - 1) * 4.5), 1),
            "congestion_pct": round(min(95.0, congestion["utilization_pct"] + ((idx % 3) - 1) * 5.0), 1),
        })

    return {
        "port_id": port.id,
        "port_name": port.name,
        "port_code": port.code,
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "cargo_throughput_mt": base_throughput,
            "avg_turnaround_hrs": port.avg_turnaround_hrs,
            "berth_utilization_pct": congestion["berth_utilization_pct"],
            "port_efficiency_pct": port.efficiency_score,
            "congestion_level": congestion["level"],
            "congestion_pct": congestion["utilization_pct"],
            "vessels_serviced": max(1, round(len(vessels) * (1 if period == "daily" else (2.4 if period == "weekly" else 8.5)))),
            "active_cargo_operations": len(cargos),
        },
        "berth_breakdown": [
            {
                "code": b.code,
                "name": b.name,
                "berth_type": b.berth_type,
                "status": b.status,
                "utilization_pct": b.utilization_pct,
                "current_vessel": b.current_vessel_name or "Available",
            }
            for b in berths
        ],
        "cargo_performance": [
            {
                "tracking_code": c.tracking_code,
                "cargo_type": c.cargo_type,
                "commodity": c.commodity,
                "quantity_mt": c.quantity_mt,
                "operation": c.operation,
                "status": c.status,
            }
            for c in cargos
        ],
        "series": series,
    }


def distance_nm_approx(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return math.sqrt(((lat2 - lat1) * 60.0) ** 2 + ((lon2 - lon1) * 58.0) ** 2)
