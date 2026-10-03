"""Merge the full October catalog with the 50 handpicked event records."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_csv(name):
    with (ROOT / name).open(newline="", encoding="utf-8-sig") as source:
        return list(csv.DictReader(source))


def display_cost(raw):
    value = raw.strip()
    if value == "0":
        return "Free"
    if value.startswith("0 ("):
        return f"Free {value[1:]}"
    if value.lower() == "paid (see site)":
        return "Paid (see event page)"
    if value and value[0].isdigit():
        return f"${value}"
    return value or "See event page"


def time_label(row):
    start = row["start_time"].strip()
    end = row["end_time"].strip()
    if start and end:
        return f'{row["date"]} {start}-{end} PT'
    if start:
        return f'{row["date"]} {start} PT'
    return "Time on event page"


catalog = read_csv("240+_EVENTS.csv")
top = {row["id"]: row for row in read_csv("top50_eventsinSF.csv")}
if len(catalog) != len({row["id"] for row in catalog}):
    raise ValueError("Duplicate event IDs in the full catalog")
if set(top) - {row["id"] for row in catalog}:
    raise ValueError("A handpicked event is missing from the full catalog")

result = []
for row in catalog:
    pick = top.get(row["id"])
    city = row["city"].strip()
    neighborhood = (pick or {}).get("neighborhood") or row["neighborhood"].strip()
    if not neighborhood:
        neighborhood = city if city != "San Francisco" else "unknown"
    result.append({
        "id": row["id"],
        "rank": int(pick["rank"]) if pick else None,
        "topPick": bool(pick),
        "name": (pick or {}).get("name") or row["name"],
        "url": (pick or {}).get("url") or row["url"],
        "date": (pick or {}).get("date") or row["date"],
        "time_pt": (pick or {}).get("time_pt") or time_label(row),
        "city": city,
        "neighborhood": neighborhood,
        "venue": (pick or {}).get("venue") or row["venue"],
        "latitude": float(row["latitude"]) if row["latitude"] else None,
        "longitude": float(row["longitude"]) if row["longitude"] else None,
        "host": (pick or {}).get("host") or row["host_organizers"] or "Event organizers",
        "cost": (pick or {}).get("cost") or display_cost(row["cost"]),
        "access": (pick or {}).get("access") or row["access"],
        "how_to_get_in": (pick or {}).get("how_to_get_in") or row["how_to_get_in"],
        "stage_opportunity": (pick or {}).get("stage_opportunity") or row["stage_opportunity"],
        "category": (pick or {}).get("category") or row["category"],
        "why_attend": (pick or {}).get("why_attend") or row["why_attend"],
    })

result.sort(key=lambda event: (
    not event["topPick"],
    event["rank"] if event["topPick"] else 0,
    event["date"],
    event["time_pt"],
    event["name"],
))
(ROOT / "src" / "events.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f'Wrote {len(result)} events, including {len(top)} handpicked events')
