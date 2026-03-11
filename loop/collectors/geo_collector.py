"""
Geo Collector — Descarga GeoJSON de comunas, barrios e IEs de Medellín
Intenta múltiples fuentes para máxima disponibilidad.
"""
import json
import requests
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
GEOJSON_DIR = Path(__file__).parent.parent.parent / "public" / "geojson"
RAW_DIR.mkdir(parents=True, exist_ok=True)
GEOJSON_DIR.mkdir(parents=True, exist_ok=True)


def download_comunas_overpass() -> bool:
    """Download Medellín comunas from OpenStreetMap Overpass API."""
    print("\n📍 Intentando Overpass API (OpenStreetMap)...")

    # Query for administrative boundaries inside Medellín
    query = """
    [out:json][timeout:120];
    area["name"="Medellín"]["boundary"="administrative"]["admin_level"="6"]->.medellin;
    (
      relation(area.medellin)["boundary"="administrative"]["admin_level"~"8|9|10"];
    );
    out body;
    >;
    out skel qt;
    """

    try:
        r = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()

        elements = data.get("elements", [])
        relations = [e for e in elements if e.get("type") == "relation"]
        print(f"  Encontradas {len(relations)} divisiones administrativas")

        if relations:
            output = RAW_DIR / "overpass_medellin_divisions.json"
            with open(output, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            print(f"  ✅ Datos Overpass guardados: {output}")
            return True
    except Exception as e:
        print(f"  ⚠️ Overpass falló: {e}")

    return False


def download_comunas_nominatim() -> bool:
    """Use Nominatim to get Medellín boundary."""
    print("\n📍 Intentando Nominatim...")
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": "Medellín, Antioquia, Colombia",
            "format": "geojson",
            "polygon_geojson": 1,
            "limit": 1,
        }
        headers = {"User-Agent": "SIE-Medellin/1.0 (educacion@medellin.gov.co)"}
        r = requests.get(url, params=params, headers=headers, timeout=30)
        r.raise_for_status()

        data = r.json()
        if data.get("features"):
            output = GEOJSON_DIR / "medellin_boundary.geojson"
            with open(output, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            print(f"  ✅ Límite de Medellín guardado: {output}")
            return True
    except Exception as e:
        print(f"  ⚠️ Nominatim falló: {e}")
    return False


def download_from_medata_wfs() -> bool:
    """Try GeoMedellín WFS service for comunas."""
    print("\n📍 Intentando GeoMedellín ArcGIS...")

    # Known ArcGIS REST services for Medellín
    service_urls = [
        "https://www.medellin.gov.co/mapas/rest/services/DatosAbiertos/ComunasVeredas/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
        "https://www.medellin.gov.co/mapas/rest/services/DatosAbiertos/Comunas/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
        "https://geomedellin.gov.co/arcgis/rest/services/Geodata/comunas/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
    ]

    for url in service_urls:
        try:
            print(f"  Probando: {url[:80]}...")
            r = requests.get(url, timeout=30)
            if r.status_code == 200:
                data = r.json()
                features = data.get("features", [])
                if features:
                    output = GEOJSON_DIR / "comunas_medellin.geojson"
                    with open(output, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False)
                    print(f"  ✅ {len(features)} comunas descargadas: {output}")
                    return True
        except Exception as e:
            print(f"  ⚠️ {e}")

    return False


def create_fallback_comunas_geojson() -> bool:
    """
    Create a basic GeoJSON with Medellín's 16 comunas using approximate centroids.
    This is a fallback — real polygons should come from official sources.
    """
    print("\n📍 Creando GeoJSON de referencia con centroides de comunas...")

    # Official comunas of Medellín with approximate centroids
    comunas = [
        {"code": "01", "name": "Popular", "lat": 6.2892, "lon": -75.5477},
        {"code": "02", "name": "Santa Cruz", "lat": 6.2847, "lon": -75.5572},
        {"code": "03", "name": "Manrique", "lat": 6.2752, "lon": -75.5398},
        {"code": "04", "name": "Aranjuez", "lat": 6.2732, "lon": -75.5589},
        {"code": "05", "name": "Castilla", "lat": 6.2782, "lon": -75.5758},
        {"code": "06", "name": "Doce de Octubre", "lat": 6.2852, "lon": -75.5805},
        {"code": "07", "name": "Robledo", "lat": 6.2722, "lon": -75.5902},
        {"code": "08", "name": "Villa Hermosa", "lat": 6.2582, "lon": -75.5442},
        {"code": "09", "name": "Buenos Aires", "lat": 6.2412, "lon": -75.5498},
        {"code": "10", "name": "La Candelaria", "lat": 6.2532, "lon": -75.5632},
        {"code": "11", "name": "Laureles-Estadio", "lat": 6.2482, "lon": -75.5822},
        {"code": "12", "name": "La América", "lat": 6.2512, "lon": -75.5942},
        {"code": "13", "name": "San Javier", "lat": 6.2572, "lon": -75.6102},
        {"code": "14", "name": "El Poblado", "lat": 6.2112, "lon": -75.5692},
        {"code": "15", "name": "Guayabal", "lat": 6.2172, "lon": -75.5882},
        {"code": "16", "name": "Belén", "lat": 6.2292, "lon": -75.5972},
    ]

    corregimientos = [
        {"code": "50", "name": "San Sebastián de Palmitas", "lat": 6.2850, "lon": -75.6650},
        {"code": "60", "name": "San Cristóbal", "lat": 6.2790, "lon": -75.6250},
        {"code": "70", "name": "Altavista", "lat": 6.2280, "lon": -75.6200},
        {"code": "80", "name": "San Antonio de Prado", "lat": 6.1850, "lon": -75.6400},
        {"code": "90", "name": "Santa Elena", "lat": 6.2220, "lon": -75.5050},
    ]

    features = []
    for c in comunas + corregimientos:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c["lon"], c["lat"]],
            },
            "properties": {
                "IDENTIFICACION": c["code"],
                "NOMBRE": c["name"],
                "tipo": "comuna" if len(c["code"]) == 2 and int(c["code"]) <= 16 else "corregimiento",
            },
        })

    geojson = {"type": "FeatureCollection", "features": features}

    output = GEOJSON_DIR / "comunas_centroids.geojson"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Centroides de comunas guardados: {output} ({len(features)} puntos)")
    return True


def run_all():
    """Run all geo collectors in priority order."""
    print("=" * 60)
    print("GEO COLLECTOR — SIE Medellín")
    print("=" * 60)

    # Try official sources first
    success = download_from_medata_wfs()

    if not success:
        success = download_comunas_overpass()

    # Always get the city boundary
    download_comunas_nominatim()

    # Always create the fallback centroids
    create_fallback_comunas_geojson()

    print("\n✅ Geo collector finalizado")


if __name__ == "__main__":
    run_all()
