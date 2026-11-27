"""
Port Congestion Prediction – backend integration module.

Loads the trained HistGradientBoosting pipeline once at process start
(via module-level singleton) and exposes a single public function:

    predict_congestion(payload: CongestionInput) -> CongestionPrediction

The model was trained on port codes INNML (Mangalore) and INCOK (Kochi).
The backend seed uses different IATA codes (INIXE / INCOK), so a small
mapping table normalises them before inference.
"""

import os
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

# ---------------------------------------------------------------------------
# Path resolution – model sits next to this file
# ---------------------------------------------------------------------------
_MODEL_PATH = Path(__file__).parent / "congestion_model.pkl"

# ---------------------------------------------------------------------------
# Port-code normalisation
# Backend seed code  →  model training code
# ---------------------------------------------------------------------------
_PORT_CODE_MAP: dict[str, str] = {
    "INIXE": "INNML",   # Mangalore Port
    "INNML": "INNML",   # already correct
    "INCOK": "INCOK",   # Kochi Port – same in both
}


@lru_cache(maxsize=1)
def _load_bundle() -> dict:
    """Load the pkl once and cache it for the lifetime of the process."""
    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Congestion model not found at {_MODEL_PATH}. "
            "Ensure congestion_model.pkl is present in backend/app/ml/."
        )
    return joblib.load(_MODEL_PATH)


# ---------------------------------------------------------------------------
# Pydantic I/O schemas  (used directly by the FastAPI endpoint)
# ---------------------------------------------------------------------------

class CongestionInput(BaseModel):
    """
    All fields the model needs for a single-port, single-day prediction.

    waiting_last_7_days must be ordered oldest-first so that
    waiting_last_7_days[-1] is yesterday and [-7] is 7 days ago.
    """
    port_code: str = Field(..., description="IATA/UN port code e.g. INIXE or INNML")
    observed_at: Optional[str] = Field(
        default=None,
        description="ISO-8601 timestamp for the observation (defaults to now)"
    )
    waiting_vessels: int = Field(..., ge=0, description="Vessels currently waiting (anchored/delayed)")
    berthed_vessels: int = Field(..., ge=0, description="Vessels currently at a berth")
    total_berths: int = Field(..., ge=1, description="Total berth slots at the port")
    waiting_last_7_days: List[float] = Field(
        ..., min_length=7, max_length=7,
        description="Daily waiting-vessel counts for the past 7 days, oldest first"
    )
    expected_arrivals_24h: Optional[float] = Field(default=None, ge=0)
    wave_height_forecast_m: Optional[float] = Field(default=None, ge=0)
    wind_speed_forecast_kmh: Optional[float] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _check_berths(self) -> "CongestionInput":
        if self.berthed_vessels > self.total_berths:
            raise ValueError("berthed_vessels cannot exceed total_berths")
        return self


class CongestionPrediction(BaseModel):
    status: str                                   # "ok" | "error"
    port_code_used: Optional[str] = None          # normalised code sent to model
    predicted_waiting_vessels: Optional[float] = None
    congestion_level: Optional[str] = None        # Low / Moderate / High / Critical
    message: Optional[str] = None                 # only set on error


# ---------------------------------------------------------------------------
# Public prediction function
# ---------------------------------------------------------------------------

def predict_congestion(payload: CongestionInput) -> CongestionPrediction:
    """
    Run the congestion model and return a structured prediction.

    Returns CongestionPrediction(status="error", message=...) on any
    recoverable failure so callers never receive an unhandled exception.
    """
    try:
        bundle = _load_bundle()
        pipeline   = bundle["pipeline"]
        thresholds = bundle["thresholds"]     # dict: port_code -> [t1, t2, t3]
        known_ports = bundle["known_ports"]   # set / list of known codes

        # Normalise the incoming port code to what the model was trained on
        model_port_code = _PORT_CODE_MAP.get(payload.port_code.upper())
        if model_port_code is None or model_port_code not in known_ports:
            return CongestionPrediction(
                status="error",
                message=(
                    f"Port code '{payload.port_code}' is not supported by the congestion model. "
                    f"Supported codes: {sorted(known_ports)}"
                ),
            )

        # Build the row the preprocessing module expects.
        # Support both package-relative import (FastAPI runtime) and
        # direct script execution (testing / standalone use).
        try:
            from . import preprocessing  # package context (backend.app.ml)
        except ImportError:
            import preprocessing  # standalone context (script/test)

        history = list(payload.waiting_last_7_days)   # 7 elements, oldest first
        row: dict = {
            "port_code": model_port_code,
            "date": pd.to_datetime(payload.observed_at) if payload.observed_at else pd.Timestamp.utcnow(),
            "waiting_vessels": float(payload.waiting_vessels),
            "berthed_vessels": float(payload.berthed_vessels),
            "total_berths": float(payload.total_berths),
            "expected_arrivals_24h": payload.expected_arrivals_24h,
            "wave_height_forecast_m": payload.wave_height_forecast_m,
            "wind_speed_forecast_kmh": payload.wind_speed_forecast_kmh,
        }
        # Lags: wait_lag_1 = yesterday (history[-2]), ..., wait_lag_6 = 6 days ago (history[-7])
        for i in range(1, 7):
            row[f"wait_lag_{i}"] = float(history[-1 - i])

        df = pd.DataFrame([row])
        df = preprocessing.make_features(df)

        raw_pred = pipeline.predict(df[preprocessing.FEATURES])
        pred_vessels = float(np.clip(raw_pred, 0, None)[0])
        rounded = int(np.floor(pred_vessels + 0.5))
        level = preprocessing.congestion_level(rounded, thresholds[model_port_code])

        return CongestionPrediction(
            status="ok",
            port_code_used=model_port_code,
            predicted_waiting_vessels=round(pred_vessels, 2),
            congestion_level=level,
        )

    except Exception as exc:  # noqa: BLE001
        return CongestionPrediction(status="error", message=str(exc))
