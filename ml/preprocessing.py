"""Shared data preparation for port congestion. Used by BOTH training and prediction."""
import numpy as np
import pandas as pd

LAGS = [f"wait_lag_{i}" for i in range(1, 7)]          # 1..6 days ago
OPTIONAL_INPUTS = ["expected_arrivals_24h", "wave_height_forecast_m", "wind_speed_forecast_kmh"]
CATEGORICAL_FEATURES = ["port_code"]
NUMERIC_FEATURES = (
    ["waiting_vessels", "berthed_vessels", "total_berths", "occupancy_pct"]
    + LAGS
    + ["wait_mean_7", "wait_max_7", "wait_change_1", "month_sin", "month_cos"]
    + OPTIONAL_INPUTS
)
FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES
TARGET = "target_waiting_24h"
LEVELS = ["Low", "Moderate", "High", "Critical"]


def add_history_and_target(raw):
    """TRAINING ONLY. Adds past values and tomorrow's value, port by port."""
    parts = []
    for port, group in raw.groupby("port_code"):
        group = group.sort_values("date").set_index("date").asfreq("D")   # expose missing days
        group["port_code"] = port
        for i, name in enumerate(LAGS, start=1):
            group[name] = group["waiting_vessels"].shift(i)               # past
        group[TARGET] = group["waiting_vessels"].shift(-1)                # future (answer)
        parts.append(group.reset_index())
    out = pd.concat(parts, ignore_index=True)
    required = ["waiting_vessels", "berthed_vessels", "total_berths", TARGET] + LAGS
    return out.dropna(subset=required).sort_values(["date", "port_code"]).reset_index(drop=True)


def make_features(df):
    """TRAINING AND PREDICTION. Uses only information known on the observation date."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    window = df[["waiting_vessels"] + LAGS].astype(float)                 # last 7 days
    df["wait_mean_7"] = window.mean(axis=1)
    df["wait_max_7"] = window.max(axis=1)
    df["wait_change_1"] = df["waiting_vessels"] - df["wait_lag_1"]
    df["occupancy_pct"] = 100 * df["berthed_vessels"] / df["total_berths"]
    angle = 2 * np.pi * (df["date"].dt.month - 1) / 12
    df["month_sin"], df["month_cos"] = np.sin(angle), np.cos(angle)
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype(float)
    return df


def congestion_level(waiting, thresholds):
    """thresholds = [low_max, moderate_max, high_max] for one port."""
    for level, upper in zip(LEVELS, thresholds):
        if waiting <= upper:
            return level
    return LEVELS[-1]
