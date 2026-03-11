"""
Procesa los datos crudos descargados y genera JSONs optimizados para el frontend.
Genera:
- public/data/kpis.json — KPIs ejecutivos del dashboard
- public/data/saber11_por_ie.json — Promedios Saber 11 por institución
- public/data/sedes_resumen.json — Resumen de sedes con matrícula
- public/data/estadisticas_historicas.json — Series temporales
"""
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def process_saber11():
    """Procesa Saber 11 microdatos -> promedios por IE y KPIs."""
    print("📊 Procesando Saber 11...")
    filepath = RAW_DIR / "saber11_medellin.json"
    if not filepath.exists():
        print("  ⚠️ No hay datos Saber 11")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    print(f"  {len(records)} registros cargados")

    # Aggregate by institution
    ie_data = defaultdict(lambda: {
        "puntajes": [],
        "matematicas": [],
        "lectura": [],
        "ciencias": [],
        "sociales": [],
        "ingles": [],
        "estratos": [],
        "periodos": set(),
        "nombre": "",
        "codigo_dane": "",
        "jornada": "",
        "naturaleza": "",
        "area": "",
    })

    for r in records:
        ie_code = r.get("cole_cod_dane_establecimiento", "")
        if not ie_code:
            continue

        ie = ie_data[ie_code]
        ie["nombre"] = r.get("cole_nombre_establecimiento", "")
        ie["codigo_dane"] = ie_code
        ie["jornada"] = r.get("cole_jornada", "")
        ie["naturaleza"] = r.get("cole_naturaleza", "")
        ie["area"] = r.get("cole_area_ubicacion", "")
        ie["periodos"].add(r.get("periodo", ""))

        # Parse scores
        for field, key in [
            ("punt_global", "puntajes"),
            ("punt_matematicas", "matematicas"),
            ("punt_lectura_critica", "lectura"),
            ("punt_c_naturales", "ciencias"),
            ("punt_sociales_ciudadanas", "sociales"),
            ("punt_ingles", "ingles"),
        ]:
            try:
                val = float(r.get(field, 0))
                if val > 0:
                    ie[key].append(val)
            except (ValueError, TypeError):
                pass

        estrato = r.get("fami_estratovivienda", "")
        if estrato:
            ie["estratos"].append(estrato)

    # Calculate averages per IE
    ie_summary = []
    total_global = []
    total_mat = []
    total_lec = []

    for code, ie in ie_data.items():
        if not ie["puntajes"]:
            continue

        avg_global = sum(ie["puntajes"]) / len(ie["puntajes"])
        total_global.extend(ie["puntajes"])

        entry = {
            "codigoDane": code,
            "nombre": ie["nombre"],
            "naturaleza": ie["naturaleza"],
            "area": ie["area"],
            "jornada": ie["jornada"],
            "numEvaluados": len(ie["puntajes"]),
            "promedioGlobal": round(avg_global, 1),
        }

        for field, key in [
            ("matematicas", "promedioMatematicas"),
            ("lectura", "promedioLectura"),
            ("ciencias", "promedioCiencias"),
            ("sociales", "promedioSociales"),
            ("ingles", "promedioIngles"),
        ]:
            vals = ie[field]
            if vals:
                entry[key] = round(sum(vals) / len(vals), 1)
                if field == "matematicas":
                    total_mat.extend(vals)
                if field == "lectura":
                    total_lec.extend(vals)

        ie_summary.append(entry)

    # Sort by global score descending
    ie_summary.sort(key=lambda x: x.get("promedioGlobal", 0), reverse=True)

    # Save IE summary
    output = PUBLIC_DATA / "saber11_por_ie.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(ie_summary, f, ensure_ascii=False)
    print(f"  ✅ {output.name}: {len(ie_summary)} IEs con promedios")

    # Calculate city-level KPIs
    city_avg = round(sum(total_global) / len(total_global), 1) if total_global else 0
    city_mat = round(sum(total_mat) / len(total_mat), 1) if total_mat else 0
    city_lec = round(sum(total_lec) / len(total_lec), 1) if total_lec else 0

    print(f"  Promedio global ciudad: {city_avg}")
    print(f"  Promedio matemáticas:   {city_mat}")
    print(f"  Promedio lectura:       {city_lec}")
    print(f"  Total estudiantes eval: {len(total_global)}")

    return {
        "promedio_saber11": city_avg,
        "promedio_matematicas": city_mat,
        "promedio_lectura": city_lec,
        "total_evaluados": len(total_global),
        "total_ies_con_datos": len(ie_summary),
    }


def process_sedes():
    """Procesa sedes educativas -> resumen de matrícula."""
    print("\n📊 Procesando Sedes Educativas...")
    filepath = RAW_DIR / "sedes_educativas_medellin.json"
    if not filepath.exists():
        print("  ⚠️ No hay datos de sedes")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    total_matricula = 0
    total_sedes = len(records)
    zonas = defaultdict(int)
    sectores = defaultdict(int)
    years = set()

    for r in records:
        try:
            mat = int(r.get("total_matricula", 0))
            total_matricula += mat
        except (ValueError, TypeError):
            pass

        zona = r.get("zona", "DESCONOCIDA")
        zonas[zona] += 1
        sector = r.get("cte_id_sector", "DESCONOCIDO")
        sectores[sector] += 1
        years.add(r.get("a_o", ""))

    # Resumen para frontend
    resumen = {
        "totalSedes": total_sedes,
        "totalMatricula": total_matricula,
        "zonas": dict(zonas),
        "sectores": dict(sectores),
        "anios": sorted(years),
    }

    output = PUBLIC_DATA / "sedes_resumen.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(resumen, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name}")
    print(f"  Total sedes: {total_sedes}")
    print(f"  Total matrícula: {total_matricula:,}")
    print(f"  Zonas: {dict(zonas)}")
    print(f"  Sectores: {dict(sectores)}")

    return resumen


def process_estadisticas():
    """Procesa estadísticas MEN -> series temporales."""
    print("\n📊 Procesando Estadísticas MEN...")
    filepath = RAW_DIR / "estadisticas_men_antioquia.json"
    if not filepath.exists():
        print("  ⚠️ No hay datos de estadísticas")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    # Sort by year
    records.sort(key=lambda x: x.get("ano", ""))

    series = []
    for r in records:
        entry = {"anio": r.get("ano", "")}
        for field in [
            "cobertura_neta", "cobertura_bruta",
            "desercion", "desercion_primaria", "desercion_secundaria", "desercion_media",
            "aprobacion", "reprobacion", "repitencia",
            "cobertura_neta_primaria", "cobertura_neta_secundaria", "cobertura_neta_media",
            "tamano_promedio_grupo", "sedes_conectadas_a_internet",
        ]:
            try:
                entry[field] = round(float(r.get(field, 0)), 2)
            except (ValueError, TypeError):
                entry[field] = None
        series.append(entry)

    output = PUBLIC_DATA / "estadisticas_historicas.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name}: {len(series)} años")

    return series


def generate_kpis(saber_kpis: dict | None, sedes_resumen: dict | None, estadisticas: list | None):
    """Genera KPIs ejecutivos consolidados."""
    print("\n📊 Generando KPIs ejecutivos...")

    latest_stats = {}
    if estadisticas:
        latest_stats = estadisticas[-1]  # Most recent year

    kpis = {
        "totalMatriculados": sedes_resumen.get("totalMatricula", 0) if sedes_resumen else 0,
        "totalSedes": sedes_resumen.get("totalSedes", 0) if sedes_resumen else 0,
        "promedioSaber11": saber_kpis.get("promedio_saber11", 0) if saber_kpis else 0,
        "totalEvaluados": saber_kpis.get("total_evaluados", 0) if saber_kpis else 0,
        "totalIEs": saber_kpis.get("total_ies_con_datos", 0) if saber_kpis else 0,
        "coberturaNeta": latest_stats.get("cobertura_neta"),
        "coberturaBruta": latest_stats.get("cobertura_bruta"),
        "tasaDesercion": latest_stats.get("desercion"),
        "tasaAprobacion": latest_stats.get("aprobacion"),
        "sedesConInternet": latest_stats.get("sedes_conectadas_a_internet"),
        "zonas": sedes_resumen.get("zonas", {}) if sedes_resumen else {},
        "sectores": sedes_resumen.get("sectores", {}) if sedes_resumen else {},
        "fuentes": {
            "saber11": "datos.gov.co/kgxf-xxbe",
            "sedes": "datos.gov.co/x5ay-984n",
            "estadisticas": "datos.gov.co/ji8i-4anb",
            "geo": "OpenStreetMap Overpass API",
        },
        "ultimaActualizacion": "2026-03-10",
    }

    output = PUBLIC_DATA / "kpis.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(kpis, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name}")

    for key, val in kpis.items():
        if key not in ("fuentes", "zonas", "sectores"):
            print(f"  {key}: {val}")

    return kpis


def run():
    print("=" * 60)
    print("TRANSFORMER — Datos para Frontend")
    print("=" * 60)

    saber_kpis = process_saber11()
    sedes_resumen = process_sedes()
    estadisticas = process_estadisticas()
    generate_kpis(saber_kpis, sedes_resumen, estadisticas)

    print(f"\n✅ Transformación completa")


if __name__ == "__main__":
    run()
