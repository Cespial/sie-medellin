"""
SIE Medellín — Data Loop Orchestrator
Ejecuta collectors y transformers en orden.
"""
import sys
import time
import argparse
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from loop.collectors.geo_collector import run_all as run_geo
from loop.collectors.medata_collector import run_all as run_medata
from loop.collectors.datos_gov_collector import run_all as run_datos_gov


def run_transformers():
    """Run all data transformers."""
    from loop.transformers.process_for_frontend import run as run_frontend
    from loop.transformers.process_medata_csv import run as run_medata_csv
    from loop.transformers.process_saber11_enriched import run as run_saber11
    from loop.transformers.process_poblaciones import run as run_poblaciones

    run_frontend()
    run_medata_csv()
    run_saber11()
    run_poblaciones()


def main():
    parser = argparse.ArgumentParser(description="SIE Medellín Data Loop")
    parser.add_argument(
        "--fuente",
        default="all",
        choices=["all", "geo", "medata", "datos_gov", "transform"],
        help="Fuente específica a ejecutar",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("SIE MEDELLIN — DATA LOOP ORCHESTRATOR")
    print("=" * 60)
    start = time.time()

    collectors = {
        "geo": ("Datos Geoespaciales", run_geo),
        "medata": ("MEData Medellín", run_medata),
        "datos_gov": ("datos.gov.co", run_datos_gov),
        "transform": ("Transformers", run_transformers),
    }

    results = {}
    for key, (name, func) in collectors.items():
        if args.fuente != "all" and args.fuente != key:
            continue

        print(f"\n{'='*60}")
        print(f"Ejecutando: {name}")
        print(f"{'='*60}")

        try:
            func()
            results[key] = "OK"
        except Exception as e:
            results[key] = f"ERROR: {e}"
            print(f"\nError en {name}: {e}")

    elapsed = time.time() - start

    print(f"\n{'='*60}")
    print("RESUMEN DE EJECUCION")
    print(f"{'='*60}")
    for key, status in results.items():
        print(f"  {key}: {status}")
    print(f"\nTiempo total: {elapsed:.1f}s")

    # File inventory
    raw_dir = Path(__file__).parent / "data" / "raw"
    public_data = Path(__file__).parent.parent / "public" / "data"
    geojson_dir = Path(__file__).parent.parent / "public" / "geojson"

    for label, d in [("data/raw", raw_dir), ("public/data", public_data), ("public/geojson", geojson_dir)]:
        if d.exists():
            files = list(d.iterdir())
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            print(f"\n{label}/: {len(files)} archivos ({total_size/1024/1024:.1f} MB)")


if __name__ == "__main__":
    main()
