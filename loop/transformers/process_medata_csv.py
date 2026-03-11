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


def process_matricula():
    """Procesa matrícula por comuna, nivel y año."""
    print("\n📊 Matrícula por comuna, nivel y año...")
    rows = read_csv("medata_matricula.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    GRADE_LEVEL = {
        "pre_jardin": "Preescolar",
        "jardin": "Preescolar",
        "transicion": "Preescolar",
        "primero": "Primaria",
        "segundo": "Primaria",
        "tercero": "Primaria",
        "cuarto": "Primaria",
        "quinto": "Primaria",
        "sexto": "Secundaria",
        "septimo": "Secundaria",
        "octavo": "Secundaria",
        "noveno": "Secundaria",
        "decimo": "Media",
        "once": "Media",
    }

    by_year = defaultdict(lambda: {"total": 0, "oficial": 0, "privado": 0})
    by_year_comuna = defaultdict(lambda: {"total": 0, "oficial": 0, "privado": 0})
    by_nivel = defaultdict(lambda: {"total": 0})

    for r in rows:
        anio = r.get("anio", "").strip()
        comuna = r.get("comuna", "").strip()
        grado = r.get("grado", "").strip().lower()
        tipo = r.get("tipo_servicio", "").strip().lower()

        try:
            total = float(r.get("total", 0)) if r.get("total", "").strip() else 0
        except (ValueError, TypeError):
            total = 0

        if not anio:
            continue

        by_year[anio]["total"] += total
        if "oficial" in tipo:
            by_year[anio]["oficial"] += total
        else:
            by_year[anio]["privado"] += total

        by_year_comuna[(anio, comuna)]["total"] += total
        if "oficial" in tipo:
            by_year_comuna[(anio, comuna)]["oficial"] += total
        else:
            by_year_comuna[(anio, comuna)]["privado"] += total

        nivel = GRADE_LEVEL.get(grado, "Otro")
        by_nivel[nivel]["total"] += total

    # Serie temporal de ciudad
    serie_temporal = []
    for anio in sorted(by_year.keys()):
        d = by_year[anio]
        serie_temporal.append({
            "anio": anio,
            "total": round(d["total"]),
            "oficial": round(d["oficial"]),
            "privado": round(d["privado"]),
        })

    # Por comuna (último año)
    ultimo_anio = max(by_year.keys()) if by_year else ""
    comunas_set = set(c for (a, c) in by_year_comuna.keys() if a == ultimo_anio)
    por_comuna = []
    for comuna in sorted(comunas_set):
        d = by_year_comuna.get((ultimo_anio, comuna), {"total": 0, "oficial": 0, "privado": 0})
        if d["total"] > 0:
            por_comuna.append({
                "comuna": comuna,
                "total": round(d["total"]),
                "oficial": round(d["oficial"]),
                "privado": round(d["privado"]),
            })
    por_comuna.sort(key=lambda x: x["total"], reverse=True)

    # Por nivel
    por_nivel = []
    for nivel in ["Preescolar", "Primaria", "Secundaria", "Media", "Otro"]:
        if nivel in by_nivel:
            por_nivel.append({
                "nivel": nivel,
                "total": round(by_nivel[nivel]["total"]),
            })

    output = PUBLIC_DATA / "matricula_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump({
            "serieTemporal": serie_temporal,
            "porComuna": por_comuna,
            "porNivel": por_nivel,
            "ultimoAnio": ultimo_anio,
        }, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(serie_temporal)} años, {len(por_comuna)} comunas, {len(por_nivel)} niveles)")


def process_aprobacion():
    """Procesa tasas de aprobación por comuna, género y nivel."""
    print("\n📊 Aprobación por comuna, género y nivel...")
    rows = read_csv("medata_aprobacion.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    # Determine aprobacion/reprobacion columns from the first row
    if not rows:
        return
    all_cols = list(rows[0].keys())
    aprob_cols = [c for c in all_cols if c.lower().startswith("aprobacion_grado")]
    reprob_cols = [c for c in all_cols if c.lower().startswith("reprobacion_grado")]

    # Grade-level mapping for column names
    def col_to_nivel(col_name: str) -> str:
        cl = col_name.lower()
        if any(g in cl for g in ["prejardin", "pre_jardin", "jardin", "transicion"]):
            return "Preescolar"
        for n in ["_1", "_2", "_3", "_4", "_5"]:
            if cl.endswith(n) or f"grado{n.replace('_', '')}" in cl:
                return "Primaria"
        for n in ["_6", "_7", "_8", "_9"]:
            if cl.endswith(n) or f"grado{n.replace('_', '')}" in cl:
                return "Secundaria"
        for n in ["_10", "_11", "_12", "_13"]:
            if cl.endswith(n) or f"grado{n.replace('_', '')}" in cl:
                return "Media"
        return "Otro"

    by_comuna = defaultdict(lambda: {"aprobados": 0, "total": 0})
    by_genero = defaultdict(lambda: {"aprobados": 0, "total": 0})
    by_nivel = defaultdict(lambda: {"aprobados": 0, "total": 0})

    for r in rows:
        comuna = r.get("comuna_Establecimiento", r.get("comuna_establecimiento", "")).strip()
        sexo = r.get("sexo", "").strip().lower()

        # Sum aprobacion columns
        total_aprob = 0
        for col in aprob_cols:
            try:
                val = float(r.get(col, 0)) if r.get(col, "").strip() else 0
            except (ValueError, TypeError):
                val = 0
            total_aprob += val

            # Per-nivel accumulation (aprobacion only)
            nivel = col_to_nivel(col)
            by_nivel[nivel]["aprobados"] += val

        # Sum reprobacion columns
        total_reprob = 0
        for col in reprob_cols:
            try:
                val = float(r.get(col, 0)) if r.get(col, "").strip() else 0
            except (ValueError, TypeError):
                val = 0
            total_reprob += val

            # Per-nivel accumulation (reprobacion → total)
            nivel = col_to_nivel(col)
            by_nivel[nivel]["total"] += val

        total_row = total_aprob + total_reprob

        # Per-nivel: add aprobados to total as well
        # (total = aprobados + reprobados, reprobados already added above)
        for nivel in by_nivel:
            pass  # handled below after loop

        by_comuna[comuna]["aprobados"] += total_aprob
        by_comuna[comuna]["total"] += total_row

        by_genero[sexo]["aprobados"] += total_aprob
        by_genero[sexo]["total"] += total_row

    # Fix by_nivel totals: total should be aprobados + reprobados
    # Currently aprobados has aprobacion sums, total has reprobacion sums
    # We need total = aprobados + reprobados
    for nivel in by_nivel:
        by_nivel[nivel]["total"] = by_nivel[nivel]["aprobados"] + by_nivel[nivel]["total"]

    # Por comuna
    por_comuna = []
    for comuna in sorted(by_comuna.keys()):
        d = by_comuna[comuna]
        if d["total"] > 0:
            tasa = d["aprobados"] / d["total"] * 100
            por_comuna.append({
                "comuna": comuna,
                "aprobados": round(d["aprobados"]),
                "total": round(d["total"]),
                "tasaAprobacion": round(tasa, 2),
            })
    por_comuna.sort(key=lambda x: x["tasaAprobacion"], reverse=True)

    # Por género
    por_genero = []
    for genero in sorted(by_genero.keys()):
        d = by_genero[genero]
        if d["total"] > 0:
            tasa = d["aprobados"] / d["total"] * 100
            por_genero.append({
                "genero": genero,
                "aprobados": round(d["aprobados"]),
                "total": round(d["total"]),
                "tasaAprobacion": round(tasa, 2),
            })

    # Por nivel
    por_nivel = []
    for nivel in ["Preescolar", "Primaria", "Secundaria", "Media", "Otro"]:
        if nivel in by_nivel and by_nivel[nivel]["total"] > 0:
            d = by_nivel[nivel]
            tasa = d["aprobados"] / d["total"] * 100
            por_nivel.append({
                "nivel": nivel,
                "aprobados": round(d["aprobados"]),
                "total": round(d["total"]),
                "tasaAprobacion": round(tasa, 2),
            })

    output = PUBLIC_DATA / "aprobacion_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump({
            "porComuna": por_comuna,
            "porGenero": por_genero,
            "porNivel": por_nivel,
        }, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(por_comuna)} comunas, {len(por_genero)} géneros, {len(por_nivel)} niveles)")


def run():
    print("=" * 60)
    print("TRANSFORMER — MEData CSV Datasets")
    print("=" * 60)

    process_desercion()
    process_saber11_historico()
    process_isce()
    process_docentes()
    process_matricula()
    process_aprobacion()

    print("\n✅ Transformación MEData CSV completa")


if __name__ == "__main__":
    run()
