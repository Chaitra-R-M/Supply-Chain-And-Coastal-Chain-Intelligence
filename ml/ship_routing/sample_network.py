"""
sample_network.py
=================
A SMALL, SYNTHETIC maritime waypoint network around the Indian peninsula and
Sri Lanka, for DEMONSTRATION ONLY.

    !!!  NOT A NAVIGATIONAL CHART. NOT VERIFIED REAL-WORLD ROUTE DATA.  !!!

* Port coordinates are approximate public locations of the port areas.
* Offshore waypoints were placed by hand in open water and each straight
  segment was checked by hand to stay at sea (to keep it away from land and
  the Lakshadweep islands). They are NOT official traffic lanes.
* Depths ("min_depth_m") are ROUGH ILLUSTRATIVE VALUES, not survey data.
  The Pamban / Palk Strait link is deliberately given a very shallow depth
  because that passage is known to be too shallow for large ships; the exact
  number here is illustrative.

To use real data later, replace these tables with a real maritime network
(for example, a lane network derived from AIS traffic density, or a
published shipping-lane dataset) using the SAME column names, and load it
with routing.load_network_from_csv().
"""

from __future__ import annotations

import pandas as pd

# >>> NB-CELL: sample_network
DATA_NOTICE = ("SYNTHETIC DEMONSTRATION NETWORK - hand-placed waypoints and "
               "illustrative depths. Not a navigational chart and not verified "
               "real-world route data. Do not use for actual navigation.")

# node_id, name, type, lat, lon, country, notes
_WAYPOINTS = [
    # --- Ports (approximate locations; IDs follow UN/LOCODE style) ---------
    ("INNSA", "Mumbai (JNPT / Nhava Sheva)", "port", 18.95, 72.95, "IN", "port"),
    ("INMRM", "Mormugao (Goa)",              "port", 15.41, 73.80, "IN", "port"),
    ("INNML", "New Mangalore",               "port", 12.92, 74.80, "IN", "port"),
    ("INCOK", "Kochi (Cochin)",              "port",  9.97, 76.24, "IN", "port"),
    ("INTUT", "Tuticorin (V.O. Chidambaranar)", "port", 8.76, 78.20, "IN", "port"),
    ("INMAA", "Chennai",                     "port", 13.10, 80.30, "IN", "port"),
    ("INVTZ", "Visakhapatnam",               "port", 17.69, 83.30, "IN", "port"),
    ("LKCMB", "Colombo",                     "port",  6.95, 79.84, "LK", "port"),
    # --- Offshore approach waypoints (synthetic) ---------------------------
    ("WP_MUM_OFF", "Off Mumbai",        "waypoint", 18.90, 72.40, "", "synthetic"),
    ("WP_GOA_OFF", "Off Goa",           "waypoint", 15.40, 73.30, "", "synthetic"),
    ("WP_MNG_OFF", "Off Mangalore",     "waypoint", 12.90, 74.30, "", "synthetic"),
    ("WP_KOC_OFF", "Off Kochi",         "waypoint",  9.95, 75.80, "", "synthetic"),
    ("WP_TUT_OFF", "Off Tuticorin",     "waypoint",  8.70, 78.60, "", "synthetic"),
    ("WP_CHE_OFF", "Off Chennai",       "waypoint", 13.10, 80.70, "", "synthetic"),
    ("WP_VIZ_OFF", "Off Visakhapatnam", "waypoint", 17.50, 83.70, "", "synthetic"),
    ("WP_COL_OFF", "Off Colombo",       "waypoint",  6.95, 79.50, "", "synthetic"),
    # --- Arabian Sea offshore lane (west of Lakshadweep, via 9-degree channel)
    ("WP_ARAB_N",  "Arabian Sea North",       "waypoint", 17.00, 71.50, "", "synthetic"),
    ("WP_ARAB_W",  "Arabian Sea West",        "waypoint", 13.00, 71.00, "", "synthetic"),
    ("WP_NINE_W",  "Nine Degree Channel W",   "waypoint",  9.20, 71.80, "", "synthetic"),
    ("WP_NINE_E",  "Nine Degree Channel E",   "waypoint",  9.00, 74.50, "", "synthetic"),
    # --- Southern tip and around Sri Lanka ----------------------------------
    ("WP_CAPE_S",  "South of Kanyakumari",    "waypoint",  7.60, 77.50, "", "synthetic"),
    ("WP_SL_SW",   "SW of Sri Lanka",         "waypoint",  5.80, 79.90, "", "synthetic"),
    ("WP_DONDRA",  "South of Dondra Head",    "waypoint",  5.55, 80.60, "", "synthetic"),
    ("WP_SL_SE",   "SE of Sri Lanka",         "waypoint",  6.00, 81.80, "", "synthetic"),
    ("WP_SL_E",    "East of Sri Lanka",       "waypoint",  7.60, 82.30, "", "synthetic"),
    ("WP_TRINCO",  "Off Trincomalee",         "waypoint",  8.80, 81.70, "", "synthetic"),
    # --- Shallow Pamban / Palk Strait passage (small craft only) -----------
    ("WP_PAMBAN",  "South of Pamban Pass",    "waypoint",  9.20, 79.20, "", "synthetic"),
    ("WP_PALK_BAY", "Palk Bay",               "waypoint",  9.60, 79.50, "", "synthetic"),
    ("WP_PALK_STR", "Palk Strait",            "waypoint", 10.05, 79.95, "", "synthetic"),
    # --- Bay of Bengal coastal + offshore lanes -----------------------------
    ("WP_EAST_MID", "Off Pondicherry",        "waypoint", 11.00, 81.00, "", "synthetic"),
    ("WP_KRISHNA", "Off Krishna Delta",       "waypoint", 15.50, 81.30, "", "synthetic"),
    ("WP_GODAVARI", "Off Godavari Delta",     "waypoint", 16.20, 82.60, "", "synthetic"),
    ("WP_BAY_S",   "Bay of Bengal South",     "waypoint", 10.50, 83.00, "", "synthetic"),
    ("WP_BAY_MID", "Bay of Bengal Central",   "waypoint", 13.50, 83.00, "", "synthetic"),
    ("WP_BAY_N",   "Bay of Bengal North",     "waypoint", 16.00, 85.00, "", "synthetic"),
]

# u, v, lane_type, min_depth_m (ILLUSTRATIVE), navigable
_EDGES = [
    # port approaches
    ("INNSA", "WP_MUM_OFF", "approach", 16.0, True),
    ("INMRM", "WP_GOA_OFF", "approach", 16.0, True),
    ("INNML", "WP_MNG_OFF", "approach", 16.0, True),
    ("INCOK", "WP_KOC_OFF", "approach", 16.0, True),
    ("INTUT", "WP_TUT_OFF", "approach", 16.0, True),
    ("INMAA", "WP_CHE_OFF", "approach", 16.0, True),
    ("INVTZ", "WP_VIZ_OFF", "approach", 16.0, True),
    ("LKCMB", "WP_COL_OFF", "approach", 16.0, True),
    # west coast coastal lane
    ("WP_MUM_OFF", "WP_GOA_OFF", "coastal", 200.0, True),
    ("WP_GOA_OFF", "WP_MNG_OFF", "coastal", 200.0, True),
    ("WP_MNG_OFF", "WP_KOC_OFF", "coastal", 200.0, True),
    ("WP_KOC_OFF", "WP_CAPE_S",  "coastal", 200.0, True),
    # Arabian Sea offshore lane
    ("WP_MUM_OFF", "WP_ARAB_N",  "offshore", 1000.0, True),
    ("WP_ARAB_N",  "WP_ARAB_W",  "offshore", 1000.0, True),
    ("WP_GOA_OFF", "WP_ARAB_W",  "offshore", 1000.0, True),
    ("WP_ARAB_W",  "WP_NINE_W",  "offshore", 1000.0, True),
    ("WP_NINE_W",  "WP_NINE_E",  "channel",  1000.0, True),
    ("WP_NINE_E",  "WP_KOC_OFF", "offshore", 1000.0, True),
    ("WP_NINE_E",  "WP_CAPE_S",  "offshore", 1000.0, True),
    # Gulf of Mannar / south
    ("WP_CAPE_S",  "WP_TUT_OFF", "coastal", 200.0, True),
    ("WP_CAPE_S",  "WP_COL_OFF", "offshore", 1000.0, True),
    ("WP_TUT_OFF", "WP_COL_OFF", "offshore", 1000.0, True),
    # around Sri Lanka
    ("WP_COL_OFF", "WP_SL_SW",  "coastal", 200.0, True),
    ("WP_SL_SW",   "WP_DONDRA", "coastal", 200.0, True),
    ("WP_DONDRA",  "WP_SL_SE",  "coastal", 200.0, True),
    ("WP_SL_SE",   "WP_SL_E",   "coastal", 200.0, True),
    ("WP_SL_E",    "WP_TRINCO", "coastal", 200.0, True),
    # shallow Pamban / Palk passage - illustrative depth, small craft only
    ("WP_TUT_OFF",  "WP_PAMBAN",   "shallow_channel", 4.5, True),
    ("WP_PAMBAN",   "WP_PALK_BAY", "shallow_channel", 4.5, True),
    ("WP_PALK_BAY", "WP_PALK_STR", "shallow_channel", 4.5, True),
    ("WP_PALK_STR", "WP_EAST_MID", "shallow_channel", 6.0, True),
    # Bay of Bengal coastal lane
    ("WP_TRINCO",  "WP_EAST_MID", "coastal", 200.0, True),
    ("WP_EAST_MID", "WP_CHE_OFF", "coastal", 200.0, True),
    ("WP_CHE_OFF", "WP_KRISHNA",  "coastal", 200.0, True),
    ("WP_KRISHNA", "WP_GODAVARI", "coastal", 200.0, True),
    ("WP_GODAVARI", "WP_VIZ_OFF", "coastal", 200.0, True),
    # Bay of Bengal offshore lane
    ("WP_TRINCO",  "WP_BAY_S",   "offshore", 1000.0, True),
    ("WP_SL_E",    "WP_BAY_S",   "offshore", 1000.0, True),
    ("WP_BAY_S",   "WP_BAY_MID", "offshore", 1000.0, True),
    ("WP_CHE_OFF", "WP_BAY_MID", "offshore", 1000.0, True),
    ("WP_BAY_MID", "WP_BAY_N",   "offshore", 1000.0, True),
    ("WP_BAY_N",   "WP_VIZ_OFF", "offshore", 1000.0, True),
]


def create_sample_network():
    """Return (waypoints_df, edges_df) for the synthetic demo network."""
    waypoints = pd.DataFrame(_WAYPOINTS, columns=["node_id", "name", "type", "lat", "lon",
                                                  "country", "notes"])
    edges = pd.DataFrame(_EDGES, columns=["u", "v", "lane_type", "min_depth_m", "navigable"])
    waypoints["data_status"] = "synthetic_demo"
    edges["data_status"] = "synthetic_demo"
    edges["bidirectional"] = True
    return waypoints, edges
