"""
datos.gov.co Collector — Descarga datasets educativos de Medellín via Socrata API

Datasets confirmados:
- kgxf-xxbe: Saber 11 microdatos (periodo, puntajes, estrato, cole_cod_mcpio_ubicacion)
- x5ay-984n: Sedes educativas con coordenadas (cod_dane_municipio, total_matricula)
- emd6-ef7x: Directorio establecimientos educativos
- ji8i-4anb: Estadísticas MEN por departamento (cobertura, desercion, aprobacion)
- sras-4t5p / nudc-7mev: Estadísticas educación por municipio
- 5c2k-ahfc: Bachilleres (graduados grado 11 y 26) por municipio
- y9ga-zwzy: Matrícula educación superior por municipio
- v5z5-e88h: Índice de paridad de género por municipio
- pgrh-8um9: Docentes oficiales EPBM por secretaría
"""
import json
import time
import requests
from pathlib import Path

SOCRATA_BASE = "https://www.datos.gov.co/resource"
MEDELLIN_CODE = "05001"
ANTIOQUIA_CODE = "5"

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
GEOJSON_DIR = Path(__file__).parent.parent.parent / "public" / "geojson"
RAW_DIR.mkdir(parents=True, exist_ok=True)
GEOJSON_DIR.mkdir(parents=True, exist_ok=True)

# Common headers to avoid being blocked
HEADERS = {
    "User-Agent": "SIE-Medellin/1.0 (sistema.inteligencia.educativa@medellin.gov.co)",
    "Accept": "application/json",
}


def fetch_socrata(resource_id: str, params: dict | None = None, limit: int = 1000) -> list[dict]:
    """Fetch data from datos.gov.co Socrata API."""
    url = f"{SOCRATA_BASE}/{resource_id}.json"
    default_params = {"$limit": limit}
    if params:
        default_params.update(params)

    try:
        r = requests.get(url, params=default_params, headers=HEADERS, timeout=120)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list):
            return data
    except requests.exceptions.HTTPError as e:
        print(f"  ⚠️ HTTP {r.status_code} for {resource_id}: {e}")
    except Exception as e:
        print(f"  ⚠️ Error: {e}")
    return []


def fetch_paginated(resource_id: str, where_clause: str = "", max_records: int = 50000, order: str = "") -> list[dict]:
    """Fetch with pagination to get all records."""
    all_data = []
    offset = 0
    batch = 1000

    while offset < max_records:
        params = {"$offset": offset}
        if where_clause:
            params["$where"] = where_clause
        if order:
            params["$order"] = order

        data = fetch_socrata(resource_id, params, limit=batch)
        if not data:
            break

        all_data.extend(data)
        offset += len(data)

        if len(all_data) % 5000 == 0 or len(data) < batch:
            print(f"  -> Acumulado: {len(all_data)} registros")

        if len(data) < batch:
            break

        # Rate limit courtesy
        time.sleep(0.5)

    return all_data


def save_json(data: list[dict], filename: str) -> str:
    output = RAW_DIR / filename
    with open(output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    size_kb = output.stat().st_size / 1024
    print(f"  ✅ {output.name} ({len(data)} registros, {size_kb:.1f} KB)")
    return str(output)


def save_geojson_points(data: list[dict], filename: str, lat_col: str, lon_col: str) -> int:
    features = []
    for record in data:
        try:
            lat = float(record.get(lat_col, 0))
            lon = float(record.get(lon_col, 0))
            if abs(lat) < 0.1 or abs(lon) < 0.1:
                continue
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {k: v for k, v in record.items() if k not in (lat_col, lon_col)},
            })
        except (ValueError, TypeError):
            continue

    geojson = {"type": "FeatureCollection", "features": features}
    output = GEOJSON_DIR / filename
    with open(output, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)
    print(f"  ✅ GeoJSON: {output.name} ({len(features)} puntos)")
    return len(features)


def download_saber11():
    """Saber 11 microdatos — Medellín (kgxf-xxbe)"""
    print("\n📊 [1/5] Saber 11 Microdatos...")
    data = fetch_paginated(
        "kgxf-xxbe",
        where_clause=f"cole_cod_mcpio_ubicacion='{MEDELLIN_CODE}'",
        order="periodo DESC",
    )
    if data:
        save_json(data, "saber11_medellin.json")
        periodos = sorted(set(r.get("periodo", "") for r in data))
        print(f"  Períodos: {periodos}")
    return data


def download_sedes_educativas():
    """Sedes educativas con coordenadas — Medellín (x5ay-984n)"""
    print("\n📊 [2/5] Sedes Educativas con Coordenadas...")
    data = fetch_paginated(
        "x5ay-984n",
        where_clause=f"cod_dane_municipio='{MEDELLIN_CODE}'",
    )
    if data:
        save_json(data, "sedes_educativas_medellin.json")
        save_geojson_points(data, "instituciones_educativas.geojson", "coordenada_y_sede", "coordenada_x_sede")
    return data


def download_directorio_ie():
    """Directorio de establecimientos educativos (emd6-ef7x)"""
    print("\n📊 [3/5] Directorio Establecimientos...")

    # Fetch all and filter locally (URL encoding issues with accented column names)
    data = fetch_paginated("emd6-ef7x", max_records=50000)
    medellin = [
        r for r in data
        if r.get("código_municipio", r.get("codigo_municipio", "")) == "05001"
        or "MEDELL" in r.get("municipio", "").upper()
    ]
    print(f"  Filtrados para Medellín: {len(medellin)} de {len(data)} total")
    if medellin:
        save_json(medellin, "directorio_ie_medellin.json")
    return medellin


def download_estadisticas_men():
    """Estadísticas MEN por departamento (ji8i-4anb) — Antioquia"""
    print("\n📊 [4/5] Estadísticas MEN Departamentales...")
    data = fetch_paginated(
        "ji8i-4anb",
        where_clause=f"c_digo_departamento='{ANTIOQUIA_CODE}'",
        order="ano DESC",
    )
    if data:
        save_json(data, "estadisticas_men_antioquia.json")
    return data


def download_estadisticas_municipio():
    """Estadísticas educación por municipio (sras-4t5p / nudc-7mev)"""
    print("\n📊 [5/5] Estadísticas por Municipio...")

    # Try multiple resource IDs for municipal-level data
    for rid in ["sras-4t5p", "nudc-7mev"]:
        print(f"  Probando {rid}...")
        # First check what columns exist
        sample = fetch_socrata(rid, limit=2)
        if not sample:
            continue

        cols = list(sample[0].keys())
        print(f"  Columnas: {cols[:10]}...")

        # Find municipality column
        muni_col = None
        for candidate in ["c_digo_municipio", "codigo_municipio", "cod_municipio"]:
            if candidate in cols:
                muni_col = candidate
                break

        if muni_col:
            data = fetch_paginated(rid, where_clause=f"{muni_col}='{MEDELLIN_CODE}'")
        else:
            data = fetch_paginated(rid, max_records=5000)
            data = [r for r in data if MEDELLIN_CODE in json.dumps(r)]

        if data:
            save_json(data, f"estadisticas_municipio_{rid}.json")
            return data

    return []


def download_bachilleres():
    """Bachilleres (graduados grado 11 y 26) — Medellín (5c2k-ahfc)"""
    print("\n📊 [6/9] Bachilleres...")
    data = fetch_paginated(
        "5c2k-ahfc",
        where_clause=f"codigo_municipio='{MEDELLIN_CODE}'",
        order="a_o DESC",
    )
    if data:
        save_json(data, "bachilleres_medellin.json")
    return data


def download_educacion_superior():
    """Matrícula educación superior por municipio — Medellín (y9ga-zwzy)"""
    print("\n📊 [7/9] Educación Superior...")
    data = fetch_paginated(
        "y9ga-zwzy",
        where_clause="nombre_del_municipio like '%MEDELL%'",
        order="a_o DESC",
    )
    if data:
        save_json(data, "educacion_superior_medellin.json")
    return data


def download_paridad_genero():
    """Índice de paridad de género — Medellín (v5z5-e88h)"""
    print("\n📊 [8/9] Paridad de Género...")
    data = fetch_socrata(
        "v5z5-e88h",
        params={"$where": "divipola_municipio='5001'"},
        limit=100,
    )
    if data:
        save_json(data, "paridad_genero_medellin.json")
    return data


def download_docentes():
    """Docentes oficiales EPBM — Medellín (pgrh-8um9)"""
    print("\n📊 [9/9] Docentes Oficiales...")
    data = fetch_paginated(
        "pgrh-8um9",
        where_clause="codigo_sed like '%edell%'",
    )
    if data:
        save_json(data, "docentes_medellin_perfil.json")
    return data


def run_all():
    print("=" * 60)
    print("DATOS.GOV.CO COLLECTOR — SIE Medellín")
    print("=" * 60)

    results = {}
    for name, func in [
        ("Saber 11", download_saber11),
        ("Sedes Educativas", download_sedes_educativas),
        ("Directorio IEs", download_directorio_ie),
        ("Estadísticas MEN", download_estadisticas_men),
        ("Estadísticas Municipio", download_estadisticas_municipio),
        ("Bachilleres", download_bachilleres),
        ("Educación Superior", download_educacion_superior),
        ("Paridad de Género", download_paridad_genero),
        ("Docentes", download_docentes),
    ]:
        try:
            data = func()
            results[name] = len(data) if data else 0
        except Exception as e:
            print(f"  ❌ Error en {name}: {e}")
            results[name] = -1

    print(f"\n{'='*60}")
    print("📋 RESUMEN DATOS.GOV.CO")
    print(f"{'='*60}")
    for name, count in results.items():
        status = f"✅ {count} registros" if count > 0 else ("⚠️ Sin datos" if count == 0 else "❌ Error")
        print(f"  {name}: {status}")


def run_new_only():
    """Descarga solo los 4 datasets nuevos."""
    print("=" * 60)
    print("DATOS.GOV.CO — Nuevos Datasets")
    print("=" * 60)

    results = {}
    for name, func in [
        ("Bachilleres", download_bachilleres),
        ("Educación Superior", download_educacion_superior),
        ("Paridad de Género", download_paridad_genero),
        ("Docentes", download_docentes),
    ]:
        try:
            data = func()
            results[name] = len(data) if data else 0
        except Exception as e:
            print(f"  ❌ Error en {name}: {e}")
            results[name] = -1

    print(f"\n{'='*60}")
    print("📋 RESUMEN")
    print(f"{'='*60}")
    for name, count in results.items():
        status = f"✅ {count} registros" if count > 0 else ("⚠️ Sin datos" if count == 0 else "❌ Error")
        print(f"  {name}: {status}")


if __name__ == "__main__":
    import sys
    if "--new-only" in sys.argv:
        run_new_only()
    else:
        run_all()
