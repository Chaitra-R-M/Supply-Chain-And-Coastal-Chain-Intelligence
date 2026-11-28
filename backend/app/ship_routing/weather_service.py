"""
weather_service.py
==================
Weather data providers for the Weather-Aware Ship Routing module.

Part of: Supply Chain and Coastal Chain Intelligence Platform
Module : ml/ship_routing

What this file does
-------------------
* Defines a small "provider" interface so the routing code does not care
  WHERE weather data comes from.
* OpenMeteoProvider  -> REAL forecast data from the free Open-Meteo APIs
    - Marine API  : https://marine-api.open-meteo.com/v1/marine
                    hourly: wave_height, wave_direction, wave_period,
                            swell_wave_height
    - Forecast API: https://api.open-meteo.com/v1/forecast
                    hourly: wind_speed_10m, wind_direction_10m, wind_gusts_10m
  Docs: https://open-meteo.com/en/docs/marine-weather-api
        https://open-meteo.com/en/docs
  No API key is needed for non-commercial use. Free-tier limits published by
  Open-Meteo (Nov 2026): 600 calls/minute, 5,000/hour, <10,000/day.
  Data licence: CC-BY 4.0 - attribute "Weather data by Open-Meteo.com".
  Open-Meteo itself warns that marine accuracy in coastal areas is limited
  and that the data is NOT suitable for coastal navigation.
* SyntheticWeatherProvider -> REPRODUCIBLE, MADE-UP weather for testing
  (calm sea + configurable "storm zones"). Never real data.

Every value returned is tagged with a "source" field so real and synthetic
data can never be confused.

To add another provider later (e.g. Stormglass, NOAA, a paid service),
subclass WeatherProvider and implement fetch_points().
"""

from __future__ import annotations

import json
import logging
import math
import os
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Sequence, Tuple

import requests

logger = logging.getLogger("ship_routing.weather")

# >>> NB-CELL: weather_core
# ---------------------------------------------------------------------------
# Weather configuration and common helpers
# ---------------------------------------------------------------------------

# The weather fields every provider must return for a point.
# None means "not available" - it is NEVER silently replaced by 0.
WEATHER_FIELDS = [
    "wave_height_m",        # significant height of mean waves (m)
    "wave_direction_deg",   # direction waves come FROM (0 = from north)
    "wave_period_s",        # mean wave period (s)
    "swell_wave_height_m",  # primary swell height (m)
    "wind_speed_kn",        # 10 m wind speed (knots)
    "wind_direction_deg",   # direction wind comes FROM (0 = from north)
    "wind_gusts_kn",        # 10 m wind gusts (knots)
]


@dataclass
class WeatherConfig:
    """All weather-provider settings in one place (easy to save as JSON)."""
    provider: str = "open-meteo"                       # "open-meteo" or "synthetic"
    marine_url: str = "https://marine-api.open-meteo.com/v1/marine"
    forecast_url: str = "https://api.open-meteo.com/v1/forecast"
    marine_hourly: Tuple[str, ...] = ("wave_height", "wave_direction",
                                      "wave_period", "swell_wave_height")
    wind_hourly: Tuple[str, ...] = ("wind_speed_10m", "wind_direction_10m",
                                    "wind_gusts_10m")
    marine_max_forecast_days: int = 7      # Marine API allows up to 8; keep a margin
    wind_max_forecast_days: int = 15       # Forecast API allows up to 16
    batch_size: int = 50                   # coordinates per HTTP request
    timeout_s: float = 20.0
    max_retries: int = 2                   # retries for 429 / 5xx / network errors
    backoff_s: float = 2.0                 # first back-off delay (doubles each retry)
    min_interval_s: float = 0.3            # polite pause between requests
    cache_ttl_hours: float = 3.0           # re-use cached forecasts this long
    cache_file: Optional[str] = None       # JSON file for the disk cache (optional)
    coord_decimals: int = 2                # rounding for cache keys (~1 km)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["marine_hourly"] = list(self.marine_hourly)
        d["wind_hourly"] = list(self.wind_hourly)
        return d


def point_key(lat: float, lon: float, decimals: int = 2) -> str:
    """Stable text key for a coordinate, e.g. '15.40,73.30'."""
    return f"{round(lat, decimals):.{decimals}f},{round(lon, decimals):.{decimals}f}"


def empty_point_weather(source: str, error: Optional[str] = None) -> dict:
    """A weather record where every field is missing."""
    rec = {f: None for f in WEATHER_FIELDS}
    rec.update({"source": source, "time_of_max_wave": None,
                "time_of_max_wind": None, "error": error})
    return rec


def to_utc(dt) -> datetime:
    """Accept datetime or ISO string; return a timezone-aware UTC datetime."""
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _clean(value):
    """Convert API numbers to float; keep None / NaN as None."""
    if value is None:
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) else v


class WeatherProvider:
    """Base class. Subclasses return one weather record per point."""
    name = "base"

    def fetch_points(self, points: Sequence[Tuple[float, float]],
                     start_time, window_hours: int) -> Dict[str, dict]:
        """
        points       : list of (lat, lon)
        start_time   : departure time (datetime or ISO string, UTC assumed)
        window_hours : planning window; the WORST value inside the window
                       is returned (a conservative choice for a prototype)
        Returns {point_key: record} where record has the WEATHER_FIELDS keys,
        a 'source' tag and an 'error' message (None if all good).
        """
        raise NotImplementedError


# >>> NB-CELL: weather_openmeteo
# ---------------------------------------------------------------------------
# Real data: Open-Meteo Marine + Forecast APIs
# ---------------------------------------------------------------------------

class OpenMeteoProvider(WeatherProvider):
    """
    Fetches REAL forecasts from Open-Meteo (no API key needed).

    * Batches many coordinates into one request (comma-separated lat/lon;
      the API then returns a JSON list in the same order).
    * Retries on HTTP 429 (rate limit), 5xx and network errors with back-off.
    * Handles the documented error format {"error": true, "reason": "..."}.
    * Caches results in memory and (optionally) in a JSON file.
    * Never crashes the caller: failures become records with None values
      and an 'error' message.
    """
    name = "open-meteo"

    def __init__(self, config: Optional[WeatherConfig] = None,
                 session: Optional[requests.Session] = None):
        self.config = config or WeatherConfig()
        self.session = session or requests.Session()
        self.session.headers.update({"User-Agent": "coastal-platform-ship-routing/1.0 (academic prototype)"})
        self._cache: Dict[str, dict] = {}
        self._last_request = 0.0
        self.stats = {"http_requests": 0, "cache_hits": 0, "failures": 0}
        self._load_disk_cache()

    # ----- caching ---------------------------------------------------------
    def _load_disk_cache(self):
        path = self.config.cache_file
        if path and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as fh:
                    self._cache = json.load(fh)
                logger.info("Loaded %d cached weather records", len(self._cache))
            except (OSError, json.JSONDecodeError) as exc:
                logger.warning("Weather cache unreadable (%s) - starting empty", exc)
                self._cache = {}

    def save_cache(self):
        path = self.config.cache_file
        if not path:
            return
        try:
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(self._cache, fh)
        except OSError as exc:
            logger.warning("Could not save weather cache: %s", exc)

    def _cache_get(self, key: str) -> Optional[dict]:
        entry = self._cache.get(key)
        if not entry:
            return None
        age_h = (time.time() - entry.get("fetched_at", 0)) / 3600.0
        if age_h > self.config.cache_ttl_hours:
            return None
        self.stats["cache_hits"] += 1
        return entry["data"]

    def _cache_put(self, key: str, data: dict):
        self._cache[key] = {"fetched_at": time.time(), "data": data}

    # ----- HTTP ------------------------------------------------------------
    def _get_json(self, url: str, params: dict):
        """GET with rate-limit pause, retries and error handling.
        Returns (json_or_None, error_message_or_None)."""
        delay = self.config.backoff_s
        last_error = None
        for attempt in range(self.config.max_retries + 1):
            wait = self.config.min_interval_s - (time.time() - self._last_request)
            if wait > 0:
                time.sleep(wait)
            self._last_request = time.time()
            try:
                self.stats["http_requests"] += 1
                resp = self.session.get(url, params=params, timeout=self.config.timeout_s)
            except requests.RequestException as exc:
                last_error = f"network error ({exc.__class__.__name__})"
                logger.debug("Weather request exception: %s", exc)
            else:
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                    except ValueError:
                        return None, "invalid JSON in response"
                    if isinstance(data, dict) and data.get("error"):
                        return None, f"API error: {data.get('reason')}"
                    return data, None
                if resp.status_code == 400:
                    # Documented format: {"error": true, "reason": "..."}; not retryable
                    try:
                        reason = resp.json().get("reason")
                    except ValueError:
                        reason = resp.text[:200]
                    return None, f"HTTP 400: {reason}"
                last_error = f"HTTP {resp.status_code}"
                if resp.status_code == 429:
                    retry_after = resp.headers.get("Retry-After")
                    if retry_after and retry_after.isdigit():
                        delay = max(delay, float(retry_after))
                    last_error = "HTTP 429: rate limit reached"
                elif resp.status_code < 500:
                    return None, last_error        # other 4xx: do not retry
            if attempt < self.config.max_retries:
                logger.warning("Weather request failed (%s) - retry %d in %.1fs",
                               last_error, attempt + 1, delay)
                time.sleep(delay)
                delay *= 2
        self.stats["failures"] += 1
        return None, last_error

    @staticmethod
    def _window_max(hourly: dict, value_field: str, dir_field: Optional[str],
                    t0: datetime, t1: datetime):
        """Largest value of `value_field` within [t0, t1] and the matching direction."""
        times = hourly.get("time") or []
        values = hourly.get(value_field) or []
        dirs = (hourly.get(dir_field) or []) if dir_field else []
        best, best_dir, best_time = None, None, None
        for i, ts in enumerate(times):
            try:
                t = datetime.fromisoformat(ts).replace(tzinfo=timezone.utc)
            except (TypeError, ValueError):
                continue
            if t < t0 or t > t1 or i >= len(values):
                continue
            v = _clean(values[i])
            if v is None:
                continue
            if best is None or v > best:
                best, best_time = v, ts
                best_dir = _clean(dirs[i]) if i < len(dirs) else None
        return best, best_dir, best_time

    def _request_batch(self, url: str, batch: List[Tuple[float, float]],
                       hourly_vars: Sequence[str], t0: datetime, t1: datetime,
                       extra: dict):
        params = {
            "latitude": ",".join(f"{p[0]:.4f}" for p in batch),
            "longitude": ",".join(f"{p[1]:.4f}" for p in batch),
            "hourly": ",".join(hourly_vars),
            "timezone": "GMT",
            "start_hour": t0.strftime("%Y-%m-%dT%H:00"),
            "end_hour": t1.strftime("%Y-%m-%dT%H:00"),
            **extra,
        }
        data, err = self._get_json(url, params)
        if err and err.startswith("HTTP 400"):
            # Fallback: ask for a plain forecast range and filter locally
            logger.warning("start_hour/end_hour rejected (%s); retrying with forecast_days", err)
            params.pop("start_hour"); params.pop("end_hour")
            params["forecast_days"] = 7
            data, err = self._get_json(url, params)
        if data is None:
            return None, err
        if isinstance(data, dict):            # single location -> single object
            data = [data]
        if len(data) != len(batch):
            return None, f"unexpected response length {len(data)} for {len(batch)} points"
        return data, None

    def fetch_points(self, points, start_time, window_hours):
        cfg = self.config
        t0 = to_utc(start_time).replace(minute=0, second=0, microsecond=0)
        t1 = t0 + timedelta(hours=max(1, int(window_hours)))
        now = datetime.now(timezone.utc)
        marine_end = now + timedelta(days=cfg.marine_max_forecast_days)
        wind_end = now + timedelta(days=cfg.wind_max_forecast_days)

        results: Dict[str, dict] = {}
        todo: List[Tuple[float, float]] = []
        window_tag = f"{t0:%Y%m%d%H}-{t1:%Y%m%d%H}"
        for lat, lon in points:
            key = point_key(lat, lon, cfg.coord_decimals)
            if key in results:
                continue
            cached = self._cache_get(f"{key}|{window_tag}")
            if cached is not None:
                results[key] = cached
            else:
                results[key] = empty_point_weather(self.name)
                todo.append((lat, lon))

        if todo and t0 > marine_end:
            msg = "departure is beyond the marine forecast horizon"
            for lat, lon in todo:
                results[point_key(lat, lon, cfg.coord_decimals)]["error"] = msg
            return results

        m_t1 = min(t1, marine_end)
        w_t1 = min(t1, wind_end)
        for i in range(0, len(todo), cfg.batch_size):
            batch = todo[i:i + cfg.batch_size]
            marine, m_err = self._request_batch(cfg.marine_url, batch, cfg.marine_hourly,
                                                t0, m_t1, {"cell_selection": "sea"})
            wind, w_err = self._request_batch(cfg.forecast_url, batch, cfg.wind_hourly,
                                              t0, w_t1, {"wind_speed_unit": "kn"})
            if marine is None and wind is None and i + cfg.batch_size < len(todo):
                # Both APIs unreachable: stop early instead of retrying every batch
                logger.error("Weather APIs unavailable (%s / %s) - remaining points marked missing",
                             m_err, w_err)
                for lat, lon in todo[i:]:
                    results[point_key(lat, lon, cfg.coord_decimals)]["error"] = \
                        f"marine: {m_err}; wind: {w_err}"
                break
            for j, (lat, lon) in enumerate(batch):
                key = point_key(lat, lon, cfg.coord_decimals)
                rec = results[key]
                errors = []
                if marine is not None:
                    h = marine[j].get("hourly", {})
                    wh, wd, wt = self._window_max(h, "wave_height", "wave_direction", t0, m_t1)
                    wp, _, _ = self._window_max(h, "wave_period", None, t0, m_t1)
                    sw, _, _ = self._window_max(h, "swell_wave_height", None, t0, m_t1)
                    rec.update({"wave_height_m": wh, "wave_direction_deg": wd,
                                "wave_period_s": wp, "swell_wave_height_m": sw,
                                "time_of_max_wave": wt})
                    if wh is None:
                        errors.append("no wave data for this cell/time")
                else:
                    errors.append(f"marine: {m_err}")
                if wind is not None:
                    h = wind[j].get("hourly", {})
                    ws, wdir, wt = self._window_max(h, "wind_speed_10m", "wind_direction_10m", t0, w_t1)
                    wg, _, _ = self._window_max(h, "wind_gusts_10m", None, t0, w_t1)
                    rec.update({"wind_speed_kn": ws, "wind_direction_deg": wdir,
                                "wind_gusts_kn": wg, "time_of_max_wind": wt})
                    if ws is None:
                        errors.append("no wind data for this cell/time")
                else:
                    errors.append(f"wind: {w_err}")
                rec["error"] = "; ".join(errors) if errors else None
                # Only cache complete successes so failures are retried next time
                if marine is not None and wind is not None:
                    self._cache_put(f"{key}|{window_tag}", rec)
        self.save_cache()
        return results


# >>> NB-CELL: weather_synthetic
# ---------------------------------------------------------------------------
# Synthetic data: reproducible test weather (NOT REAL)
# ---------------------------------------------------------------------------

def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@dataclass
class StormZone:
    """A circular area of bad weather used ONLY for synthetic test scenarios.
    Full strength inside core_fraction*radius, fading linearly to calm at radius."""
    name: str
    lat: float
    lon: float
    radius_km: float
    peak_wave_m: float
    peak_wind_kn: float
    wave_direction_deg: float = 225.0
    wind_direction_deg: float = 225.0
    core_fraction: float = 0.5


@dataclass
class MissingZone:
    """Area where the synthetic provider pretends no data is available."""
    lat: float
    lon: float
    radius_km: float


class SyntheticWeatherProvider(WeatherProvider):
    """Deterministic made-up weather for reproducible tests. Tagged 'synthetic'."""
    name = "synthetic"

    def __init__(self, scenario_name: str = "calm",
                 base_wave_m: float = 1.0, base_wind_kn: float = 10.0,
                 base_wave_direction_deg: float = 240.0,
                 storms: Optional[List[StormZone]] = None,
                 missing_zones: Optional[List[MissingZone]] = None,
                 noise_fraction: float = 0.05, seed: int = 42):
        self.scenario_name = scenario_name
        self.base_wave_m = base_wave_m
        self.base_wind_kn = base_wind_kn
        self.base_dir = base_wave_direction_deg
        self.storms = storms or []
        self.missing_zones = missing_zones or []
        self.noise_fraction = noise_fraction
        self.seed = seed

    def _noise(self, lat, lon):
        # Deterministic pseudo-random number in [-1, 1] from coordinates + seed
        x = math.sin(lat * 12.9898 + lon * 78.233 + self.seed) * 43758.5453
        return (x - math.floor(x)) * 2 - 1

    def fetch_points(self, points, start_time, window_hours):
        out = {}
        for lat, lon in points:
            key = point_key(lat, lon)
            if any(_haversine_km(lat, lon, z.lat, z.lon) <= z.radius_km for z in self.missing_zones):
                out[key] = empty_point_weather(f"synthetic:{self.scenario_name}",
                                               error="synthetic missing-data zone")
                continue
            wave, wind = self.base_wave_m, self.base_wind_kn
            wave_dir, wind_dir = self.base_dir, self.base_dir
            for s in self.storms:
                d = _haversine_km(lat, lon, s.lat, s.lon)
                if d >= s.radius_km:
                    continue
                core = s.core_fraction * s.radius_km
                f = 1.0 if d <= core else 1.0 - (d - core) / (s.radius_km - core)
                w = self.base_wave_m + (s.peak_wave_m - self.base_wave_m) * f
                v = self.base_wind_kn + (s.peak_wind_kn - self.base_wind_kn) * f
                if w > wave:
                    wave, wave_dir = w, s.wave_direction_deg
                if v > wind:
                    wind, wind_dir = v, s.wind_direction_deg
            n = 1 + self.noise_fraction * self._noise(lat, lon)
            out[key] = {
                "wave_height_m": round(wave * n, 2),
                "wave_direction_deg": wave_dir,
                "wave_period_s": round(4 + 1.6 * wave, 1),
                "swell_wave_height_m": round(0.6 * wave * n, 2),
                "wind_speed_kn": round(wind * n, 1),
                "wind_direction_deg": wind_dir,
                "wind_gusts_kn": round(wind * 1.3 * n, 1),
                "source": f"synthetic:{self.scenario_name}",
                "time_of_max_wave": None, "time_of_max_wind": None, "error": None,
            }
        return out


def create_weather_provider(config: Optional[WeatherConfig] = None, **synthetic_kwargs) -> WeatherProvider:
    """Factory: choose the provider by name so it stays configurable."""
    config = config or WeatherConfig()
    if config.provider == "open-meteo":
        return OpenMeteoProvider(config)
    if config.provider == "synthetic":
        return SyntheticWeatherProvider(**synthetic_kwargs)
    raise ValueError(f"Unknown weather provider '{config.provider}'. "
                     "Use 'open-meteo' or 'synthetic', or add a new WeatherProvider subclass.")
