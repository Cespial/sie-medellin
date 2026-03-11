"""
SIE Medellín — Data Loop Orchestrator
Ejecuta todos los collectors en orden y registra resultados.
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


def main():
    parser = argparse.ArgumentParser(description="SIE Medellín Data Loop")
    parser.add_argument(
        "--fuente",
        default="all",
        choices=["all", "geo", "medata", "datos_gov", "icfes", "dane"],
        help="Fuente específica a ejecutar",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🧠 SIE MEDELLÍN — DATA LOOP ORCHESTRATOR")
    print("=" * 60)
    start = time.time()

    collectors = {
        "geo": ("Datos Geoespaciales", run_geo),
        "medata": ("MEData Medellín", run_medata),
        "datos_gov": ("datos.gov.co", run_datos_gov),
    }

    results = {}
    for key, (name, func) in collectors.items():
        if args.fuente != "all" and args.fuente != key:
            continue

        print(f"\n{'='*60}")
        print(f"▶ Ejecutando: {name}")
        print(f"{'='*60}")

        try:
            func()
            results[key] = "✅ Exitoso"
        except Exception as e:
            results[key] = f"❌ Error: {e}"
            print(f"\n❌ Error en {name}: {e}")

    elapsed = time.time() - start

    print(f"\n{'='*60}")
    print("📋 RESUMEN DE EJECUCIÓN")
    print(f"{'='*60}")
    for key, status in results.items():
        print(f"  {key}: {status}")
    print(f"\n⏱ Tiempo total: {elapsed:.1f}s")

    # List downloaded files
    raw_dir = Path(__file__).parent / "data" / "raw"
    geojson_dir = Path(__file__).parent.parent / "public" / "geojson"

    if raw_dir.exists():
        files = list(raw_dir.iterdir())
        print(f"\n📂 Archivos en data/raw/: {len(files)}")
        for f in sorted(files):
            size = f.stat().st_size
            print(f"  {f.name} ({size/1024:.1f} KB)")

    if geojson_dir.exists():
        files = list(geojson_dir.iterdir())
        print(f"\n📂 Archivos en public/geojson/: {len(files)}")
        for f in sorted(files):
            size = f.stat().st_size
            print(f"  {f.name} ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
