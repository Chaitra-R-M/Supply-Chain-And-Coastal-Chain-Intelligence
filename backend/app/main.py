import csv
import io
import json
import uuid
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .models import Berth, CargoItem, CoastalRoute, Port, RiskAlert, Vessel, VesselMovement, Warehouse
from .schemas import (
    BerthAssignRequest,
    BerthCreate,
    BerthUpdate,
    CargoCreate,
    CargoUpdate,
    CongestionPredictRequest,
    InventoryAdjustRequest,
    PortUpdate,
    RiskCreate,
    RiskUpdate,
    VesselCreate,
    VesselUpdate,
)
from .seed import seed_database
from .services import (
    build_forecast_and_supply_demand,
    build_report_data,
    compute_congestion_metrics,
    fetch_live_weather,
    serialize_berth,
    serialize_vessel,
)
from .ml.predictor import CongestionInput, predict_congestion as _ml_predict_congestion

# ---------------------------------------------------------------------------
# Ship Routing — load graph + weather provider ONCE at startup
# ---------------------------------------------------------------------------
import os as _os
import logging as _logging

_routing_logger = _logging.getLogger("ship_routing")

def _init_routing():
    """
    Load the maritime waypoint graph and Open-Meteo weather provider once.
    Returns (graph, provider, config) or (None, None, None) on failure so
    the rest of the API still starts even if routing deps are missing.
    """
    try:
        from .ship_routing.routing import (
            load_network_from_csv, RoutingConfig,
            list_ports as _sr_list_ports, VESSEL_PRESETS,
            plan_route as _sr_plan_route, to_json_safe as _sr_to_json_safe,
        )
        from .ship_routing.weather_service import OpenMeteoProvider, WeatherConfig
        from .ship_routing.sample_network import DATA_NOTICE

        _base = _os.path.dirname(_os.path.abspath(__file__))
        _data = _os.path.join(_base, "ship_routing", "data")
        _G = load_network_from_csv(
            _os.path.join(_data, "waypoints.csv"),
            _os.path.join(_data, "edges.csv"),
            DATA_NOTICE,
        )
        _cache_dir = _os.path.join(_base, "ship_routing", "results", "cache")
        _os.makedirs(_cache_dir, exist_ok=True)
        _provider = OpenMeteoProvider(
            WeatherConfig(cache_file=_os.path.join(_cache_dir, "weather_cache.json"))
        )
        _config = RoutingConfig()
        _routing_logger.info(
            "Ship routing ready: %d nodes, %d edges", _G.number_of_nodes(), _G.number_of_edges()
        )
        return _G, _provider, _config, _sr_list_ports, VESSEL_PRESETS, _sr_plan_route, _sr_to_json_safe
    except Exception as _exc:
        _routing_logger.warning("Ship routing init failed: %s — routing endpoints will return 503", _exc)
        return None, None, None, None, None, None, None


(
    _ROUTING_GRAPH,
    _ROUTING_PROVIDER,
    _ROUTING_CONFIG,
    _sr_list_ports,
    _VESSEL_PRESETS,
    _sr_plan_route,
    _sr_to_json_safe,
) = _init_routing()
load_dotenv()
os.getenv("OPENWEATHER_API_KEY")
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Coastal Chain Intelligence – Port Authority API",
    version="1.0.0",
    description="Backend API for Supply Chain and Coastal Chain Intelligence (Port Authority Dashboard)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


def get_port_or_404(db: Session, port_id: str) -> Port:
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail=f"Port '{port_id}' not found")
    return port


def verify_port_authority_scope(
    port_id: str,
    x_port_scope: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default="Port Authority"),
):
    """Enforce Port Authority access restrictions: Port Authority can only manage its scoped port."""
    role = x_user_role if isinstance(x_user_role, str) else "Port Authority"
    scope = x_port_scope if isinstance(x_port_scope, str) else None
    if role and role != "Port Authority":
        raise HTTPException(status_code=403, detail="Insufficient role permissions for Port Authority operations")
    if scope and scope != port_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access restricted: Port Authority session scoped to '{scope}' cannot modify '{port_id}'.",
        )


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "coastal-chain-port-authority", "utc": datetime.now(timezone.utc).isoformat()}


# ---------- 2.2 Port Management ----------
@app.get("/api/ports")
def list_ports(db: Session = Depends(get_db)):
    ports = db.query(Port).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "region": p.region,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "max_berths": p.max_berths,
            "max_storage_mt": p.max_storage_mt,
            "channel_depth_m": p.channel_depth_m,
            "operating_hours": p.operating_hours,
            "efficiency_score": p.efficiency_score,
        }
        for p in ports
    ]


@app.get("/api/ports/{port_id}")
def get_port(port_id: str, db: Session = Depends(get_db)):
    port = get_port_or_404(db, port_id)
    berths = db.query(Berth).filter(Berth.port_id == port.id).all()
    warehouses = db.query(Warehouse).filter(Warehouse.port_id == port.id).all()
    congestion = compute_congestion_metrics(db, port)
    return {
        "id": port.id,
        "name": port.name,
        "code": port.code,
        "region": port.region,
        "latitude": port.latitude,
        "longitude": port.longitude,
        "max_berths": port.max_berths,
        "max_storage_mt": port.max_storage_mt,
        "channel_depth_m": port.channel_depth_m,
        "operating_hours": port.operating_hours,
        "facilities": json.loads(port.facilities_json or "[]"),
        "efficiency_score": port.efficiency_score,
        "avg_turnaround_hrs": port.avg_turnaround_hrs,
        "total_cargo_handled_mt": port.total_cargo_handled_mt,
        "berths_count": len(berths),
        "warehouses_count": len(warehouses),
        "congestion": congestion,
    }


@app.patch("/api/ports/{port_id}")
def update_port(
    port_id: str,
    payload: PortUpdate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)
    if payload.name is not None:
        port.name = payload.name
    if payload.max_berths is not None:
        port.max_berths = payload.max_berths
    if payload.max_storage_mt is not None:
        port.max_storage_mt = payload.max_storage_mt
    if payload.channel_depth_m is not None:
        port.channel_depth_m = payload.channel_depth_m
    if payload.operating_hours is not None:
        port.operating_hours = payload.operating_hours
    if payload.facilities is not None:
        port.facilities_json = json.dumps(payload.facilities)
    db.commit()
    db.refresh(port)
    return get_port(port_id, db)


# ---------- 2.1 Dashboard Overview ----------
@app.get("/api/ports/{port_id}/dashboard")
def get_dashboard(port_id: str, db: Session = Depends(get_db)):
    port = get_port_or_404(db, port_id)
    vessels = db.query(Vessel).filter(Vessel.port_id == port.id).all()
    berths = db.query(Berth).filter(Berth.port_id == port.id).order_by(Berth.code).all()
    risks = (
        db.query(RiskAlert)
        .filter(RiskAlert.port_id == port.id, RiskAlert.status != "Resolved")
        .order_by(RiskAlert.created_at.desc())
        .all()
    )
    congestion = compute_congestion_metrics(db, port)

    incoming_count = sum(1 for v in vessels if v.status in ("En Route", "Anchored", "Delayed"))
    docked_count = sum(1 for v in vessels if v.status == "At Berth")
    departing_count = sum(1 for v in vessels if v.status == "Departing")
    occupied_berths = sum(1 for b in berths if b.status == "Occupied")
    available_berths = sum(1 for b in berths if b.status == "Available")

    return {
        "port": {
            "id": port.id,
            "name": port.name,
            "code": port.code,
            "region": port.region,
            "latitude": port.latitude,
            "longitude": port.longitude,
        },
        "kpis": {
            "total_registered_vessels": len(vessels),
            "incoming_vessels": incoming_count,
            "incoming_delta_text": "+2 today",
            "docked_vessels": docked_count,
            "departing_vessels": departing_count,
            "at_berth": occupied_berths,
            "total_berths": len(berths),
            "available_berths": available_berths,
            "berth_utilization_pct": congestion["berth_utilization_pct"],
            "avg_turnaround_hrs": port.avg_turnaround_hrs,
            "turnaround_delta_pct": port.turnaround_delta_pct,
            "port_efficiency_pct": port.efficiency_score,
            "efficiency_delta_pct": port.efficiency_delta_pct,
            "total_cargo_handled_mt": port.total_cargo_handled_mt,
            "warehouse_utilization_pct": congestion["warehouse_utilization_pct"],
        },
        "congestion": congestion,
        "berth_operations": [serialize_berth(b) for b in berths],
        "vessels": [serialize_vessel(v) for v in vessels],
        "active_alerts": [
            {
                "id": r.id,
                "category": r.category,
                "severity": r.severity,
                "title": r.title,
                "description": r.description,
                "affected_entity": r.affected_entity,
                "recommended_action": r.recommended_action,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in risks
        ],
    }


# ---------- 2.3 Vessel Management & 2.7 Vessel Tracking ----------
@app.get("/api/ports/{port_id}/vessels")
def list_vessels(
    port_id: str,
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    get_port_or_404(db, port_id)
    query = db.query(Vessel).filter(Vessel.port_id == port_id)
    if status and status != "All":
        query = query.filter(Vessel.status == status)
    vessels = query.all()
    return [serialize_vessel(v) for v in vessels]


@app.post("/api/ports/{port_id}/vessels", status_code=201)
def register_vessel(
    port_id: str,
    payload: VesselCreate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)

    vid = f"v-{uuid.uuid4().hex[:8]}"
    eta_hrs = payload.eta_hours
    hrs = int(eta_hrs)
    mins = int(round((eta_hrs - hrs) * 60))
    eta_text = f"ETA: {hrs}h {mins}m" if payload.status in ("En Route", "Delayed") else payload.status

    vessel = Vessel(
        id=vid,
        port_id=port_id,
        name=payload.name,
        imo_number=payload.imo_number,
        shipping_company=payload.shipping_company,
        vessel_type=payload.vessel_type,
        capacity_dwt=payload.capacity_dwt,
        length_m=payload.length_m,
        draft_m=payload.draft_m,
        status=payload.status,
        latitude=port.latitude + 0.14,
        longitude=port.longitude - 0.48,
        map_x=22.0,
        map_y=32.0,
        speed_knots=13.5 if payload.status == "En Route" else 0.0,
        heading_deg=115.0,
        origin_port=payload.origin_port,
        destination_port=payload.destination_port,
        eta_text=eta_text,
        eta_hours=eta_hrs,
        waypoints_json=json.dumps([[22, 32], [45, 46], [64, 54], [78, 59]]),
    )
    db.add(vessel)
    db.add(
        VesselMovement(
            vessel_id=vid,
            event_type="Registered Approach",
            location_label=f"Approach from {payload.origin_port}",
            latitude=vessel.latitude,
            longitude=vessel.longitude,
            speed_knots=vessel.speed_knots,
            notes=f"Vessel registered by {port.name} Authority.",
        )
    )
    db.commit()
    db.refresh(vessel)
    return serialize_vessel(vessel)


@app.patch("/api/ports/{port_id}/vessels/{vessel_id}")
def update_vessel(
    port_id: str,
    vessel_id: str,
    payload: VesselUpdate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id, Vessel.port_id == port_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found in this port")

    if payload.status is not None:
        vessel.status = payload.status
        if payload.status == "Departing":
            vessel.departure_time = datetime.now(timezone.utc)
            vessel.eta_text = "Departing Port"
            vessel.speed_knots = 11.0
        elif payload.status == "At Berth":
            vessel.arrival_time = datetime.now(timezone.utc)
            vessel.speed_knots = 0.0
    if payload.speed_knots is not None:
        vessel.speed_knots = payload.speed_knots
    if payload.eta_hours is not None:
        vessel.eta_hours = payload.eta_hours
        hrs = int(payload.eta_hours)
        mins = int(round((payload.eta_hours - hrs) * 60))
        vessel.eta_text = f"ETA: {hrs}h {mins}m"
    if payload.assigned_berth_code is not None:
        vessel.assigned_berth_code = payload.assigned_berth_code

    db.add(
        VesselMovement(
            vessel_id=vessel.id,
            event_type="Status Update",
            location_label=vessel.assigned_berth_code or "Port Waters",
            latitude=vessel.latitude,
            longitude=vessel.longitude,
            speed_knots=vessel.speed_knots,
            notes=f"Updated status to {vessel.status}.",
        )
    )
    db.commit()
    db.refresh(vessel)
    return serialize_vessel(vessel)


@app.get("/api/ports/{port_id}/vessels/{vessel_id}/history")
def get_vessel_history(port_id: str, vessel_id: str, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id, Vessel.port_id == port_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found in this port")
    logs = (
        db.query(VesselMovement)
        .filter(VesselMovement.vessel_id == vessel.id)
        .order_by(VesselMovement.timestamp.desc())
        .all()
    )
    return {
        "vessel": serialize_vessel(vessel),
        "movements": [
            {
                "id": m.id,
                "timestamp": m.timestamp.isoformat() if m.timestamp else None,
                "event_type": m.event_type,
                "location_label": m.location_label,
                "latitude": round(m.latitude, 4),
                "longitude": round(m.longitude, 4),
                "speed_knots": m.speed_knots,
                "notes": m.notes,
            }
            for m in logs
        ],
    }


@app.get("/api/ports/{port_id}/vessels/{vessel_id}/private-financials")
def get_vessel_private_financials(port_id: str, vessel_id: str):
    """Explicitly enforces Access Restriction Section 3: Port Authority cannot view private fleet financials."""
    raise HTTPException(
        status_code=403,
        detail=(
            "Access Denied (Section 3 Policy): Port Authority role cannot access another shipping company's "
            "private fleet contracts, charter rates, or financial records without Fleet Owner authorization."
        ),
    )


@app.post("/api/ports/{port_id}/vessels/simulate-tick")
def simulate_vessel_movement(
    port_id: str,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)
    vessels = db.query(Vessel).filter(Vessel.port_id == port_id).all()
    updated = []
    deviations_detected = []

    for v in vessels:
        if v.status in ("En Route", "Delayed"):
            # Move toward harbor pin (~78, 59)
            dx = 78.0 - v.map_x
            dy = 59.0 - v.map_y
            dist = (dx * dx + dy * dy) ** 0.5
            if dist > 4.0:
                step = 3.2 if v.status == "En Route" else 2.0
                v.map_x = round(v.map_x + (dx / dist) * step, 2)
                v.map_y = round(v.map_y + (dy / dist) * step, 2)
                v.longitude = round(v.longitude + (port.longitude - v.longitude) * 0.12, 4)
                v.latitude = round(v.latitude + (port.latitude - v.latitude) * 0.12, 4)
                v.eta_hours = max(0.3, round(v.eta_hours - 0.45, 2))
                hrs = int(v.eta_hours)
                mins = int(round((v.eta_hours - hrs) * 60))
                v.eta_text = f"ETA: {hrs}h {mins}m"
            else:
                v.status = "Anchored"
                v.speed_knots = 0.3
                v.eta_hours = 0.5
                v.eta_text = "Anchored (Pilot Ready)"

            # Detect route deviation for delayed or fast-shifting vessels
            if v.status == "Delayed" and not v.route_deviation:
                v.route_deviation = True
                v.deviation_nm = 2.9
            if v.route_deviation:
                deviations_detected.append(v.name)

            db.add(
                VesselMovement(
                    vessel_id=v.id,
                    event_type="Simulated AIS Tick",
                    location_label="Coastal Approach Corridor",
                    latitude=v.latitude,
                    longitude=v.longitude,
                    speed_knots=v.speed_knots,
                    notes=f"Position updated; {v.eta_text}",
                )
            )
            updated.append(v.name)

        elif v.status == "At Berth":
            # Advance active berth progress slightly
            if v.assigned_berth_code:
                berth = (
                    db.query(Berth)
                    .filter(Berth.port_id == port_id, Berth.code == v.assigned_berth_code)
                    .first()
                )
                if berth and berth.status == "Occupied" and berth.progress_pct < 100:
                    berth.progress_pct = min(100, berth.progress_pct + 5)

    # Create deviation alert if any vessel deviated and doesn't already have an active deviation alert
    if deviations_detected:
        existing = (
            db.query(RiskAlert)
            .filter(
                RiskAlert.port_id == port_id,
                RiskAlert.category == "Route Deviation",
                RiskAlert.status == "Active",
            )
            .first()
        )
        if not existing:
            db.add(
                RiskAlert(
                    id=f"rk-{uuid.uuid4().hex[:6]}",
                    port_id=port_id,
                    category="Route Deviation",
                    severity="Moderate",
                    title=f"Route deviation detected: {deviations_detected[0]}",
                    description=f"{deviations_detected[0]} drifted >2.5 NM off nominal coastal lane during swell avoidance.",
                    affected_entity=deviations_detected[0],
                    recommended_action="Confirm VHF waypoint correction with vessel master and update VTS track.",
                    status="Active",
                )
            )

    db.commit()
    return {
        "updated_vessels": updated,
        "deviations_detected": deviations_detected,
        "vessels": [serialize_vessel(v) for v in vessels],
    }


# ---------- 2.4 Berth Management ----------
@app.get("/api/ports/{port_id}/berths")
def list_berths(port_id: str, db: Session = Depends(get_db)):
    get_port_or_404(db, port_id)
    berths = db.query(Berth).filter(Berth.port_id == port_id).order_by(Berth.code).all()
    return [serialize_berth(b) for b in berths]


@app.post("/api/ports/{port_id}/berths", status_code=201)
def create_berth(
    port_id: str,
    payload: BerthCreate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)
    exists = db.query(Berth).filter(Berth.port_id == port_id, Berth.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=409, detail=f"Berth code '{payload.code}' already exists in {port.name}")

    berth = Berth(
        id=f"{port_id[:3]}-{payload.code.lower()}-{uuid.uuid4().hex[:4]}",
        port_id=port_id,
        code=payload.code,
        name=payload.name,
        berth_type=payload.berth_type,
        max_length_m=payload.max_length_m,
        max_draft_m=payload.max_draft_m,
        capacity_mt=payload.capacity_mt,
        status="Available",
        progress_pct=0,
        utilization_pct=0.0,
    )
    db.add(berth)
    port.max_berths = db.query(Berth).filter(Berth.port_id == port_id).count() + 1
    db.commit()
    db.refresh(berth)
    return serialize_berth(berth)


@app.patch("/api/ports/{port_id}/berths/{berth_id}")
def update_berth(
    port_id: str,
    berth_id: str,
    payload: BerthUpdate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    berth = db.query(Berth).filter(Berth.id == berth_id, Berth.port_id == port_id).first()
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")
    if payload.max_length_m is not None:
        berth.max_length_m = payload.max_length_m
    if payload.max_draft_m is not None:
        berth.max_draft_m = payload.max_draft_m
    if payload.capacity_mt is not None:
        berth.capacity_mt = payload.capacity_mt
    if payload.status is not None:
        berth.status = payload.status
    if payload.progress_pct is not None:
        berth.progress_pct = payload.progress_pct
    db.commit()
    db.refresh(berth)
    return serialize_berth(berth)


@app.post("/api/ports/{port_id}/berths/{berth_id}/assign")
def assign_berth(
    port_id: str,
    berth_id: str,
    payload: BerthAssignRequest,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)
    berth = db.query(Berth).filter(Berth.id == berth_id, Berth.port_id == port_id).first()
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")

    if berth.status == "Maintenance":
        raise HTTPException(status_code=409, detail=f"Berth {berth.code} is under maintenance and cannot be assigned.")

    vessel = db.query(Vessel).filter(Vessel.id == payload.vessel_id, Vessel.port_id == port_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found in this port")

    start = payload.start_time or datetime.now(timezone.utc)
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    end = start + timedelta(hours=payload.duration_hours)

    # Prevent overlapping berth assignments!
    if berth.status == "Occupied":
        existing_end = berth.scheduled_end
        if existing_end:
            if existing_end.tzinfo is None:
                existing_end = existing_end.replace(tzinfo=timezone.utc)
            existing_start = berth.occupied_since or (existing_end - timedelta(hours=8))
            if existing_start.tzinfo is None:
                existing_start = existing_start.replace(tzinfo=timezone.utc)
            if start < existing_end and end > existing_start:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Berth overlap prevented: {berth.code} is currently occupied by "
                        f"{berth.current_vessel_name} until {existing_end.strftime('%H:%M UTC')}."
                    ),
                )
        else:
            raise HTTPException(
                status_code=409,
                detail=f"Berth overlap prevented: {berth.code} is currently occupied by {berth.current_vessel_name}.",
            )

    # Check if vessel is already occupying another berth
    other_berth = (
        db.query(Berth)
        .filter(Berth.port_id == port_id, Berth.current_vessel_id == vessel.id, Berth.status == "Occupied")
        .first()
    )
    if other_berth:
        raise HTTPException(
            status_code=409,
            detail=f"Vessel {vessel.name} is already assigned to Berth {other_berth.code}. Release it first.",
        )

    # Physical berth compatibility check
    if vessel.length_m > berth.max_length_m:
        raise HTTPException(
            status_code=400,
            detail=f"Vessel length ({vessel.length_m}m) exceeds {berth.code} max length ({berth.max_length_m}m).",
        )
    if vessel.draft_m > berth.max_draft_m:
        raise HTTPException(
            status_code=400,
            detail=f"Vessel draft ({vessel.draft_m}m) exceeds {berth.code} max draft ({berth.max_draft_m}m).",
        )

    berth.status = "Occupied"
    berth.current_vessel_id = vessel.id
    berth.current_vessel_name = vessel.name
    berth.operation = payload.operation
    berth.progress_pct = 5
    berth.occupied_since = start
    berth.scheduled_end = end
    berth.utilization_pct = min(98.0, round(berth.utilization_pct + 6.0, 1))

    vessel.status = "At Berth"
    vessel.assigned_berth_code = berth.code
    vessel.eta_text = f"At Berth {berth.code}"
    vessel.eta_hours = 0.0
    vessel.speed_knots = 0.0
    vessel.map_x = 78.0
    vessel.map_y = 59.0
    vessel.latitude = port.latitude
    vessel.longitude = port.longitude
    vessel.arrival_time = start

    db.add(
        VesselMovement(
            vessel_id=vessel.id,
            event_type="Berthed",
            location_label=f"{port.name} – Berth {berth.code}",
            latitude=port.latitude,
            longitude=port.longitude,
            speed_knots=0.0,
            notes=f"Assigned to {berth.code} for {payload.operation} ({payload.duration_hours}h window).",
        )
    )
    db.commit()
    db.refresh(berth)
    return serialize_berth(berth)


@app.post("/api/ports/{port_id}/berths/{berth_id}/release")
def release_berth(
    port_id: str,
    berth_id: str,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    berth = db.query(Berth).filter(Berth.id == berth_id, Berth.port_id == port_id).first()
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")

    if berth.current_vessel_id:
        vessel = db.query(Vessel).filter(Vessel.id == berth.current_vessel_id).first()
        if vessel:
            vessel.status = "Departing"
            vessel.assigned_berth_code = None
            vessel.eta_text = "Departing Port"
            vessel.speed_knots = 10.5
            vessel.departure_time = datetime.now(timezone.utc)
            db.add(
                VesselMovement(
                    vessel_id=vessel.id,
                    event_type="Berth Released",
                    location_label=f"Departed Berth {berth.code}",
                    latitude=vessel.latitude,
                    longitude=vessel.longitude,
                    speed_knots=10.5,
                    notes=f"Completed {berth.operation or 'operations'} at {berth.code}.",
                )
            )

    berth.status = "Available"
    berth.current_vessel_id = None
    berth.current_vessel_name = None
    berth.operation = None
    berth.progress_pct = 0
    berth.occupied_since = None
    berth.scheduled_end = None
    db.commit()
    db.refresh(berth)
    return serialize_berth(berth)


# ---------- 2.5 Cargo Management ----------
@app.get("/api/ports/{port_id}/cargo")
def list_cargo(port_id: str, db: Session = Depends(get_db)):
    get_port_or_404(db, port_id)
    items = db.query(CargoItem).filter(CargoItem.port_id == port_id).order_by(CargoItem.updated_at.desc()).all()
    return [
        {
            "id": c.id,
            "port_id": c.port_id,
            "tracking_code": c.tracking_code,
            "cargo_type": c.cargo_type,
            "commodity": c.commodity,
            "quantity_mt": c.quantity_mt,
            "owner_company": c.owner_company,
            "destination": c.destination,
            "vessel_name": c.vessel_name,
            "berth_code": c.berth_code,
            "warehouse_code": c.warehouse_code,
            "operation": c.operation,
            "status": c.status,
            "storage_days": c.storage_days,
            "history": json.loads(c.history_json or "[]"),
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in items
    ]


@app.post("/api/ports/{port_id}/cargo", status_code=201)
def record_cargo_arrival(
    port_id: str,
    payload: CargoCreate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    port = get_port_or_404(db, port_id)
    now_iso = datetime.now(timezone.utc).isoformat()
    tracking = payload.tracking_code or f"CRG-{port.code[-3:]}-{uuid.uuid4().hex[:4].upper()}"

    cargo = CargoItem(
        id=f"cg-{uuid.uuid4().hex[:6]}",
        port_id=port_id,
        tracking_code=tracking,
        cargo_type=payload.cargo_type,
        commodity=payload.commodity,
        quantity_mt=payload.quantity_mt,
        owner_company=payload.owner_company,
        destination=payload.destination,
        vessel_name=payload.vessel_name,
        berth_code=payload.berth_code,
        warehouse_code=payload.warehouse_code,
        operation=payload.operation,
        status="Scheduled",
        storage_days=0,
        history_json=json.dumps([{"ts": now_iso, "event": f"Recorded {payload.operation} manifest"}]),
    )
    db.add(cargo)
    port.total_cargo_handled_mt += payload.quantity_mt
    db.commit()
    db.refresh(cargo)
    return {
        "id": cargo.id,
        "tracking_code": cargo.tracking_code,
        "cargo_type": cargo.cargo_type,
        "commodity": cargo.commodity,
        "quantity_mt": cargo.quantity_mt,
        "owner_company": cargo.owner_company,
        "destination": cargo.destination,
        "vessel_name": cargo.vessel_name,
        "berth_code": cargo.berth_code,
        "warehouse_code": cargo.warehouse_code,
        "operation": cargo.operation,
        "status": cargo.status,
        "storage_days": cargo.storage_days,
        "history": json.loads(cargo.history_json),
    }


@app.patch("/api/ports/{port_id}/cargo/{cargo_id}")
def update_cargo(
    port_id: str,
    cargo_id: str,
    payload: CargoUpdate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    cargo = db.query(CargoItem).filter(CargoItem.id == cargo_id, CargoItem.port_id == port_id).first()
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo item not found")

    history = json.loads(cargo.history_json or "[]")
    now_iso = datetime.now(timezone.utc).isoformat()
    changes = []

    if payload.status is not None and payload.status != cargo.status:
        cargo.status = payload.status
        changes.append(f"Status -> {payload.status}")
    if payload.berth_code is not None:
        cargo.berth_code = payload.berth_code
        changes.append(f"Moved to Berth {payload.berth_code}")
    if payload.warehouse_code is not None:
        cargo.warehouse_code = payload.warehouse_code
        changes.append(f"Transferred to {payload.warehouse_code}")

    note = payload.note or ", ".join(changes) or "Cargo record updated"
    history.append({"ts": now_iso, "event": note})
    cargo.history_json = json.dumps(history)
    db.commit()
    db.refresh(cargo)
    return {
        "id": cargo.id,
        "tracking_code": cargo.tracking_code,
        "status": cargo.status,
        "berth_code": cargo.berth_code,
        "warehouse_code": cargo.warehouse_code,
        "history": history,
    }


# ---------- 2.6 Inventory Monitoring ----------
@app.get("/api/ports/{port_id}/inventory")
def get_inventory(port_id: str, db: Session = Depends(get_db)):
    get_port_or_404(db, port_id)
    warehouses = db.query(Warehouse).filter(Warehouse.port_id == port_id).all()
    cargos = db.query(CargoItem).filter(CargoItem.port_id == port_id).all()

    wh_list = []
    alerts = []
    for w in warehouses:
        util_pct = round((w.utilized_mt / max(w.capacity_mt, 1.0)) * 100, 1)
        available_mt = round(max(0.0, w.capacity_mt - w.utilized_mt), 1)
        capacity_state = "Normal"
        if util_pct >= 95:
            capacity_state = "Overflow Risk"
            alerts.append({
                "warehouse_code": w.code,
                "severity": "Critical",
                "message": f"{w.name} ({w.code}) at {util_pct}% – immediate evacuation required.",
            })
        elif util_pct >= 85:
            capacity_state = "Near Capacity"
            alerts.append({
                "warehouse_code": w.code,
                "severity": "High",
                "message": f"{w.name} ({w.code}) approaching maximum capacity ({util_pct}%).",
            })
        elif util_pct <= 20:
            capacity_state = "Underutilized"

        stored_items = [
            {
                "tracking_code": c.tracking_code,
                "commodity": c.commodity,
                "quantity_mt": c.quantity_mt,
                "storage_days": c.storage_days,
                "status": c.status,
            }
            for c in cargos
            if c.warehouse_code == w.code and c.status != "Dispatched"
        ]
        wh_list.append({
            "id": w.id,
            "code": w.code,
            "name": w.name,
            "facility_type": w.facility_type,
            "capacity_mt": w.capacity_mt,
            "utilized_mt": w.utilized_mt,
            "available_mt": available_mt,
            "utilization_pct": util_pct,
            "avg_dwell_days": w.avg_dwell_days,
            "temperature_controlled": w.temperature_controlled,
            "capacity_state": capacity_state,
            "stored_cargo": stored_items,
        })

    total_cap = sum(w.capacity_mt for w in warehouses) or 1.0
    total_used = sum(w.utilized_mt for w in warehouses)
    return {
        "summary": {
            "total_capacity_mt": total_cap,
            "total_utilized_mt": total_used,
            "total_available_mt": round(max(0.0, total_cap - total_used), 1),
            "overall_utilization_pct": round((total_used / total_cap) * 100, 1),
            "near_capacity_count": sum(1 for item in wh_list if item["utilization_pct"] >= 85),
        },
        "warehouses": wh_list,
        "alerts": alerts,
    }


@app.post("/api/ports/{port_id}/inventory/adjust")
def adjust_inventory(
    port_id: str,
    payload: InventoryAdjustRequest,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    wh = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id, Warehouse.port_id == port_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse or yard not found")

    new_utilized = wh.utilized_mt + payload.delta_mt
    if new_utilized < 0:
        raise HTTPException(status_code=400, detail="Cannot remove more cargo than currently stored in facility.")

    wh.utilized_mt = round(new_utilized, 1)
    util_pct = round((wh.utilized_mt / max(wh.capacity_mt, 1.0)) * 100, 1)

    if util_pct >= 90:
        db.add(
            RiskAlert(
                id=f"rk-{uuid.uuid4().hex[:6]}",
                port_id=port_id,
                category="Inventory Overflow",
                severity="Critical" if util_pct >= 95 else "High",
                title=f"Storage alert: {wh.code} at {util_pct}% capacity",
                description=f"Inventory adjustment ({payload.reason}) pushed {wh.name} to {wh.utilized_mt:,.0f} / {wh.capacity_mt:,.0f} MT.",
                affected_entity=f"Warehouse {wh.code}",
                recommended_action="Reroute incoming cargo to alternate staging yard or schedule immediate dispatch.",
                status="Active",
            )
        )

    db.commit()
    return get_inventory(port_id, db)


# ---------- 2.8 Port Congestion Monitoring ----------
@app.get("/api/ports/{port_id}/congestion")
def get_congestion(port_id: str, db: Session = Depends(get_db)):
    port = get_port_or_404(db, port_id)
    return compute_congestion_metrics(db, port)


@app.post("/api/ports/{port_id}/congestion/predict")
def predict_congestion_ml(
    port_id: str,
    payload: CongestionPredictRequest,
    db: Session = Depends(get_db),
):
    """
    ML-powered congestion prediction for the next 24 hours.

    Pulls live berth/vessel state from the database and augments it with any
    overrides or weather values supplied in the request body.  Returns the
    model's predicted waiting-vessel count and congestion level alongside the
    current rule-based metrics so the frontend can display both side-by-side.

    Supported ports: Mangalore (INIXE / INNML) and Kochi (INCOK).
    For other ports the endpoint still returns current rule-based congestion
    with ml_prediction=null and a message explaining why.
    """
    port = get_port_or_404(db, port_id)

    # Always return the live rule-based congestion first
    current = compute_congestion_metrics(db, port)

    # Check whether this port's code is known to the model
    _SUPPORTED_CODES = {"INIXE", "INNML", "INCOK"}
    if port.code not in _SUPPORTED_CODES:
        return {
            **current,
            "ml_prediction": None,
            "ml_message": (
                f"ML congestion model does not yet cover port {port.code}. "
                "Showing rule-based congestion metrics only."
            ),
        }

    # Build a 7-day waiting history from the congestion trend data
    trends = current.get("trends", [])
    history_7 = [t["waiting_vessels"] for t in trends]
    # Pad / trim to exactly 7 entries (oldest first)
    while len(history_7) < 7:
        history_7.insert(0, current["waiting_vessels"])
    history_7 = history_7[-7:]

    # Gather live berth counts
    from .models import Berth as _Berth, Vessel as _Vessel
    berths_q   = db.query(_Berth).filter(_Berth.port_id == port_id).all()
    vessels_q  = db.query(_Vessel).filter(_Vessel.port_id == port_id).all()

    berthed_live  = sum(1 for b in berths_q if b.status == "Occupied")
    waiting_live  = sum(1 for v in vessels_q if v.status in ("Anchored", "Delayed"))
    total_berths  = len(berths_q) or port.max_berths

    # Step 5 — fetch live weather and use it when caller hasn't provided overrides
    live_wx = fetch_live_weather(port.latitude, port.longitude, port_id)
    wave_input     = payload.wave_height_forecast_m   if payload.wave_height_forecast_m   is not None else live_wx["wave_height_m"]
    wind_input     = payload.wind_speed_forecast_kmh  if payload.wind_speed_forecast_kmh  is not None else round(live_wx["wind_knots"] * 1.852, 1)

    # Request-body values override the live DB values when provided
    ml_input = CongestionInput(
        port_code=port.code,
        waiting_vessels=payload.waiting_vessels  if payload.waiting_vessels  is not None else waiting_live,
        berthed_vessels=payload.berthed_vessels  if payload.berthed_vessels  is not None else berthed_live,
        total_berths=payload.total_berths        if payload.total_berths     is not None else total_berths,
        waiting_last_7_days=history_7,
        expected_arrivals_24h=payload.expected_arrivals_24h,
        wave_height_forecast_m=wave_input,
        wind_speed_forecast_kmh=wind_input,
    )

    result = _ml_predict_congestion(ml_input)

    return {
        **current,
        "ml_prediction": {
            "status": result.status,
            "port_code_used": result.port_code_used,
            "predicted_waiting_vessels_24h": result.predicted_waiting_vessels,
            "predicted_congestion_level_24h": result.congestion_level,
            "message": result.message,
            "weather_used": {
                "wave_height_m": wave_input,
                "wind_speed_kmh": wind_input,
                "source": live_wx.get("source", ""),
            },
        },
    }


@app.get("/api/ports/{port_id}/congestion/predict")
def predict_congestion_ml_get(
    port_id: str,
    wave_height_forecast_m: Optional[float] = Query(default=None),
    wind_speed_forecast_kmh: Optional[float] = Query(default=None),
    expected_arrivals_24h: Optional[float] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Convenience GET version of the ML prediction endpoint —
    accepts weather inputs as query params (no request body needed).
    Useful for quick dashboard polling.
    """
    req = CongestionPredictRequest(
        wave_height_forecast_m=wave_height_forecast_m,
        wind_speed_forecast_kmh=wind_speed_forecast_kmh,
        expected_arrivals_24h=expected_arrivals_24h,
    )
    return predict_congestion_ml(port_id, req, db)


# ---------- 2.9 Demand Forecasting & 2.10 Supply-Demand Analysis ----------
@app.get("/api/ports/{port_id}/forecast")
def get_forecast(port_id: str, db: Session = Depends(get_db)):
    port = get_port_or_404(db, port_id)
    return build_forecast_and_supply_demand(db, port)


# ---------- 2.6 Live Weather ----------------------------------------
@app.get("/api/ports/{port_id}/weather")
def get_weather(port_id: str, db: Session = Depends(get_db)):
    """
    Live weather for a port from OpenWeatherMap (cached 10 min).
    Falls back to route-table estimates when no API key is set.
    """
    port = get_port_or_404(db, port_id)
    return fetch_live_weather(port.latitude, port.longitude, port_id)


# ---------- 2.11 Risk Management ----------
@app.get("/api/ports/{port_id}/risks")
def list_risks(port_id: str, db: Session = Depends(get_db)):
    port = get_port_or_404(db, port_id)
    risks = db.query(RiskAlert).filter(RiskAlert.port_id == port_id).order_by(RiskAlert.created_at.desc()).all()

    # Step 4 — use live weather; fall back to route-table values if needed
    live_wx = fetch_live_weather(port.latitude, port.longitude, port_id)
    avg_wave = live_wx["wave_height_m"]
    max_wind = live_wx["wind_knots"]

    return {
        "weather": {
            "sea_state":     live_wx["sea_state"],
            "wave_height_m": avg_wave,
            "wind_knots":    max_wind,
            "visibility_nm": live_wx["visibility_nm"],
            "temperature_c": live_wx.get("temperature_c", 28.0),
            "description":   live_wx.get("description", ""),
            "tidal_window":  live_wx["tidal_window"],
            "source":        live_wx.get("source", ""),
            "fetched_at":    live_wx.get("fetched_at", ""),
        },
        "risks": [
            {
                "id": r.id,
                "category": r.category,
                "severity": r.severity,
                "title": r.title,
                "description": r.description,
                "affected_entity": r.affected_entity,
                "recommended_action": r.recommended_action,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in risks
        ],
    }


@app.post("/api/ports/{port_id}/risks", status_code=201)
def create_risk(
    port_id: str,
    payload: RiskCreate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    get_port_or_404(db, port_id)
    risk = RiskAlert(
        id=f"rk-{uuid.uuid4().hex[:6]}",
        port_id=port_id,
        category=payload.category,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        affected_entity=payload.affected_entity,
        recommended_action=payload.recommended_action,
        status="Active",
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return {
        "id": risk.id,
        "category": risk.category,
        "severity": risk.severity,
        "title": risk.title,
        "status": risk.status,
    }


@app.patch("/api/ports/{port_id}/risks/{risk_id}")
def update_risk(
    port_id: str,
    risk_id: str,
    payload: RiskUpdate,
    db: Session = Depends(get_db),
    x_port_scope: Optional[str] = Header(default=None),
):
    verify_port_authority_scope(port_id, x_port_scope)
    risk = db.query(RiskAlert).filter(RiskAlert.id == risk_id, RiskAlert.port_id == port_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk alert not found")
    risk.status = payload.status
    if payload.resolution_note:
        risk.recommended_action = f"{risk.recommended_action} | Note: {payload.resolution_note}"
    db.commit()
    db.refresh(risk)
    return {"id": risk.id, "status": risk.status, "recommended_action": risk.recommended_action}


# ---------- 2.12 Coastal Route Monitoring ----------
@app.get("/api/ports/{port_id}/routes")
def list_coastal_routes(port_id: str, db: Session = Depends(get_db)):
    get_port_or_404(db, port_id)
    routes = db.query(CoastalRoute).filter(CoastalRoute.origin_port_id == port_id).all()
    if not routes:
        # Provide regional routes connected to this port
        routes = db.query(CoastalRoute).all()
    return [
        {
            "id": r.id,
            "origin_port_id": r.origin_port_id,
            "origin_port_name": r.origin_port_name,
            "destination_port_name": r.destination_port_name,
            "distance_nm": r.distance_nm,
            "estimated_hours": r.estimated_hours,
            "weather_status": r.weather_status,
            "wave_height_m": r.wave_height_m,
            "wind_knots": r.wind_knots,
            "disruption_level": r.disruption_level,
            "disruption_note": r.disruption_note,
            "active_vessels_count": r.active_vessels_count,
            "waypoints": json.loads(r.waypoints_json or "[]"),
        }
        for r in routes
    ]


# ---------- 2.13 Reports and Analytics ----------
@app.get("/api/ports/{port_id}/reports")
def get_reports(
    port_id: str,
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
):
    port = get_port_or_404(db, port_id)
    return build_report_data(db, port, period)


@app.get("/api/ports/{port_id}/reports/export")
def export_reports(
    port_id: str,
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    format: str = Query(default="csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
):
    port = get_port_or_404(db, port_id)
    report = build_report_data(db, port, period)

    if format == "json":
        return Response(
            content=json.dumps(report, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{port_id}-{period}-report.json"'},
        )

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Port", "Code", "Period", "Generated At"])
    writer.writerow([report["port_name"], report["port_code"], period, report["generated_at"]])
    writer.writerow([])
    writer.writerow(["Time Slice", "Throughput (MT)", "Avg Turnaround (hrs)", "Berth Utilization (%)", "Congestion (%)"])
    for row in report["series"]:
        writer.writerow([
            row["label"],
            row["throughput_mt"],
            row["turnaround_hrs"],
            row["berth_utilization_pct"],
            row["congestion_pct"],
        ])
    writer.writerow([])
    writer.writerow(["Cargo Tracking", "Type", "Commodity", "Quantity (MT)", "Operation", "Status"])
    for c in report["cargo_performance"]:
        writer.writerow([
            c["tracking_code"],
            c["cargo_type"],
            c["commodity"],
            c["quantity_mt"],
            c["operation"],
            c["status"],
        ])

    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{port_id}-{period}-report.csv"'},
    )


# ---------- Shipping Company Reports ----------
@app.get("/api/shipping/reports")
def get_shipping_reports(
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
):
    """Voyage-level performance reports for the Shipping Company role."""
    from datetime import datetime, timezone

    mult = {"daily": 0.04, "weekly": 0.25, "monthly": 1.0}.get(period, 0.25)
    labels = {
        "daily":   ["00:00","04:00","08:00","12:00","16:00","20:00"],
        "weekly":  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        "monthly": ["Wk 1","Wk 2","Wk 3","Wk 4"],
    }.get(period, ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"])

    base_mt      = 5420.0 * mult
    base_rev     = 3800000 * mult
    on_time_pct  = 83
    util_pct     = 86
    avg_turn_hrs = 13.0

    series = []
    for idx, lbl in enumerate(labels):
        f = 0.85 + (idx % 4) * 0.1
        series.append({
            "label":          lbl,
            "mt":             round((base_mt / len(labels)) * f, 1),
            "voyages":        max(1, round(18 * mult / len(labels))),
            "revenue_inr":    round((base_rev / len(labels)) * f),
        })

    vessel_perf = [
        {"vessel": "MV Bharat",      "voyages": round(7*mult), "mt": round(2200*mult), "util": 94, "on_time": "86%"},
        {"vessel": "SS Konkan",       "voyages": round(4*mult), "mt": round(1400*mult), "util": 80, "on_time": "75%"},
        {"vessel": "MV Deccan Star",  "voyages": round(4*mult), "mt": round(1200*mult), "util": 76, "on_time": "100%"},
        {"vessel": "MV Sahyadri",     "voyages": round(3*mult), "mt": round(620*mult),  "util": 58, "on_time": "67%"},
    ]

    cargo_history = [
        {"shipment": "SHP-5041", "cargo": "Basmati Rice",   "qty_mt": 500,  "from": "Mangalore", "to": "Kochi",    "cost_inr": 185000, "status": "In Transit",  "vessel": "MV Bharat"},
        {"shipment": "SHP-5040", "cargo": "Steel",           "qty_mt": 300,  "from": "Mumbai",    "to": "Mangalore","cost_inr": 145000, "status": "Delivered",    "vessel": "SS Konkan"},
        {"shipment": "SHP-5039", "cargo": "Coal",            "qty_mt": 200,  "from": "Kochi",     "to": "Tuticorin","cost_inr": 92000,  "status": "In Transit",  "vessel": "MV Deccan Star"},
        {"shipment": "SHP-5038", "cargo": "Spices",          "qty_mt": 150,  "from": "Mormugao",  "to": "Mumbai",   "cost_inr": 68000,  "status": "Delayed",     "vessel": "MV Sahyadri"},
        {"shipment": "SHP-5037", "cargo": "Cement",          "qty_mt": 420,  "from": "Mangalore", "to": "Chennai",  "cost_inr": 178000, "status": "Delivered",   "vessel": "MV Western Ghats"},
    ]

    return {
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "voyages_completed": round(18 * mult),
            "cargo_moved_mt":    round(base_mt, 1),
            "on_time_pct":       on_time_pct,
            "avg_turnaround_hrs":avg_turn_hrs,
            "revenue_inr":       round(base_rev),
            "utilization_pct":   util_pct,
            "delayed_voyages":   round(2 * mult),
        },
        "series":        series,
        "vessel_perf":   vessel_perf,
        "cargo_history": cargo_history,
    }


@app.get("/api/shipping/reports/export")
def export_shipping_reports(
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    format: str = Query(default="csv", pattern="^(csv|json)$"),
):
    report = get_shipping_reports.__wrapped__(period) if hasattr(get_shipping_reports, "__wrapped__") else get_shipping_reports(period)
    # re-call to get the dict
    from datetime import datetime, timezone
    mult = {"daily": 0.04, "weekly": 0.25, "monthly": 1.0}.get(period, 0.25)
    # Delegate to helper
    data = get_shipping_reports(period=period)
    if format == "json":
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="shipping-{period}-report.json"'},
        )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Shipping Company Report", period, data["generated_at"]])
    writer.writerow([])
    writer.writerow(["Shipment","Cargo","Qty (MT)","From","To","Cost (INR)","Status","Vessel"])
    for c in data["cargo_history"]:
        writer.writerow([c["shipment"],c["cargo"],c["qty_mt"],c["from"],c["to"],c["cost_inr"],c["status"],c["vessel"]])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="shipping-{period}-report.csv"'},
    )


# ---------- Cargo Owner Reports & Forecast ----------
@app.get("/api/cargo/reports")
def get_cargo_reports(
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
):
    """Shipment cost and movement reports for the Cargo Owner role."""
    from datetime import datetime, timezone

    mult = {"daily": 0.04, "weekly": 0.25, "monthly": 1.0}.get(period, 0.25)
    labels = {
        "daily":   ["00:00","04:00","08:00","12:00","16:00","20:00"],
        "weekly":  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        "monthly": ["Wk 1","Wk 2","Wk 3","Wk 4"],
    }.get(period, ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"])

    base_mt   = 1830.0 * mult
    base_cost = 756000 * mult

    series = []
    for idx, lbl in enumerate(labels):
        f = 0.85 + (idx % 4) * 0.1
        series.append({
            "label":    lbl,
            "mt":       round((base_mt   / len(labels)) * f, 1),
            "cost_inr": round((base_cost / len(labels)) * f),
        })

    cargo_history = [
        {"shipment":"SHP-5041","cargo":"Basmati Rice","qty":"500 MT","from":"Mangalore","to":"Kochi",   "cost":185000,"status":"In Transit", "date":"Dec 16"},
        {"shipment":"SHP-5038","cargo":"Spices",       "qty":"150 MT","from":"Mormugao", "to":"Mumbai",  "cost":92000, "status":"Delayed",    "date":"Dec 16"},
        {"shipment":"SHP-5035","cargo":"Fertilizer",   "qty":"280 MT","from":"Chennai",  "to":"Mangalore","cost":128000,"status":"Delivered","date":"Dec 14"},
        {"shipment":"SHP-5033","cargo":"Cardamom",     "qty":"30 MT", "from":"Kochi",    "to":"Mumbai",  "cost":68000, "status":"Delivered",  "date":"Dec 12"},
    ]

    return {
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "shipments":       round(7 * mult),
            "delivered":       round(5 * mult),
            "delayed":         round(1 * mult),
            "cargo_moved_mt":  round(base_mt, 1),
            "total_cost_inr":  round(base_cost),
            "avg_cost_per_mt": 413,
        },
        "series":        series,
        "cargo_history": cargo_history,
    }


@app.get("/api/cargo/reports/export")
def export_cargo_reports(
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    format: str = Query(default="csv", pattern="^(csv|json)$"),
):
    data = get_cargo_reports(period=period)
    if format == "json":
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="cargo-{period}-report.json"'},
        )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Cargo Owner Report", period, data["generated_at"]])
    writer.writerow([])
    writer.writerow(["Shipment","Cargo","Quantity","From","To","Cost (INR)","Status","Date"])
    for c in data["cargo_history"]:
        writer.writerow([c["shipment"],c["cargo"],c["qty"],c["from"],c["to"],c["cost"],c["status"],c["date"]])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="cargo-{period}-report.csv"'},
    )


@app.get("/api/cargo/forecast")
def get_cargo_forecast():
    """Demand forecast data for the Cargo Owner role."""
    return {
        "categories": [
            {"key":"rice",    "name":"Basmati Rice",          "unit":"MT","trend":"up",  "weekly_demand":560,"monthly_demand":2400,
             "history":[420,450,480,500,520,540,560],"forecast":[580,610,640,670],"growth_pct":8.5},
            {"key":"spices",  "name":"Spices (Cardamom/Pepper)","unit":"MT","trend":"down","weekly_demand":18, "monthly_demand":75,
             "history":[35,32,30,28,25,22,20],"forecast":[18,16,15,14],"growth_pct":-11.0},
            {"key":"oil",     "name":"Coconut Oil",            "unit":"MT","trend":"up",  "weekly_demand":68, "monthly_demand":290,
             "history":[40,42,48,52,58,62,65],"forecast":[70,74,78,82],"growth_pct":6.2},
            {"key":"steel",   "name":"Steel Rods",             "unit":"MT","trend":"down","weekly_demand":124,"monthly_demand":520,
             "history":[150,155,148,142,138,130,128],"forecast":[125,122,120,118],"growth_pct":-3.8},
        ],
        "history_labels": ["W1","W2","W3","W4","W5","W6","W7"],
        "forecast_labels": ["F1","F2","F3","F4"],
    }


@app.get("/api/cargo/inventory")
def get_cargo_inventory():
    """Port storage inventory visible to the Cargo Owner."""
    from datetime import datetime, timezone
    return {
        "items": [
            {"id":"INV-001","cargo":"Basmati Rice","category":"Agricultural","port":"Mangalore Port",
             "warehouse":"WH-A1","qty_stored":500,"qty_max":600,"unit":"MT",
             "arrival_date":"2024-12-16","eta_departure":"2024-12-16","days_stored":1,"status":"Dispatched"},
            {"id":"INV-002","cargo":"Cardamom","category":"Spice","port":"Kochi Port",
             "warehouse":"WH-B2","qty_stored":25,"qty_max":50,"unit":"MT",
             "arrival_date":"2024-12-10","eta_departure":"2024-12-20","days_stored":8,"status":"Stored"},
            {"id":"INV-003","cargo":"Pepper (Black)","category":"Spice","port":"Kochi Port",
             "warehouse":"WH-B2","qty_stored":15,"qty_max":30,"unit":"MT",
             "arrival_date":"2024-12-08","eta_departure":"2024-12-22","days_stored":10,"status":"Storage Alert"},
            {"id":"INV-004","cargo":"Steel Rods","category":"Metals","port":"Mumbai (JNPT)",
             "warehouse":"WH-C1","qty_stored":120,"qty_max":200,"unit":"MT",
             "arrival_date":"2024-12-14","eta_departure":"2024-12-21","days_stored":4,"status":"Stored"},
            {"id":"INV-005","cargo":"Coconut Oil","category":"Food","port":"Kochi Port",
             "warehouse":"WH-D1","qty_stored":60,"qty_max":100,"unit":"MT",
             "arrival_date":"2024-12-11","eta_departure":"2024-12-23","days_stored":7,"status":"Stored"},
        ],
        "movements": [
            {"date":"Dec 16","cargo":"Basmati Rice","qty_mt":500,"type":"Dispatch","port":"Mangalore Port","warehouse":"WH-A1"},
            {"date":"Dec 14","cargo":"Steel Rods",   "qty_mt":120,"type":"Arrival", "port":"Mumbai (JNPT)","warehouse":"WH-C1"},
            {"date":"Dec 11","cargo":"Coconut Oil",  "qty_mt":60, "type":"Arrival", "port":"Kochi Port",   "warehouse":"WH-D1"},
            {"date":"Dec 10","cargo":"Cardamom",     "qty_mt":25, "type":"Arrival", "port":"Kochi Port",   "warehouse":"WH-B2"},
            {"date":"Dec 08","cargo":"Pepper",       "qty_mt":15, "type":"Arrival", "port":"Kochi Port",   "warehouse":"WH-B2"},
        ],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/cargo/shipments/{shipment_id}/events")
def get_shipment_events(shipment_id: str):
    """Event history for a specific shipment — used by cargo owner tracking screen."""
    events_map = {
        "SHP-5041": [
            {"time":"Dec 16, 08:00","event":"Vessel MV Bharat departed Mangalore Port","type":"info"},
            {"time":"Dec 16, 14:30","event":"Cargo loading completed — 500 MT Rice confirmed at Berth B2","type":"success"},
            {"time":"Dec 17, 10:00","event":"High swell advisory issued for Mangalore–Kochi corridor","type":"warning"},
            {"time":"Dec 17, 16:00","event":"Vessel speed reduced to 10 kn due to weather conditions","type":"warning"},
            {"time":"Dec 18, 06:00","event":"Vessel approaching Kochi Port, ETA confirmed 14:30","type":"info"},
        ],
        "SHP-5038": [
            {"time":"Dec 16, 06:00","event":"Vessel MV Sahyadri departed Mormugao Port","type":"info"},
            {"time":"Dec 16, 18:00","event":"Route deviation detected — 4.2 NM off planned track","type":"warning"},
            {"time":"Dec 17, 09:00","event":"ETA revised to Dec 18, 17:00 (+3 hours delay)","type":"warning"},
            {"time":"Dec 17, 14:00","event":"Vessel back on track, speed 11 kn","type":"info"},
        ],
    }
    events = events_map.get(shipment_id, [
        {"time":"—","event":"No event history available for this shipment","type":"info"},
    ])
    return {"shipment_id": shipment_id, "events": events}


@app.get("/api/shipping/weather")
def get_shipping_weather():
    """Live weather for the Shipping Company role — uses Mangalore coordinates as default."""
    from .services import fetch_live_weather
    wx = fetch_live_weather(12.9279, 74.8056, "shipping_default")
    return wx


# ---------- Ship Routing (weather-aware) ----------
_ROUTING_UNAVAILABLE = HTTPException(
    status_code=503,
    detail=(
        "Ship routing module is unavailable. "
        "Ensure networkx and requests are installed: pip install networkx requests"
    ),
)


@app.get("/api/routing/ports")
def routing_list_ports():
    """
    List all ports and waypoints in the routing graph.
    Returns {node_id: display_name} for every port node.
    """
    if _ROUTING_GRAPH is None:
        raise _ROUTING_UNAVAILABLE
    return _sr_list_ports(_ROUTING_GRAPH)


@app.get("/api/routing/vessel-types")
def routing_vessel_types():
    """
    Return the available vessel type presets and their key parameters.
    """
    if _VESSEL_PRESETS is None:
        raise _ROUTING_UNAVAILABLE
    result = {}
    for name, vp in _VESSEL_PRESETS.items():
        result[name] = {
            "vessel_type":       vp.vessel_type,
            "service_speed_kn":  vp.service_speed_kn,
            "draft_m":           vp.draft_m,
            "max_wave_height_m": vp.max_wave_height_m,
            "max_wind_speed_kn": vp.max_wind_speed_kn,
            "notes":             vp.notes,
        }
    return result


class _VesselSpecs(BaseModel):
    draft_m:           Optional[float] = None
    max_wave_height_m: Optional[float] = None
    max_wind_speed_kn: Optional[float] = None


class _RouteRequest(BaseModel):
    source_port:      str
    destination_port: str
    vessel_type:      str                   = "container_ship"
    vessel_speed:     Optional[float]       = None   # knots; overrides preset
    vessel_specs:     Optional[_VesselSpecs] = None
    departure_time:   Optional[str]         = None   # ISO-8601, UTC recommended


@app.post("/api/routing/plan")
def routing_plan(req: _RouteRequest):
    """
    Weather-aware ship route planning.

    Uses real Open-Meteo marine + wind forecasts for every waypoint along
    the route.  Returns both the weather-aware recommended route and the
    shortest-distance alternative for comparison.

    Request body fields:
      source_port      – port node id (e.g. "INNML") or name fragment (e.g. "mangalore")
      destination_port – same
      vessel_type      – one of: container_ship, bulk_carrier, tanker,
                         general_cargo, small_coastal_vessel  (default: container_ship)
      vessel_speed     – service speed in knots (optional, overrides preset)
      vessel_specs     – optional overrides: draft_m, max_wave_height_m, max_wind_speed_kn
      departure_time   – ISO-8601 string (optional, defaults to now UTC)

    This endpoint is a plain `def` (not async) so the blocking Open-Meteo
    HTTP calls run in a thread pool and do not block the event loop.
    """
    if _ROUTING_GRAPH is None:
        raise _ROUTING_UNAVAILABLE

    request_dict = req.model_dump(exclude_none=True)
    # vessel_specs is a Pydantic model — convert to plain dict for routing.py
    if "vessel_specs" in request_dict and hasattr(request_dict["vessel_specs"], "__dict__"):
        request_dict["vessel_specs"] = {
            k: v for k, v in vars(request_dict["vessel_specs"]).items() if v is not None
        }

    result = _sr_to_json_safe(
        _sr_plan_route(_ROUTING_GRAPH, request_dict, _ROUTING_PROVIDER, _ROUTING_CONFIG)
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=422, detail=result.get("error", "routing error"))

    return result
