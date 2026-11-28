"""Prediction script for port congestion."""
import os
import joblib
import numpy as np
import pandas as pd
from functools import lru_cache
from datetime import datetime
import preprocessing

@lru_cache(maxsize=1)
def load_bundle():
    return joblib.load("models/congestion_model.pkl")

def predict_congestion(input_data):
    try:
        bundle = load_bundle()
        pipeline = bundle["pipeline"]
        thresholds = bundle["thresholds"]
        known_ports = bundle["known_ports"]
        
        port = input_data.get("port_code")
        if not port or port not in known_ports:
            return {"status": "error", "message": f"Unknown port: {port}"}
            
        waiting_vessels = input_data.get("waiting_vessels")
        berthed_vessels = input_data.get("berthed_vessels")
        total_berths = input_data.get("total_berths")
        history = input_data.get("waiting_last_7_days", [])
        
        if waiting_vessels is None or berthed_vessels is None or total_berths is None or len(history) < 7:
            return {"status": "error", "message": "Missing core inputs or history data"}
            
        if berthed_vessels > total_berths:
            return {"status": "error", "message": "More berthed vessels than total berths"}

        # Process record into expected format
        observed_at = input_data.get("observed_at", datetime.now().isoformat())
        dt = pd.to_datetime(observed_at)
        
        row = {
            "port_code": port,
            "date": dt,
            "waiting_vessels": float(waiting_vessels),
            "berthed_vessels": float(berthed_vessels),
            "total_berths": float(total_berths),
            "expected_arrivals_24h": input_data.get("expected_arrivals_24h"),
            "wave_height_forecast_m": input_data.get("wave_height_forecast_m"),
            "wind_speed_forecast_kmh": input_data.get("wind_speed_forecast_kmh"),
        }
        for i in range(1, 7):
            row[f"wait_lag_{i}"] = float(history[-1 - i])
            
        df = pd.DataFrame([row])
        df = preprocessing.make_features(df)
        
        pred = np.clip(pipeline.predict(df[preprocessing.FEATURES]), 0, None)[0]
        level = preprocessing.congestion_level(int(np.floor(pred + 0.5)), thresholds[port])
        
        return {
            "status": "ok",
            "predicted_waiting_vessels": round(float(pred), 2),
            "congestion_level": level
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Now execute original Step 16 test logic ---
import predict
importlib.reload(predict)
predict.load_bundle.cache_clear()

normal = {
    "port_code": "INNML", "observed_at": "2026-11-27T11:00:00+05:30",
    "waiting_vessels": 2, "berthed_vessels": 8, "total_berths": 14,
    "waiting_last_7_days": [2, 1, 2, 3, 2, 1, 2],
    "expected_arrivals_24h": 4, "wave_height_forecast_m": 0.9, "wind_speed_forecast_kmh": 17,
}
busy = {**normal, "waiting_vessels": 11, "berthed_vessels": 11,
        "waiting_last_7_days": [4, 5, 6, 8, 8, 10, 11],
        "expected_arrivals_24h": 8, "wave_height_forecast_m": 2.8, "wind_speed_forecast_kmh": 40}
no_optional = {k: v for k, v in normal.items() if k not in OPTIONAL_INPUTS}
bad = {**normal, "port_code": "XXXXX", "berthed_vessels": 20, "waiting_last_7_days": [1, 2]}

if DATA_SOURCE == "synthetic":
    for title, example in [("Normal day", normal), ("Busy day", busy),
                           ("Missing optional values", no_optional), ("Invalid input", bad)]:
        print(f"--- {title} ---")
        print(json.dumps(predict.predict_congestion(example), indent=2))
else:
    print("Edit the examples above to use your real port codes, then call predict.predict_congestion().")

# Automatic checks
if DATA_SOURCE == "synthetic":
    a, b = predict.predict_congestion(normal), predict.predict_congestion(busy)
    assert a["status"] == b["status"] == "ok"
    assert b["predicted_waiting_vessels"] > a["predicted_waiting_vessels"]
    assert predict.predict_congestion(no_optional)["status"] == "ok"
    assert predict.predict_congestion(bad)["status"] == "error"
    assert predict.predict_congestion({})["status"] == "error"

# The saved model must give the same answers as the one in memory
reloaded = joblib.load("models/congestion_model.pkl")["pipeline"]
assert np.allclose(reloaded.predict(X_test), best_model.predict(X_test))
print("All checks passed.")
