"""
Procesa CSVs de poblaciones especiales y resultados Saber 3/5/9.
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


def safe_int(val: str) -> int:
    """Convert string to int, returning 0 for empty/invalid values."""
    if not val or not val.strip():
        return 0
    try:
        return int(float(val.strip()))
    except (ValueError, TypeError):
        return 0


def safe_float(val: str) -> float:
    """Convert string to float, returning 0.0 for empty/invalid values."""
    if not val or not val.strip():
        return 0.0
    try:
        return float(val.strip())
    except (ValueError, TypeError):
        return 0.0


def _process_single_poblacion(filename: str, category_col: str, item_key: str, list_key: str) -> dict:
    """
    Generic processor for a single special-population CSV.

    All four CSVs share the same structure except for a single
    category column (pais, etnia, tipo_victima, tipo_nee).

    Args:
        category_col: the CSV column name (e.g. "pais", "etnia")
        item_key: the key name inside each list item (e.g. "pais", "etnia", "tipo")
        list_key: the key name for the list in the result (e.g. "porPais", "porEtnia")

    Returns a dict with:
      - totalUltimoAnio
      - serieTemporal  [{anio, total}, ...]
      - <list_key>     [{<item_key>: ..., total: ...}, ...] (top entries)
      - porComuna      [{comuna, total}, ...]
    """
    rows = read_csv(filename)
    if not rows:
        return {}

    print(f"  {len(rows)} registros en {filename}")

    by_year = defaultdict(int)
    by_category = defaultdict(int)
    by_year_comuna = defaultdict(int)

    for r in rows:
        anio = r.get("anio", "").strip()
        comuna = r.get("comuna", "").strip()
        cat_value = r.get(category_col, "").strip()
        total = safe_int(r.get("total", ""))

        if not anio:
            continue

        by_year[anio] += total

        if cat_value:
            by_category[cat_value] += total

        if comuna:
            by_year_comuna[(anio, comuna)] += total

    # Serie temporal
    serie_temporal = []
    for anio in sorted(by_year.keys()):
        serie_temporal.append({"anio": anio, "total": by_year[anio]})

    # Ultimo anio
    ultimo_anio = max(by_year.keys()) if by_year else ""
    total_ultimo = by_year.get(ultimo_anio, 0)

    # Top categories (sorted descending)
    por_category = []
    for cat, tot in sorted(by_category.items(), key=lambda x: x[1], reverse=True):
        por_category.append({item_key: cat, "total": tot})

    # Por comuna (latest year only)
    por_comuna = []
    comunas_latest = {c for (a, c) in by_year_comuna.keys() if a == ultimo_anio}
    for comuna in sorted(comunas_latest):
        tot = by_year_comuna.get((ultimo_anio, comuna), 0)
        if tot > 0:
            por_comuna.append({"comuna": comuna, "total": tot})
    por_comuna.sort(key=lambda x: x["total"], reverse=True)

    result = {
        "totalUltimoAnio": total_ultimo,
        "serieTemporal": serie_temporal,
        list_key: por_category,
        "porComuna": por_comuna,
    }
    return result


def process_poblaciones_especiales():
    """Procesa los 4 CSVs de poblaciones especiales y genera un JSON consolidado."""
    print("📊 Poblaciones especiales...")

    output_data = {}

    # Extranjeros
    data = _process_single_poblacion("medata_extranjeros.csv", "pais", "pais", "porPais")
    if data:
        output_data["extranjeros"] = data

    # Etnias
    data = _process_single_poblacion("medata_etnias.csv", "etnia", "etnia", "porEtnia")
    if data:
        output_data["etnias"] = data

    # Victimas
    data = _process_single_poblacion("medata_victimas.csv", "tipo_victima", "tipo", "porTipo")
    if data:
        output_data["victimas"] = data

    # NEE (Necesidades Educativas Especiales)
    data = _process_single_poblacion("medata_nee.csv", "tipo_nee", "tipo", "porTipo")
    if data:
        output_data["nee"] = data

    output = PUBLIC_DATA / "poblaciones_especiales.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(output_data)} categorias)")


def process_saber_3_5_9():
    """Procesa resultados Saber 3, 5 y 9 y genera JSON agregado."""
    print("\n📊 Saber 3/5/9...")
    rows = read_csv("medata_saber_3_5_9.csv")
    if not rows:
        return

    print(f"  {len(rows)} registros")

    # --- Aggregation by grado + area ---
    by_grado_area = defaultdict(lambda: {
        "sum_promedio": 0.0,
        "sum_nivel_avanzado": 0.0,
        "sum_nivel_satisfactorio": 0.0,
        "sum_nivel_minimo": 0.0,
        "sum_nivel_superior": 0.0,
        "count": 0,
    })

    # --- Aggregation by comuna ---
    by_comuna = defaultdict(lambda: {"sum_promedio": 0.0, "count": 0})

    # --- Track IEs by grado for top/bottom ---
    ies_by_grado = defaultdict(list)

    all_years = set()

    for r in rows:
        anio = r.get("año", r.get("ano", "")).strip()
        grado = r.get("grado", "").strip()
        area = r.get("area", "").strip()
        comuna = r.get("comuna", "").strip()
        ie_nombre = r.get("establecimiento_educativo", "").strip()

        promedio = safe_float(r.get("promedio", ""))
        promedio_ie = safe_float(r.get("promedio_establecimiento", ""))
        nivel_avanzado = safe_float(r.get("nivel_avanzado", ""))
        nivel_satisfactorio = safe_float(r.get("nivel_satisfactorio", ""))
        nivel_minimo = safe_float(r.get("nivel_minimo", ""))
        nivel_superior = safe_float(r.get("nivel_superior", ""))

        if anio:
            all_years.add(anio)

        # By grado + area
        key_ga = (grado, area)
        agg = by_grado_area[key_ga]
        agg["sum_promedio"] += promedio
        agg["sum_nivel_avanzado"] += nivel_avanzado
        agg["sum_nivel_satisfactorio"] += nivel_satisfactorio
        agg["sum_nivel_minimo"] += nivel_minimo
        agg["sum_nivel_superior"] += nivel_superior
        agg["count"] += 1

        # By comuna
        if comuna:
            by_comuna[comuna]["sum_promedio"] += promedio
            by_comuna[comuna]["count"] += 1

        # IEs for ranking
        if ie_nombre and promedio_ie > 0:
            ies_by_grado[grado].append({
                "nombre": ie_nombre,
                "comuna": comuna,
                "promedioEstablecimiento": promedio_ie,
            })

    # Build porGradoArea
    por_grado_area = []
    for (grado, area) in sorted(by_grado_area.keys()):
        agg = by_grado_area[(grado, area)]
        cnt = agg["count"]
        if cnt == 0:
            continue
        por_grado_area.append({
            "grado": grado,
            "area": area,
            "promedioCiudad": round(agg["sum_promedio"] / cnt, 1),
            "nivelAvanzado": round(agg["sum_nivel_avanzado"] / cnt, 1),
            "nivelSatisfactorio": round(agg["sum_nivel_satisfactorio"] / cnt, 1),
            "nivelMinimo": round(agg["sum_nivel_minimo"] / cnt, 1),
            "nivelSuperior": round(agg["sum_nivel_superior"] / cnt, 1),
            "registros": cnt,
        })

    # Build porComuna
    por_comuna = []
    for comuna in sorted(by_comuna.keys()):
        d = by_comuna[comuna]
        if d["count"] == 0:
            continue
        por_comuna.append({
            "comuna": comuna,
            "promedio": round(d["sum_promedio"] / d["count"], 1),
            "count": d["count"],
        })
    por_comuna.sort(key=lambda x: x["promedio"], reverse=True)

    # Build top/bottom IEs per grado
    ranking_por_grado = {}
    for grado in sorted(ies_by_grado.keys()):
        # Deduplicate IEs: keep highest score per IE name
        best_by_ie = {}
        for ie in ies_by_grado[grado]:
            name = ie["nombre"]
            if name not in best_by_ie or ie["promedioEstablecimiento"] > best_by_ie[name]["promedioEstablecimiento"]:
                best_by_ie[name] = ie
        sorted_ies = sorted(best_by_ie.values(), key=lambda x: x["promedioEstablecimiento"], reverse=True)
        ranking_por_grado[grado] = {
            "top5": sorted_ies[:5],
            "bottom5": sorted_ies[-5:] if len(sorted_ies) >= 5 else sorted_ies,
        }

    ultimo_anio = max(all_years) if all_years else ""

    output_data = {
        "porGradoArea": por_grado_area,
        "porComuna": por_comuna,
        "rankingPorGrado": ranking_por_grado,
        "ultimoAnio": ultimo_anio,
    }

    output = PUBLIC_DATA / "saber_3_5_9.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name} ({len(por_grado_area)} grado-area, {len(por_comuna)} comunas)")


def run():
    print("=" * 60)
    print("TRANSFORMER — Poblaciones Especiales y Saber 3/5/9")
    print("=" * 60)

    process_poblaciones_especiales()
    process_saber_3_5_9()

    print("\n✅ Transformacion poblaciones y Saber completa")


if __name__ == "__main__":
    run()
