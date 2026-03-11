"""
MEData Collector — Descarga datasets de medata.gov.co (portal de datos abiertos de Medellín)
"""
import json
import requests
import pandas as pd
from pathlib import Path

MEDATA_BASE = "https://medata.gov.co/api/3/action"
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
GEOJSON_DIR = Path(__file__).parent.parent.parent / "public" / "geojson"
RAW_DIR.mkdir(parents=True, exist_ok=True)
GEOJSON_DIR.mkdir(parents=True, exist_ok=True)


def search_datasets(query: str, rows: int = 50) -> list[dict]:
    """Search MEData for datasets matching query."""
    url = f"{MEDATA_BASE}/package_search"
    try:
        r = requests.get(url, params={"q": query, "rows": rows}, timeout=15)
        r.raise_for_status()
        results = r.json().get("result", {}).get("results", [])
        return results
    except Exception as e:
        print(f"  ⚠️ Error buscando '{query}': {e}")
        return []


def get_dataset_resources(dataset_id: str) -> list[dict]:
    """Get all resources for a specific dataset."""
    url = f"{MEDATA_BASE}/package_show"
    try:
        r = requests.get(url, params={"id": dataset_id}, timeout=15)
        r.raise_for_status()
        return r.json().get("result", {}).get("resources", [])
    except Exception as e:
        print(f"  ⚠️ Error obteniendo recursos de '{dataset_id}': {e}")
        return []


def download_resource_data(resource_id: str, limit: int = 32000) -> pd.DataFrame:
    """Download data from a MEData resource via datastore API."""
    url = f"{MEDATA_BASE}/datastore_search"
    try:
        r = requests.get(url, params={"resource_id": resource_id, "limit": limit}, timeout=60)
        r.raise_for_status()
        records = r.json().get("result", {}).get("records", [])
        return pd.DataFrame(records)
    except Exception as e:
        print(f"  ⚠️ Error descargando recurso '{resource_id}': {e}")
        return pd.DataFrame()


def download_file_resource(url: str, filename: str) -> bool:
    """Download a file resource (GeoJSON, CSV, etc.)."""
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()

        filepath = RAW_DIR / filename
        # If it's GeoJSON, also save to public dir
        if filename.endswith(".geojson") or filename.endswith(".json"):
            try:
                data = r.json()
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)

                # Also save to public/geojson for frontend
                public_path = GEOJSON_DIR / filename
                with open(public_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                print(f"  ✅ GeoJSON guardado: {public_path}")
                return True
            except json.JSONDecodeError:
                pass

        with open(filepath, "wb") as f:
            f.write(r.content)
        print(f"  ✅ Archivo guardado: {filepath}")
        return True
    except Exception as e:
        print(f"  ⚠️ Error descargando {url}: {e}")
        return False


def discover_and_download_education_data():
    """Search for and download all education-related datasets."""
    print("\n🔍 Buscando datasets educativos en MEData...")

    queries = [
        "instituciones educativas",
        "educacion",
        "matricula",
        "colegios",
        "desercion",
        "comunas",
        "barrios",
        "limite comunas",
        "division politica",
    ]

    all_datasets = {}
    for query in queries:
        datasets = search_datasets(query)
        for ds in datasets:
            ds_id = ds.get("name", ds.get("id", ""))
            if ds_id and ds_id not in all_datasets:
                all_datasets[ds_id] = ds
                title = ds.get("title", "Sin título")
                num_resources = len(ds.get("resources", []))
                print(f"  [{ds_id}] {title} ({num_resources} recursos)")

    print(f"\n📦 Total datasets únicos encontrados: {len(all_datasets)}")

    # Download resources, prioritizing GeoJSON and CSV
    downloaded = 0
    for ds_id, ds in all_datasets.items():
        title = ds.get("title", ds_id)
        resources = ds.get("resources", [])

        for res in resources:
            fmt = res.get("format", "").upper()
            url = res.get("url", "")
            res_name = res.get("name", "")

            if not url:
                continue

            # Priority: GeoJSON > CSV > JSON
            if "GEOJSON" in fmt or "geojson" in url.lower():
                safe_name = f"medata_{ds_id}.geojson"
                print(f"\n  📍 Descargando GeoJSON: {title}")
                download_file_resource(url, safe_name)
                downloaded += 1
            elif "CSV" in fmt:
                safe_name = f"medata_{ds_id}.csv"
                print(f"\n  📊 Descargando CSV: {title}")
                download_file_resource(url, safe_name)
                downloaded += 1
            elif "JSON" in fmt and "GEO" not in fmt:
                # Try datastore API for structured data
                res_id = res.get("id", "")
                if res_id:
                    print(f"\n  📊 Descargando via datastore: {title}")
                    df = download_resource_data(res_id)
                    if not df.empty:
                        output = RAW_DIR / f"medata_{ds_id}.parquet"
                        df.to_parquet(output, index=False)
                        print(f"  ✅ {len(df)} registros -> {output}")
                        downloaded += 1

    return downloaded


def run_all():
    """Run the full MEData collector."""
    print("=" * 60)
    print("MEDATA COLLECTOR — SIE Medellín")
    print("=" * 60)

    downloaded = discover_and_download_education_data()
    print(f"\n✅ MEData collector finalizado: {downloaded} recursos descargados")


if __name__ == "__main__":
    run_all()
