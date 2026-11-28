# Weather-Aware Ship Routing (`ml/ship_routing`)

Part of the **Supply Chain and Coastal Chain Intelligence Platform**. This module supports the
*Shipping Company* role: given a source port, destination port, vessel and departure time it
returns a recommended sea route that balances distance against weather risk, plus the
shortest-distance route for comparison.

It is independent of `ml/port_congestion/` and does not modify it.

> **Prototype for an academic project.** The waypoint network is synthetic, and the risk
> thresholds and vessel limits are prototype values, not certified maritime safety limits.
> Do not use for real navigation.

## Folder structure

```
ml/ship_routing/
├── notebooks/weather_aware_ship_routing.ipynb   # Colab notebook (sections 1-21)
├── routing.py              # graph, risk scoring, Dijkstra/A*, plan_route(), JSON layer
├── weather_service.py      # Open-Meteo provider (real data) + synthetic test provider
├── visualization.py        # Matplotlib schematic, risk profile, Folium map
├── sample_network.py       # SYNTHETIC demo waypoint network (India + Sri Lanka)
├── fastapi_app_example.py  # example API wrapper (not used by the notebook)
├── requirements.txt
├── data/                   # waypoints.csv, edges.csv, *_config.json
└── results/                # json/, tables/, figures/, maps/, cache/ (cache not needed in Git)
```

## How it works

1. **Graph:** ports and offshore waypoints are nodes; sea lanes are directed edges with
   great-circle distance (haversine), heading and an illustrative depth.
2. **Weather:** points every ~100 km along each lane are sent in batches to Open-Meteo:
   * Marine API `https://marine-api.open-meteo.com/v1/marine`: `wave_height`,
     `wave_direction`, `wave_period`, `swell_wave_height` (with `cell_selection=sea`)
   * Forecast API `https://api.open-meteo.com/v1/forecast`: `wind_speed_10m`,
     `wind_direction_10m`, `wind_gusts_10m` (with `wind_speed_unit=kn`)

   No API key is needed (non-commercial use). The module retries on HTTP 429/5xx, caches
   responses, and never crashes on failures: missing data is handled by a policy
   (`conservative` by default). Weather data by Open-Meteo.com, CC-BY 4.0.
3. **Risk:** each sample point is classified Low / Moderate / High / Severe from the effective
   wave height (wave height × head/beam/following-sea factor), wind and gusts. The worst point
   sets the lane's level.
4. **Routing:** `cost = distance_weight·km + weather_weight·km·penalty[level]`. Lanes that break
   vessel limits (wave, wind, depth) or are Severe are removed, then Dijkstra (or A*) finds the
   cheapest feasible route. If there is none, the status is `no_feasible_route` and no route is
   recommended.

Default prototype thresholds (all configurable in `RoutingConfig`):

| Factor | Moderate from | High from | Severe from |
|---|---|---|---|
| Wave height (m) | 2.0 | 3.5 | 5.0 |
| Wind (kn) | 17 | 28 | 41 |
| Gusts (kn) | 25 | 40 | 55 |

## Running the notebook

1. Upload `notebooks/weather_aware_ship_routing.ipynb` to Google Colab (File → Upload notebook).
2. Runtime → Run all. Allow Google Drive access when asked.
3. Everything is saved under `MyDrive/coastal_platform/ml/ship_routing/`; the ZIP package
   goes to `MyDrive/coastal_platform/exports/` and is downloaded automatically.

## Using the module from Python

```python
import sys; sys.path.insert(0, "ml/ship_routing")
from routing import load_network_from_csv, plan_route, to_json_safe, RoutingConfig
from weather_service import OpenMeteoProvider, WeatherConfig
from sample_network import DATA_NOTICE

G = load_network_from_csv("ml/ship_routing/data/waypoints.csv", "ml/ship_routing/data/edges.csv", DATA_NOTICE)
provider = OpenMeteoProvider(WeatherConfig(cache_file="ml/ship_routing/results/cache/weather_cache.json"))
result = to_json_safe(plan_route(G, {"source_port": "INNSA", "destination_port": "INMAA",
                                     "vessel_speed": 15, "vessel_type": "container_ship"},
                                 provider, RoutingConfig()))
print(result["status"], result["distance_km"], result["weather_risk"])
```

## Sample input and output

Input (`results/json/sample_request.json`):

```json
{
  "source_port": "INNSA",
  "destination_port": "INCOK",
  "vessel_speed": 15,
  "vessel_type": "container_ship",
  "vessel_specs": {
    "draft_m": 12.5,
    "max_wave_height_m": 6.0,
    "max_wind_speed_kn": 45
  },
  "departure_time": "2026-12-01T00:00:00Z"
}
```

Output excerpt (`results/json/sample_response_scenario2.json`, **synthetic** storm off Mangalore):

```json
{
  "status": "ok",
  "source_port": {
    "id": "INNSA",
    "name": "Mumbai (JNPT / Nhava Sheva)"
  },
  "destination_port": {
    "id": "INCOK",
    "name": "Kochi (Cochin)"
  },
  "recommended_route": {
    "path": [
      "INNSA",
      "WP_MUM_OFF",
      "WP_ARAB_N",
      "WP_ARAB_W",
      "WP_NINE_W",
      "WP_NINE_E",
      "WP_KOC_OFF",
      "INCOK"
    ],
    "distance_km": 1692.3,
    "distance_nautical_miles": 913.8,
    "weather_risk": "Low",
    "total_weather_penalty": 0.0,
    "high_risk_segments": 0,
    "severe_risk_segments": 0
  },
  "alternative_route": {
    "path": [
      "INNSA",
      "WP_MUM_OFF",
      "WP_GOA_OFF",
      "WP_MNG_OFF",
      "WP_KOC_OFF",
      "INCOK"
    ],
    "distance_km": 1171.8,
    "weather_risk": "High",
    "total_weather_penalty": 997.0,
    "high_risk_segments": 2
  },
  "distance_km": 1692.3,
  "distance_nautical_miles": 913.8,
  "estimated_travel_time": {
    "hours": 60.9,
    "text": "2 d 12 h 55 min",
    "eta_utc": "2026-12-03T12:55:02Z",
    "basis": "service speed 15.0 kn reduced by prototype weather speed-loss factors"
  },
  "weather_risk": "Low",
  "segment_weather_details": [
    {
      "from": "WP_MUM_OFF",
      "to": "WP_ARAB_N",
      "distance_km": 231.7,
      "risk_label": "Low",
      "wave_height_m": 1.03,
      "encounter": "head sea",
      "effective_wave_height_m": 1.13,
      "wind_speed_kn": 10.3,
      "weather_penalty": 0.0,
      "data_sources": [
        "synthetic:storm_mangalore"
      ],
      "weather_feasible": true
    },
    "... one entry per segment ..."
  ],
  "route_explanation": "The weather-aware route was selected because the shortest route has 2 high-risk and 0 severe-risk segment(s). It is 520 km (44.4%) longer, but its overall risk is Low and its weather penalty is 0.0 versus 997.0 (total cost 1692.3 vs 2168.8).",
  "warnings": [
    "Weather data is SYNTHETIC test data, not a real forecast."
  ]
}
```

Response statuses: `ok`, `no_feasible_route` (connected but every route breaks a constraint),
`no_route` (not connected for this vessel), `error` (invalid request).

## FastAPI integration (later)

`fastapi_app_example.py` shows the pattern:

1. `pip install fastapi uvicorn`
2. Load the graph and the weather provider **once** at start-up.
3. Validate the request with a Pydantic model (`source_port`, `destination_port`,
   `vessel_speed`, `vessel_type`, `vessel_specs`, `departure_time`).
4. Call `plan_route(...)`, pass the result through `to_json_safe(...)` and return it.
5. Run: `uvicorn fastapi_app_example:app --port 8001` (from this folder), then the Node/Java/
   other backend calls `POST /route`.

Notes for production: the in-memory weather cache is per process; with several workers use a
shared cache (e.g. Redis). Keep calls to Open-Meteo within its published limits, and get a
commercial plan if the platform is used commercially.

## Replacing the synthetic network

Provide `data/waypoints.csv` (`node_id, name, type, lat, lon`) and `data/edges.csv`
(`u, v, lane_type, min_depth_m, navigable`, optional `bidirectional`) from a real source, for
example a lane network derived from AIS traffic density or a published shipping-lane dataset,
and load them with `load_network_from_csv()`. Validate depths against official charts.

## Limitations

* Synthetic network with hand-placed waypoints and illustrative depths.
* Not time-dependent: the worst forecast within the voyage window is used for every point.
* Direction factors, thresholds, speed-loss factors and vessel presets are prototype heuristics.
* Open-Meteo states its marine data has limited accuracy near coasts and is not suitable
  for coastal navigation.
