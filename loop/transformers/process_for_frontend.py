"""
Procesa los datos crudos descargados y genera JSONs optimizados para el frontend.
Genera:
- public/data/kpis.json — KPIs ejecutivos del dashboard
- public/data/saber11_por_ie.json — Promedios Saber 11 por institución
- public/data/sedes_resumen.json — Resumen de sedes con matrícula
- public/data/estadisticas_historicas.json — Series temporales (Antioquia departamental)
- public/data/estadisticas_medellin.json — Series temporales Medellín ETC (sras-4t5p)
"""
import json
from datetime import date
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def process_saber11():
    """Procesa Saber 11 microdatos -> promedios por IE y KPIs."""
    print("📊 Procesando Saber 11...")

    # Load ALL saber11 batch files
    batch_files = sorted(RAW_DIR.glob("saber11_medellin*.json"))
    if not batch_files:
        print("  ⚠️ No hay datos Saber 11")
        return

    all_records = []
    for bf in batch_files:
        with open(bf, "r") as f:
            data = json.load(f)
        print(f"  Loaded {bf.name}: {len(data)} registros")
        all_records.extend(data)

    print(f"  Total registros cargados: {len(all_records)}")

    # Identify all periods and select the latest one
    all_periods = sorted(set(r.get("periodo", "") for r in all_records if r.get("periodo")))
    latest_period = all_periods[-1] if all_periods else ""
    print(f"  Periodos encontrados: {all_periods}")
    print(f"  Periodo más reciente (seleccionado): {latest_period}")

    # Filter to latest period only for KPIs and rankings
    records = [r for r in all_records if r.get("periodo") == latest_period]
    print(f"  Registros del periodo {latest_period}: {len(records)} de {len(all_records)} totales")

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


def _parse_numeric(value) -> float | None:
    """Parse a numeric value, removing commas from strings like '379,616'."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace(",", "").strip()
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


# Fields expected per year in estadisticas_medellin.json
_ESTADISTICAS_FIELDS = [
    "poblacion_5_16",
    "cobertura_neta", "cobertura_bruta",
    "cobertura_neta_transicion", "cobertura_neta_primaria",
    "cobertura_neta_secundaria", "cobertura_neta_media",
    "cobertura_bruta_transicion", "cobertura_bruta_primaria",
    "cobertura_bruta_secundaria", "cobertura_bruta_media",
    "desercion", "desercion_transicion", "desercion_primaria",
    "desercion_secundaria", "desercion_media",
    "aprobacion", "aprobacion_primaria",
    "aprobacion_secundaria", "aprobacion_media",
    "reprobacion", "repitencia",
    "tamano_promedio_grupo", "sedes_conectadas_a_internet",
]


def process_estadisticas_medellin() -> list[dict] | None:
    """Procesa estadísticas ETC Medellín (sras-4t5p) -> public/data/estadisticas_medellin.json."""
    print("\n📊 Procesando Estadísticas ETC Medellín...")
    filepath = RAW_DIR / "estadisticas_etc_medellin.json"
    if not filepath.exists():
        print("  ⚠️ No hay datos de estadísticas ETC Medellín")
        return None

    with open(filepath, "r") as f:
        records = json.load(f)

    print(f"  {len(records)} registros crudos")

    # Sort by year ascending
    records.sort(key=lambda x: str(x.get("anio", x.get("ano", ""))))

    series = []
    for r in records:
        anio = str(r.get("anio", r.get("ano", "")))
        if not anio:
            continue

        entry: dict = {"anio": anio}
        for field in _ESTADISTICAS_FIELDS:
            val = _parse_numeric(r.get(field))
            if val is not None:
                # poblacion_5_16 is an integer count, keep as int
                if field == "poblacion_5_16":
                    entry[field] = int(val)
                else:
                    entry[field] = round(val, 2)
            else:
                entry[field] = None
        series.append(entry)

    # Post-process: sanitize corrupted / missing values
    for entry in series:
        # tamano_promedio_grupo: values > 100 are corrupted at source (e.g. 31851, 33967);
        # values == 0 mean data not reported, not a real zero
        tpg = entry.get("tamano_promedio_grupo")
        if tpg is not None and (tpg > 100 or tpg == 0):
            entry["tamano_promedio_grupo"] = None
        # sedes_conectadas_a_internet: 0 means data not reported
        sci = entry.get("sedes_conectadas_a_internet")
        if sci is not None and sci == 0:
            entry["sedes_conectadas_a_internet"] = None

    output = PUBLIC_DATA / "estadisticas_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name}: {len(series)} años")

    # Verify critical fixes
    for entry in series:
        if entry["anio"] == "2021":
            print(f"  [CHECK] 2021 poblacion_5_16 = {entry['poblacion_5_16']} (should be ~379616)")
        if entry["anio"] == "2014":
            print(f"  [CHECK] 2014 cobertura_neta = {entry['cobertura_neta']} (should be ~105.73)")

    return series


def generate_kpis(saber_kpis: dict | None, sedes_resumen: dict | None, estadisticas: list | None):
    """Genera KPIs ejecutivos consolidados.

    Uses Medellín ETC data (estadisticas_medellin.json) for education KPIs
    instead of Antioquia departmental data.
    """
    print("\n📊 Generando KPIs ejecutivos...")

    # Read Medellín ETC stats for KPIs (preferred over departmental data)
    med_stats_path = PUBLIC_DATA / "estadisticas_medellin.json"
    latest_med = {}
    if med_stats_path.exists():
        with open(med_stats_path, "r") as f:
            med_series = json.load(f)
        if med_series:
            latest_med = med_series[-1]  # Most recent year
            print(f"  Usando Medellín ETC año {latest_med.get('anio')} para KPIs")
    else:
        # Fallback to departmental data
        if estadisticas:
            latest_med = estadisticas[-1]
            print(f"  Fallback: usando datos departamentales para KPIs")

    anio_fuente = latest_med.get("anio", "?")

    kpis = {
        "totalMatriculados": sedes_resumen.get("totalMatricula", 0) if sedes_resumen else 0,
        "totalSedes": sedes_resumen.get("totalSedes", 0) if sedes_resumen else 0,
        "promedioSaber11": saber_kpis.get("promedio_saber11", 0) if saber_kpis else 0,
        "totalEvaluados": saber_kpis.get("total_evaluados", 0) if saber_kpis else 0,
        "totalIEs": saber_kpis.get("total_ies_con_datos", 0) if saber_kpis else 0,
        "coberturaNeta": {
            "valor": latest_med.get("cobertura_neta", 0),
            "fuente": f"datos.gov.co/sras-4t5p (Medellín ETC {anio_fuente})",
            "tendencia": "estable",
        },
        "coberturaBruta": latest_med.get("cobertura_bruta"),
        "desercion": {
            "valor": latest_med.get("desercion", 0),
            "fuente": f"datos.gov.co/sras-4t5p (Medellín ETC {anio_fuente})",
            "tendencia": "baja",
        },
        "aprobacion": {
            "valor": latest_med.get("aprobacion", 0),
            "fuente": f"datos.gov.co/sras-4t5p (Medellín ETC {anio_fuente})",
            "tendencia": "alza",
        },
        "reprobacion": latest_med.get("reprobacion"),
        "repitencia": latest_med.get("repitencia"),
        "sedesConInternet": latest_med.get("sedes_conectadas_a_internet"),
        "zonas": sedes_resumen.get("zonas", {}) if sedes_resumen else {},
        "sectores": sedes_resumen.get("sectores", {}) if sedes_resumen else {},
        "fuentes": {
            "saber11": "datos.gov.co/kgxf-xxbe",
            "sedes": "datos.gov.co/x5ay-984n",
            "estadisticas_medellin": "datos.gov.co/sras-4t5p",
            "estadisticas_departamental": "datos.gov.co/ji8i-4anb",
            "geo": "OpenStreetMap Overpass API",
        },
        "ultimaActualizacion": str(date.today()),
    }

    # --- Data freshness metadata ---
    # Compute ultimo_anio / ultimo_periodo from actual data where possible
    frescura = {}

    # estadisticas_etc (Medellín ETC — sras-4t5p)
    etc_ultimo = anio_fuente
    if med_stats_path.exists():
        with open(med_stats_path, "r") as f:
            _ms = json.load(f)
        if _ms:
            etc_ultimo = _ms[-1].get("anio", anio_fuente)
    frescura["estadisticas_etc"] = {"fuente": "sras-4t5p", "ultimo_anio": str(etc_ultimo)}

    # saber11 — derive ultimo_periodo from raw batch files
    saber_batch_files = sorted(RAW_DIR.glob("saber11_medellin*.json"))
    saber_periods: set[str] = set()
    for bf in saber_batch_files:
        with open(bf, "r") as f:
            _sb = json.load(f)
        for r in _sb:
            p = r.get("periodo", "")
            if p:
                saber_periods.add(p)
    saber_ultimo = sorted(saber_periods)[-1] if saber_periods else "?"
    frescura["saber11"] = {"fuente": "kgxf-xxbe", "ultimo_periodo": saber_ultimo}

    # sedes — derive ultimo_anio from raw file
    sedes_path = RAW_DIR / "sedes_educativas_medellin.json"
    sedes_ultimo = "?"
    if sedes_path.exists():
        with open(sedes_path, "r") as f:
            _sd = json.load(f)
        sedes_years = sorted(set(r.get("a_o", "") for r in _sd if r.get("a_o")))
        if sedes_years:
            sedes_ultimo = sedes_years[-1]
    frescura["sedes"] = {"fuente": "x5ay-984n", "ultimo_anio": str(sedes_ultimo)}

    # matricula MEData — derive from CSV if available
    medata_csv = RAW_DIR / "medata_matricula.csv"
    medata_ultimo = "?"
    if medata_csv.exists():
        import csv
        with open(medata_csv, "r") as f:
            reader = csv.DictReader(f)
            medata_years: set[str] = set()
            for row in reader:
                y = row.get("anio", "")
                if y and y.isdigit() and int(y) > 2000:
                    medata_years.add(y)
        if medata_years:
            medata_ultimo = sorted(medata_years)[-1]
    frescura["matricula_medata"] = {"fuente": "MEData CSV", "ultimo_anio": str(medata_ultimo)}

    kpis["frescura"] = frescura

    output = PUBLIC_DATA / "kpis.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(kpis, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {output.name}")

    for key, val in kpis.items():
        if key not in ("fuentes", "zonas", "sectores", "frescura"):
            print(f"  {key}: {val}")
    print(f"  frescura: {json.dumps(kpis['frescura'], ensure_ascii=False)}")

    return kpis


def run():
    print("=" * 60)
    print("TRANSFORMER — Datos para Frontend")
    print("=" * 60)

    saber_kpis = process_saber11()
    sedes_resumen = process_sedes()
    estadisticas = process_estadisticas()
    process_estadisticas_medellin()
    generate_kpis(saber_kpis, sedes_resumen, estadisticas)

    print(f"\n✅ Transformación completa")


if __name__ == "__main__":
    run()
