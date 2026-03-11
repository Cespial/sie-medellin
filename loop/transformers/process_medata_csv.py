"""
Procesa los CSV de MEData y genera datos enriquecidos para el frontend.
"""
import csv
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def read_csv(filename: str) -> list[dict]:
    filepath = RAW_DIR / filename
    if not filepath.exists():
        print(f"  ⚠️ {filename} no existe")
        return []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def process_desercion():
    """Procesa deserción por comuna y genera series temporales."""
    print("📊 Deserción por comuna y año...")
    rows = read_csv("medata_desercion.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    # Aggregate by year and comuna
    by_year_comuna = defaultdict(lambda: {"desertores": 0, "matricula": 0})
    by_year = defaultdict(lambda: {"desertores": 0, "matricula": 0})
    comunas_set = set()

    for r in rows:
        year = r.get("año", "")
        comuna = r.get("comuna_establecimiento", "SIN COMUNA")
        comunas_set.add(comuna)

        # Sum all grade desertion columns
        desertores = 0
        matricula = 0
        for key, val in r.items():
            try:
                v = float(val) if val else 0
            except ValueError:
                continue
            if key.startswith("desercion_grado"):
                desertores += v
            elif key.startswith("matricula_grado"):
                matricula += v

        by_year_comuna[(year, comuna)]["desertores"] += desertores
        by_year_comuna[(year, comuna)]["matricula"] += matricula
        by_year[year]["desertores"] += desertores
        by_year[year]["matricula"] += matricula

    # Series temporal de ciudad
    city_series = []
    for year in sorted(by_year.keys()):
        d = by_year[year]
        tasa = (d["desertores"] / d["matricula"] * 100) if d["matricula"] > 0 else 0
        city_series.append({
            "anio": year,
            "desertores": round(d["desertores"]),
            "matricula": round(d["matricula"]),
            "tasaDesercion": round(tasa, 2),
        })

    # Por comuna (último año)
    latest_year = max(by_year.keys()) if by_year else ""
    comuna_data = []
    for comuna in sorted(comunas_set):
        d = by_year_comuna.get((latest_year, comuna), {"desertores": 0, "matricula": 0})
        tasa = (d["desertores"] / d["matricula"] * 100) if d["matricula"] > 0 else 0
        if d["matricula"] > 0:
            comuna_data.append({
                "comuna": comuna,
                "desertores": round(d["desertores"]),
                "matricula": round(d["matricula"]),
                "tasaDesercion": round(tasa, 2),
            })

    comuna_data.sort(key=lambda x: x["tasaDesercion"], reverse=True)

    output = PUBLIC_DATA / "desercion_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump({"serieTemporal": city_series, "porComuna": comuna_data, "ultimoAnio": latest_year}, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(city_series)} años, {len(comuna_data)} comunas)")


def process_saber11_historico():
    """Procesa Saber 11 histórico por IE."""
    print("\n📊 Saber 11 Histórico por IE...")
    rows = read_csv("medata_saber11_historico.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    # Get unique periods and city averages
    by_period = defaultdict(lambda: {"total_score": 0, "count": 0, "ies": []})

    for r in rows:
        period = r.get("año_semestre", "")
        try:
            score = float(r.get("puntaje_global", 0))
        except (ValueError, TypeError):
            continue

        if score > 0:
            by_period[period]["total_score"] += score
            by_period[period]["count"] += 1
            by_period[period]["ies"].append({
                "nombre": r.get("establecimiento", ""),
                "comuna": r.get("comuna", ""),
                "puntaje": score,
            })

    # Series temporal
    series = []
    for period in sorted(by_period.keys()):
        d = by_period[period]
        avg = d["total_score"] / d["count"] if d["count"] > 0 else 0
        top = sorted(d["ies"], key=lambda x: x["puntaje"], reverse=True)[:5]
        series.append({
            "periodo": str(period),
            "promedioCiudad": round(avg, 1),
            "totalIEs": d["count"],
            "top5": top,
        })

    output = PUBLIC_DATA / "saber11_historico_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(series)} períodos)")


def process_isce():
    """Procesa ISCE (Índice Sintético de Calidad) por IE."""
    print("\n📊 ISCE por IE...")
    rows = read_csv("medata_isce.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    ies = []
    for r in rows:
        entry = {
            "codigoDane": r.get("codigo_dane", ""),
            "nombre": r.get("establecimiento educativo", ""),
            "comuna": r.get("comuna", ""),
            "sector": r.get("prestacion_servicio", ""),
        }
        # Extract ISCE values for available years
        for year in ["2015", "2016", "2017", "2018"]:
            total_key = f"isce_total_{year}" if year >= "2018" else f"iscec_total_{year}"
            try:
                val = float(r.get(total_key, 0))
                if val > 0:
                    entry[f"isce_{year}"] = round(val, 2)
            except (ValueError, TypeError):
                pass

        if any(f"isce_{y}" in entry for y in ["2015", "2016", "2017", "2018"]):
            ies.append(entry)

    ies.sort(key=lambda x: x.get("isce_2018", x.get("isce_2017", 0)), reverse=True)

    output = PUBLIC_DATA / "isce_por_ie.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(ies, f, ensure_ascii=False)
    print(f"  ✅ {output.name} ({len(ies)} IEs)")


def process_docentes():
    """Procesa datos de docentes."""
    print("\n📊 Docentes...")
    rows = read_csv("medata_docentes.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")
    if rows:
        print(f"  Columnas: {list(rows[0].keys())}")
        output = PUBLIC_DATA / "docentes_medellin.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def run():
    print("=" * 60)
    print("TRANSFORMER — MEData CSV Datasets")
    print("=" * 60)

    process_desercion()
    process_saber11_historico()
    process_isce()
    process_docentes()

    print("\n✅ Transformación MEData CSV completa")


if __name__ == "__main__":
    run()
