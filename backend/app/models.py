from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Port(Base):
    __tablename__ = "ports"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)
    region = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    max_berths = Column(Integer, nullable=False, default=6)
    max_storage_mt = Column(Float, nullable=False, default=180000.0)
    channel_depth_m = Column(Float, nullable=False, default=15.1)
    operating_hours = Column(String, nullable=False, default="24/7 All-Weather")
    facilities_json = Column(Text, nullable=False, default="[]")
    efficiency_score = Column(Float, nullable=False, default=87.0)
    avg_turnaround_hrs = Column(Float, nullable=False, default=18.6)
    turnaround_delta_pct = Column(Float, nullable=False, default=-12.0)
    efficiency_delta_pct = Column(Float, nullable=False, default=5.0)
    total_cargo_handled_mt = Column(Float, nullable=False, default=142850.0)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    berths = relationship("Berth", back_populates="port", cascade="all, delete-orphan")
    vessels = relationship("Vessel", back_populates="port", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="port", cascade="all, delete-orphan")
    cargos = relationship("CargoItem", back_populates="port", cascade="all, delete-orphan")
    risks = relationship("RiskAlert", back_populates="port", cascade="all, delete-orphan")


class Berth(Base):
    __tablename__ = "berths"

    id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.id"), nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    berth_type = Column(String, nullable=False)
    max_length_m = Column(Float, nullable=False, default=260.0)
    max_draft_m = Column(Float, nullable=False, default=14.0)
    capacity_mt = Column(Float, nullable=False, default=55000.0)
    status = Column(String, nullable=False, default="Available")  # Available, Occupied, Maintenance
    current_vessel_id = Column(String, nullable=True)
    current_vessel_name = Column(String, nullable=True)
    operation = Column(String, nullable=True)  # Loading, Unloading, None
    progress_pct = Column(Integer, nullable=False, default=0)
    occupied_since = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)
    utilization_pct = Column(Float, nullable=False, default=67.0)

    port = relationship("Port", back_populates="berths")


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.id"), nullable=False)
    name = Column(String, nullable=False)
    imo_number = Column(String, nullable=False)
    shipping_company = Column(String, nullable=False)
    vessel_type = Column(String, nullable=False)  # Container, Bulk Carrier, Tanker, Coastal Feeder
    capacity_dwt = Column(Float, nullable=False)
    length_m = Column(Float, nullable=False)
    draft_m = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # En Route, At Berth, Anchored, Delayed, Departing
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    map_x = Column(Float, nullable=False)  # 0-100 normalized viewport coordinate
    map_y = Column(Float, nullable=False)
    speed_knots = Column(Float, nullable=False, default=12.5)
    heading_deg = Column(Float, nullable=False, default=110.0)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    eta_text = Column(String, nullable=False)
    eta_hours = Column(Float, nullable=False, default=0.0)
    assigned_berth_code = Column(String, nullable=True)
    route_deviation = Column(Boolean, nullable=False, default=False)
    deviation_nm = Column(Float, nullable=False, default=0.0)
    waypoints_json = Column(Text, nullable=False, default="[]")
    arrival_time = Column(DateTime, nullable=True)
    departure_time = Column(DateTime, nullable=True)
    # Private fields stored internally to verify access restrictions block them
    private_charter_rate_usd = Column(Float, nullable=False, default=24500.0)

    port = relationship("Port", back_populates="vessels")
    movements = relationship("VesselMovement", back_populates="vessel", cascade="all, delete-orphan")


class VesselMovement(Base):
    __tablename__ = "vessel_movements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(String, ForeignKey("vessels.id"), nullable=False)
    timestamp = Column(DateTime, default=utcnow)
    event_type = Column(String, nullable=False)
    location_label = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_knots = Column(Float, nullable=False)
    notes = Column(String, nullable=False, default="")

    vessel = relationship("Vessel", back_populates="movements")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.id"), nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    facility_type = Column(String, nullable=False)  # Covered Warehouse, Container Yard, Bulk Yard, Liquid Terminal
    capacity_mt = Column(Float, nullable=False)
    utilized_mt = Column(Float, nullable=False)
    avg_dwell_days = Column(Float, nullable=False, default=4.2)
    temperature_controlled = Column(Boolean, nullable=False, default=False)

    port = relationship("Port", back_populates="warehouses")


class CargoItem(Base):
    __tablename__ = "cargo_items"

    id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.id"), nullable=False)
    tracking_code = Column(String, nullable=False)
    cargo_type = Column(String, nullable=False)  # Containers, Dry Bulk, Liquid Bulk, Breakbulk
    commodity = Column(String, nullable=False)
    quantity_mt = Column(Float, nullable=False)
    owner_company = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vessel_name = Column(String, nullable=False)
    berth_code = Column(String, nullable=True)
    warehouse_code = Column(String, nullable=True)
    operation = Column(String, nullable=False)  # Import Unloading, Export Loading, Transit Storage
    status = Column(String, nullable=False)  # Scheduled, Unloading, Loading, Stored, Dispatched
    storage_days = Column(Integer, nullable=False, default=0)
    history_json = Column(Text, nullable=False, default="[]")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    port = relationship("Port", back_populates="cargos")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.id"), nullable=False)
    category = Column(String, nullable=False)  # Weather, Vessel Delay, Congestion, Inventory Overflow, Route Deviation
    severity = Column(String, nullable=False)  # Low, Moderate, High, Critical
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    affected_entity = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Active")  # Active, Acknowledged, Resolved
    created_at = Column(DateTime, default=utcnow)

    port = relationship("Port", back_populates="risks")


class CoastalRoute(Base):
    __tablename__ = "coastal_routes"

    id = Column(String, primary_key=True)
    origin_port_id = Column(String, nullable=False)
    origin_port_name = Column(String, nullable=False)
    destination_port_name = Column(String, nullable=False)
    distance_nm = Column(Float, nullable=False)
    estimated_hours = Column(Float, nullable=False)
    weather_status = Column(String, nullable=False)  # Clear, Moderate Swell, Rough Sea, Gale Advisory
    wave_height_m = Column(Float, nullable=False)
    wind_knots = Column(Float, nullable=False)
    disruption_level = Column(String, nullable=False)  # None, Minor Delay, High Risk
    disruption_note = Column(String, nullable=False)
    active_vessels_count = Column(Integer, nullable=False, default=1)
    waypoints_json = Column(Text, nullable=False, default="[]")
