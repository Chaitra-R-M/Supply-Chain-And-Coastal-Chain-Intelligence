"""
visualization.py
================
Maps and charts for the weather-aware routing results.

* plot_route_map()       - static Matplotlib schematic (lat/lon axes, no coastline)
* plot_risk_profile()    - severity of each segment along the recommended route
* make_folium_map()      - interactive Leaflet map (needs `folium`)

All functions take the dict returned by routing.plan_route() (which carries the
annotated graph under the key "_graph").

Colours: risk levels use a fixed status palette (always shown with a text
label in the legend/tooltips, never colour alone).
"""

from __future__ import annotations

import math
from typing import Optional

# >>> NB-CELL: visualization
RISK_COLORS = {0: "#0aac23", 1: "#fbb315", 2: "#f18a59", 3: "#dc3c3d"}
RISK_NAMES = {0: "Low", 1: "Moderate", 2: "High", 3: "Severe"}
MISSING_COLOR = "#9c9c9c"
RECOMMENDED_COLOR = "#257de0"
SHORTEST_COLOR = "#474747"
INK = "#0b0b0b"
GRID = "#e7e7e7"


def _undirected_edges(G):
    """One entry per sea lane with the WORSE of its two directions."""
    seen = {}
    for u, v, d in G.edges(data=True):
        key = tuple(sorted((u, v)))
        w = d.get("weather") or {}
        level = w.get("risk_level", 0)
        missing = not w.get("data_complete", True)
        blocked = not (d.get("nav_feasible", True) and w.get("weather_feasible", True))
        if key not in seen or level > seen[key]["level"]:
            seen[key] = {"u": key[0], "v": key[1], "level": level, "missing": missing,
                         "blocked": blocked, "data": d}
        else:
            seen[key]["missing"] |= missing
            seen[key]["blocked"] |= blocked
    return list(seen.values())


def _title(result):
    s, t = result.get("source_port", {}), result.get("destination_port", {})
    return f"{s.get('name', '?')} to {t.get('name', '?')}  |  status: {result.get('status')}"


def plot_route_map(result: dict, save_path: Optional[str] = None, title: Optional[str] = None, show=True):
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    G = result["_graph"]
    fig, ax = plt.subplots(figsize=(10, 10))
    # risk-coloured lanes
    for e in _undirected_edges(G):
        a, b = G.nodes[e["u"]], G.nodes[e["v"]]
        color = MISSING_COLOR if e["missing"] and e["level"] <= 1 else RISK_COLORS[e["level"]]
        ax.plot([a["lon"], b["lon"]], [a["lat"], b["lat"]], color=color, lw=2,
                ls=":" if e["blocked"] else "-", zorder=2, solid_capstyle="round")
    # routes
    rec, alt = result.get("recommended_route"), result.get("alternative_route")
    if rec:
        xs = [G.nodes[n]["lon"] for n in rec["path"]]; ys = [G.nodes[n]["lat"] for n in rec["path"]]
        ax.plot(xs, ys, color=RECOMMENDED_COLOR, lw=9, alpha=0.35, zorder=1, solid_capstyle="round")
    if alt:
        xs = [G.nodes[n]["lon"] for n in alt["path"]]; ys = [G.nodes[n]["lat"] for n in alt["path"]]
        ax.plot(xs, ys, color=SHORTEST_COLOR, lw=1.6, ls=(0, (6, 3)), zorder=3)
    # nodes
    for n, d in G.nodes(data=True):
        if d["type"] == "port":
            ax.scatter(d["lon"], d["lat"], s=70, marker="s", color=INK, zorder=4,
                       edgecolor="white", linewidth=1.5)
            ax.annotate(d["name"], (d["lon"], d["lat"]), xytext=(6, 4), textcoords="offset points",
                        fontsize=8, color=INK)
        else:
            ax.scatter(d["lon"], d["lat"], s=14, color="#9c9c9c", zorder=4)
    src, dst = result.get("source_port", {}).get("id"), result.get("destination_port", {}).get("id")
    for n, lab in ((src, "SOURCE"), (dst, "DESTINATION")):
        if n in G:
            ax.scatter(G.nodes[n]["lon"], G.nodes[n]["lat"], s=220, facecolor="none",
                       edgecolor=RECOMMENDED_COLOR, linewidth=2.5, zorder=5)
            ax.annotate(lab, (G.nodes[n]["lon"], G.nodes[n]["lat"]), xytext=(6, -12),
                        textcoords="offset points", fontsize=8, fontweight="bold", color=INK)
    handles = [Line2D([], [], color=RISK_COLORS[i], lw=2, label=f"Lane risk: {RISK_NAMES[i]}") for i in range(4)]
    handles += [Line2D([], [], color=MISSING_COLOR, lw=2, label="Lane: weather data missing"),
                Line2D([], [], color=INK, lw=2, ls=":", label="Lane blocked (constraints)"),
                Line2D([], [], color=RECOMMENDED_COLOR, lw=8, alpha=0.35, label="Weather-aware route"),
                Line2D([], [], color=SHORTEST_COLOR, lw=1.6, ls=(0, (6, 3)), label="Shortest-distance route"),
                Line2D([], [], marker="s", color=INK, ls="", label="Port"),
                Line2D([], [], marker="o", color="#9c9c9c", ls="", markersize=4, label="Waypoint")]
    ax.legend(handles=handles, loc="lower left", fontsize=8, frameon=True)
    mean_lat = sum(d["lat"] for _, d in G.nodes(data=True)) / G.number_of_nodes()
    ax.set_aspect(1 / math.cos(math.radians(mean_lat)))
    ax.grid(color=GRID, lw=0.6); ax.set_axisbelow(True)
    ax.set_xlabel("Longitude (deg E)"); ax.set_ylabel("Latitude (deg N)")
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.set_title((title or _title(result)) + "\nDEMONSTRATION ONLY - schematic network, no coastline, "
                 "not a navigational chart", fontsize=10, color=INK, loc="left")
    fig.tight_layout()
    if save_path:
        fig.savefig(save_path, dpi=150)
    if show:
        plt.show()
    else:
        plt.close(fig)
    return fig


def plot_risk_profile(result: dict, save_path: Optional[str] = None, show=True):
    """Bar per segment of the recommended route (or the reference route if none)."""
    import matplotlib.pyplot as plt
    route = result.get("recommended_route") or result.get("alternative_route")
    if not route:
        print("No route to plot.")
        return None
    segs = route["segments"]
    labels = [f"{s['from']}\n->{s['to']}" for s in segs]
    vals = [s["severity_index"] if s["severity_index"] is not None else 0 for s in segs]
    colors = [RISK_COLORS[s["risk_level"]] if s["data_complete"] else MISSING_COLOR for s in segs]
    fig, ax = plt.subplots(figsize=(max(8, 0.7 * len(segs)), 4.5))
    ax.bar(range(len(segs)), vals, color=colors, width=0.7, edgecolor="white", linewidth=2)
    ax.axhline(1.0, color=INK, lw=1, ls="--")
    ax.text(len(segs) - 0.5, 1.02, "Severe threshold", ha="right", va="bottom", fontsize=8, color=INK)
    for i, s in enumerate(segs):
        ax.text(i, vals[i] + 0.02, s["risk_label"] if s["data_complete"] else "missing",
                ha="center", va="bottom", fontsize=7, color=INK)
    ax.set_xticks(range(len(segs))); ax.set_xticklabels(labels, fontsize=7, rotation=90)
    ax.set_ylabel("Severity index (1.0 = Severe threshold)")
    which = "recommended" if result.get("recommended_route") else "reference (NOT recommended)"
    ax.set_title(f"Weather severity along the {which} route\n{_title(result)}", fontsize=10, loc="left")
    ax.grid(axis="y", color=GRID, lw=0.6); ax.set_axisbelow(True)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    if save_path:
        fig.savefig(save_path, dpi=150)
    if show:
        plt.show()
    else:
        plt.close(fig)
    return fig


def _segment_tooltip(G, u, v):
    d = G.edges[u, v]; w = d.get("weather", {})
    fmt = lambda x, unit="": "n/a" if x is None else f"{x:.1f}{unit}"
    return (f"<b>{G.nodes[u]['name']} &rarr; {G.nodes[v]['name']}</b><br>"
            f"Risk: <b>{w.get('risk_label', '?')}</b>{'' if w.get('data_complete', True) else ' (data missing)'}<br>"
            f"Distance: {d['distance_km']:.0f} km / {d['distance_nm']:.0f} nm<br>"
            f"Wave height: {fmt(w.get('wave_height_m'), ' m')} ({w.get('encounter', '?')})<br>"
            f"Wind: {fmt(w.get('wind_speed_kn'), ' kn')}, gusts {fmt(w.get('wind_gusts_kn'), ' kn')}<br>"
            f"Depth (illustrative): {d['min_depth_m']:.1f} m<br>"
            f"Source: {', '.join(w.get('data_sources', []))}")


def make_folium_map(result: dict, save_path: Optional[str] = None):
    """Interactive map. Returns the folium.Map, or None if folium is not installed."""
    try:
        import folium
    except ImportError:
        print("folium is not installed - skipping the interactive map (pip install folium).")
        return None
    G = result["_graph"]
    lats = [d["lat"] for _, d in G.nodes(data=True)]; lons = [d["lon"] for _, d in G.nodes(data=True)]
    m = folium.Map(location=[sum(lats) / len(lats), sum(lons) / len(lons)], zoom_start=5,
                   tiles="CartoDB positron", control_scale=True)
    lanes = folium.FeatureGroup(name="Sea lanes coloured by weather risk", show=True)
    for e in _undirected_edges(G):
        a, b = G.nodes[e["u"]], G.nodes[e["v"]]
        color = MISSING_COLOR if e["missing"] and e["level"] <= 1 else RISK_COLORS[e["level"]]
        folium.PolyLine([(a["lat"], a["lon"]), (b["lat"], b["lon"])], color=color, weight=3,
                        opacity=0.9, dash_array="4 6" if e["blocked"] else None,
                        tooltip=folium.Tooltip(_segment_tooltip(G, e["u"], e["v"]))).add_to(lanes)
    lanes.add_to(m)
    for key, label, color, weight, dash in (("alternative_route", "Shortest-distance route", SHORTEST_COLOR, 3, "10 6"),
                                            ("recommended_route", "Weather-aware recommended route", RECOMMENDED_COLOR, 7, None)):
        route = result.get(key)
        if not route:
            continue
        fg = folium.FeatureGroup(name=label, show=True)
        for s in route["segments"]:
            a, b = G.nodes[s["from"]], G.nodes[s["to"]]
            folium.PolyLine([(a["lat"], a["lon"]), (b["lat"], b["lon"])], color=color, weight=weight,
                            opacity=0.55 if key == "recommended_route" else 0.9, dash_array=dash,
                            tooltip=folium.Tooltip(f"<b>{label}</b><br>" + _segment_tooltip(G, s["from"], s["to"]))
                            ).add_to(fg)
        fg.add_to(m)
    nodes = folium.FeatureGroup(name="Ports and waypoints", show=True)
    src, dst = result.get("source_port", {}).get("id"), result.get("destination_port", {}).get("id")
    for n, d in G.nodes(data=True):
        if n in (src, dst):
            folium.Marker((d["lat"], d["lon"]), tooltip=f"{'SOURCE' if n == src else 'DESTINATION'}: {d['name']}",
                          icon=folium.Icon(color="blue" if n == src else "red",
                                           icon="play" if n == src else "flag")).add_to(nodes)
        elif d["type"] == "port":
            folium.CircleMarker((d["lat"], d["lon"]), radius=6, color=INK, fill=True, fill_opacity=1,
                                tooltip=f"Port: {d['name']} ({n})").add_to(nodes)
        else:
            folium.CircleMarker((d["lat"], d["lon"]), radius=3, color="#7a7a7a", fill=True,
                                tooltip=f"Waypoint (synthetic): {d['name']}").add_to(nodes)
    nodes.add_to(m)
    folium.LayerControl(collapsed=False).add_to(m)

    rows = "".join(f'<div><span style="display:inline-block;width:22px;height:4px;background:{RISK_COLORS[i]};'
                   f'vertical-align:middle;margin-right:6px"></span>{RISK_NAMES[i]} risk lane</div>' for i in range(4))
    legend = f"""
    <div style="position:fixed;bottom:24px;left:24px;z-index:9999;background:white;padding:10px 12px;
                border:1px solid rgba(11,11,11,0.15);border-radius:6px;font:12px sans-serif;color:{INK}">
      <b>Legend</b>{rows}
      <div><span style="display:inline-block;width:22px;height:4px;background:{MISSING_COLOR};vertical-align:middle;margin-right:6px"></span>Weather data missing</div>
      <div><span style="display:inline-block;width:22px;border-top:3px dashed {INK};vertical-align:middle;margin-right:6px"></span>Blocked lane (constraints)</div>
      <div><span style="display:inline-block;width:22px;height:7px;background:{RECOMMENDED_COLOR};opacity:.55;vertical-align:middle;margin-right:6px"></span>Weather-aware route</div>
      <div><span style="display:inline-block;width:22px;border-top:3px dashed {SHORTEST_COLOR};vertical-align:middle;margin-right:6px"></span>Shortest-distance route</div>
    </div>"""
    banner = f"""
    <div style="position:fixed;top:12px;left:60px;right:220px;z-index:9999;background:#fff8e1;padding:8px 12px;
                border:1px solid #fbb315;border-radius:6px;font:12px sans-serif;color:{INK}">
      <b>DEMONSTRATION MAP - NOT A NAVIGATIONAL CHART.</b> Synthetic waypoint network.
      {_title(result)} | weather source: {', '.join(result.get('weather_source', []))}
      | Weather data by Open-Meteo.com (CC-BY 4.0) when the source is open-meteo.
    </div>"""
    m.get_root().html.add_child(folium.Element(legend + banner))
    if save_path:
        m.save(save_path)
    return m
