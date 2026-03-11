"""
Transforma datos Overpass API (OSM) a GeoJSON estándar de comunas de Medellín.
Los datos Overpass vienen en formato raw con nodos, ways y relations.
"""
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
GEOJSON_DIR = Path(__file__).parent.parent.parent / "public" / "geojson"


def overpass_to_geojson(input_path: str, output_path: str) -> dict:
    """Convert Overpass JSON response to standard GeoJSON FeatureCollection."""
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    elements = data.get("elements", [])

    # Index nodes by ID for coordinate lookup
    nodes = {}
    for el in elements:
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])

    # Index ways by ID
    ways = {}
    for el in elements:
        if el["type"] == "way":
            coords = []
            for nd_id in el.get("nodes", []):
                if nd_id in nodes:
                    coords.append(nodes[nd_id])
            if coords:
                ways[el["id"]] = coords

    # Process relations into polygons
    features = []
    for el in elements:
        if el["type"] != "relation":
            continue

        tags = el.get("tags", {})
        name = tags.get("name", "Sin nombre")
        admin_level = tags.get("admin_level", "")

        # Build polygon from outer members
        outer_rings = []
        for member in el.get("members", []):
            if member.get("role") == "outer" and member.get("type") == "way":
                way_id = member["ref"]
                if way_id in ways:
                    outer_rings.append(ways[way_id])

        if not outer_rings:
            continue

        # Try to merge connected rings
        merged = merge_rings(outer_rings)

        for ring in merged:
            # Close the ring if needed
            if ring[0] != ring[-1]:
                ring.append(ring[0])

            if len(ring) < 4:
                continue

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ring],
                },
                "properties": {
                    "NOMBRE": name,
                    "nombre": name,
                    "admin_level": admin_level,
                    "osm_id": el["id"],
                    **{k: v for k, v in tags.items() if k not in ("name", "admin_level")},
                },
            }
            features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    print(f"  ✅ Convertido: {len(features)} polígonos -> {output_path}")
    return geojson


def merge_rings(rings: list[list[tuple]]) -> list[list[tuple]]:
    """Merge connected way segments into complete rings."""
    if not rings:
        return []

    # Build an adjacency map: endpoint -> list of ring indices
    remaining = list(range(len(rings)))
    merged = []

    while remaining:
        current = list(rings[remaining.pop(0)])
        changed = True

        while changed:
            changed = False
            for i in list(remaining):
                ring = rings[i]
                if not ring:
                    remaining.remove(i)
                    continue

                # Check if this ring connects to current
                if current[-1] == ring[0]:
                    current.extend(ring[1:])
                    remaining.remove(i)
                    changed = True
                elif current[-1] == ring[-1]:
                    current.extend(reversed(ring[:-1]))
                    remaining.remove(i)
                    changed = True
                elif current[0] == ring[-1]:
                    current = list(ring[:-1]) + current
                    remaining.remove(i)
                    changed = True
                elif current[0] == ring[0]:
                    current = list(reversed(ring[1:])) + current
                    remaining.remove(i)
                    changed = True

        merged.append(current)

    return merged


def identify_comunas(geojson: dict) -> dict:
    """
    Filter and tag features that correspond to Medellín's 16 comunas and 5 corregimientos.
    """
    KNOWN_COMUNAS = {
        "popular": "01",
        "santa cruz": "02",
        "manrique": "03",
        "aranjuez": "04",
        "castilla": "05",
        "doce de octubre": "06",
        "12 de octubre": "06",
        "robledo": "07",
        "villa hermosa": "08",
        "buenos aires": "09",
        "la candelaria": "10",
        "candelaria": "10",
        "laureles-estadio": "11",
        "laureles": "11",
        "la américa": "12",
        "la america": "12",
        "san javier": "13",
        "el poblado": "14",
        "poblado": "14",
        "guayabal": "15",
        "belén": "16",
        "belen": "16",
    }

    KNOWN_CORREGIMIENTOS = {
        "san sebastián de palmitas": "50",
        "palmitas": "50",
        "san cristóbal": "60",
        "san cristobal": "60",
        "altavista": "70",
        "san antonio de prado": "80",
        "santa elena": "90",
    }

    comunas_features = []
    for feature in geojson.get("features", []):
        name = feature["properties"].get("NOMBRE", "").strip()
        name_lower = name.lower()

        code = None
        tipo = None

        for key, val in KNOWN_COMUNAS.items():
            if key in name_lower:
                code = val
                tipo = "comuna"
                break

        if not code:
            for key, val in KNOWN_CORREGIMIENTOS.items():
                if key in name_lower:
                    code = val
                    tipo = "corregimiento"
                    break

        if code:
            feature["properties"]["IDENTIFICACION"] = code
            feature["properties"]["tipo"] = tipo
            comunas_features.append(feature)

    result = {"type": "FeatureCollection", "features": comunas_features}
    print(f"  Identificadas {len(comunas_features)} comunas/corregimientos")
    return result


def run():
    """Process Overpass data into clean GeoJSON."""
    print("🔄 Transformando datos Overpass a GeoJSON...")

    input_file = RAW_DIR / "overpass_medellin_divisions.json"
    if not input_file.exists():
        print("  ⚠️ No hay datos Overpass. Ejecutar geo_collector primero.")
        return

    # Step 1: Convert to GeoJSON
    all_output = GEOJSON_DIR / "medellin_divisions_all.geojson"
    geojson = overpass_to_geojson(str(input_file), str(all_output))

    # Step 2: Identify and filter comunas
    comunas = identify_comunas(geojson)
    comunas_output = GEOJSON_DIR / "comunas_medellin.geojson"
    with open(comunas_output, "w", encoding="utf-8") as f:
        json.dump(comunas, f, ensure_ascii=False)
    print(f"  ✅ Comunas guardadas: {comunas_output}")


if __name__ == "__main__":
    run()
