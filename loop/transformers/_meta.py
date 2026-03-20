"""
Generates public/data/data_manifest.json — a freshness manifest for all output data files.
Documents source, date range, and staleness for each JSON in public/data/.
"""
import json
from datetime import datetime
from pathlib import Path

PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"

# Current year for staleness checks
CURRENT_YEAR = datetime.now().year


def _extract_years(data) -> list[str]:
    """Extract year-like strings from a data structure."""
    years = set()
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                for key in ("anio", "ano", "año", "anio_inf", "anno_inf"):
                    val = item.get(key)
                    if val and str(val).isdigit() and 2000 <= int(val) <= 2030:
                        years.add(str(val))
                # Also check periodo format (e.g., "20224" → 2022)
                periodo = item.get("periodo", "")
                if isinstance(periodo, str) and len(periodo) >= 4 and periodo[:4].isdigit():
                    years.add(periodo[:4])
    elif isinstance(data, dict):
        for key in ("anio", "ano", "año", "anio_inf", "anno_inf"):
            val = data.get(key)
            if val and str(val).isdigit() and 2000 <= int(val) <= 2030:
                years.add(str(val))
        # Recurse into known array fields
        for field in ("serieTemporal", "porComuna", "porGenero", "porNivel",
                      "matricula_por_nivel", "ipg_cobertura_bruta"):
            if field in data and isinstance(data[field], list):
                years.update(_extract_years(data[field]))
    return sorted(years)


def _extract_periodos(data) -> list[str]:
    """Extract periodo strings from Saber 11 data."""
    periodos = set()
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                p = item.get("periodo", "")
                if isinstance(p, str) and len(p) >= 5:
                    periodos.add(p)
    return sorted(periodos)


# File metadata registry — maps filename to known source info
FILE_META = {
    "estadisticas_medellin.json": {
        "fuente": "datos.gov.co/sras-4t5p",
        "descripcion": "Estadísticas ETC Medellín (cobertura, deserción, aprobación)",
    },
    "estadisticas_historicas.json": {
        "fuente": "datos.gov.co/ji8i-4anb",
        "descripcion": "Estadísticas departamentales Antioquia",
    },
    "kpis.json": {
        "fuente": "Múltiples (sras-4t5p, kgxf-xxbe, x5ay-984n, MEData)",
        "descripcion": "KPIs ejecutivos del dashboard",
    },
    "saber11_por_ie.json": {
        "fuente": "datos.gov.co/kgxf-xxbe",
        "descripcion": "Promedios Saber 11 por institución educativa",
    },
    "saber11_historico_medellin.json": {
        "fuente": "MEData CSV + datos.gov.co/kgxf-xxbe",
        "descripcion": "Serie histórica Saber 11 por período",
    },
    "saber11_serie_temporal.json": {
        "fuente": "datos.gov.co/kgxf-xxbe",
        "descripcion": "Serie temporal Saber 11 con brecha de género",
    },
    "desercion_medellin.json": {
        "fuente": "datos.gov.co/sras-4t5p + MEData CSV",
        "descripcion": "Deserción: serie ciudad (MEN) + por comuna (MEData)",
        "nota": "Serie ciudad desde sras-4t5p; comunas solo MEData CSV ~2017",
    },
    "aprobacion_medellin.json": {
        "fuente": "MEData CSV",
        "descripcion": "Aprobación por comuna, género, nivel",
        "nota": "Datos MEData ~2017, no se actualizan",
    },
    "matricula_medellin.json": {
        "fuente": "MEData CSV + estimaciones sras-4t5p",
        "descripcion": "Matrícula por sector, nivel, comuna",
        "nota": "2004-2019 MEData real; 2020-2024 estimado desde cobertura x población",
    },
    "cruces_multivariable.json": {
        "fuente": "datos.gov.co/kgxf-xxbe (microdatos Saber 11)",
        "descripcion": "14 cruces socioeconómicos + 3 cruces 2D",
    },
    "mapa_enriquecido.json": {
        "fuente": "Múltiples (deserción, aprobación, matrícula, Saber 11, ISCE)",
        "descripcion": "Datos enriquecidos por comuna e IE para el mapa",
    },
    "isce_por_ie.json": {
        "fuente": "MEData CSV",
        "descripcion": "ISCE por IE (2015-2018, descontinuado)",
        "nota": "El MEN dejó de publicar ISCE después de 2018",
        "descontinuado": True,
    },
    "clasificacion_saber11.json": {
        "fuente": "MEData CSV",
        "descripcion": "Clasificación Saber 11 por IE (A+, A, B, C, D)",
    },
    "bachilleres_medellin.json": {
        "fuente": "datos.gov.co",
        "descripcion": "Bachilleres graduados grado 11 y 26",
    },
    "educacion_superior_medellin.json": {
        "fuente": "datos.gov.co/MEN",
        "descripcion": "Matrícula educación superior por nivel de formación",
    },
    "paridad_genero_medellin.json": {
        "fuente": "datos.gov.co/MEN",
        "descripcion": "Índice de paridad de género y matrícula por género×nivel",
        "nota": "Snapshot de un solo año",
    },
    "docentes_perfil_medellin.json": {
        "fuente": "datos.gov.co/MEN",
        "descripcion": "Perfil planta docente oficial por dimensión",
    },
    "poblaciones_especiales.json": {
        "fuente": "datos.gov.co",
        "descripcion": "Extranjeros, etnias, víctimas, NEE en educación formal",
    },
    "sedes_resumen.json": {
        "fuente": "datos.gov.co/x5ay-984n",
        "descripcion": "Resumen de sedes educativas (total, zonas, sectores)",
    },
}


def build_manifest():
    """Generate data_manifest.json from all output files in public/data/."""
    print("=" * 60)
    print("GENERATING DATA MANIFEST")
    print("=" * 60)

    archivos = {}

    for json_file in sorted(PUBLIC_DATA.glob("*.json")):
        if json_file.name == "data_manifest.json":
            continue

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            continue

        meta = FILE_META.get(json_file.name, {})
        years = _extract_years(data)
        periodos = _extract_periodos(data)

        entry = {
            "fuente": meta.get("fuente", "desconocida"),
            "descripcion": meta.get("descripcion", ""),
        }

        if years:
            entry["rango"] = f"{years[0]}-{years[-1]}"
            entry["ultimo_dato"] = years[-1]
            last_year = int(years[-1])
            entry["obsoleto"] = (CURRENT_YEAR - last_year) > 2
            entry["antiguedad_anios"] = CURRENT_YEAR - last_year
        elif periodos:
            entry["rango_periodos"] = f"{periodos[0]}-{periodos[-1]}"
            entry["ultimo_periodo"] = periodos[-1]
            last_year = int(periodos[-1][:4]) if periodos[-1][:4].isdigit() else 0
            entry["obsoleto"] = (CURRENT_YEAR - last_year) > 2 if last_year else False
            entry["antiguedad_anios"] = CURRENT_YEAR - last_year if last_year else None

        if meta.get("nota"):
            entry["nota"] = meta["nota"]
        if meta.get("descontinuado"):
            entry["descontinuado"] = True

        # Special handling for files with mixed freshness
        if json_file.name == "desercion_medellin.json" and isinstance(data, dict):
            serie = data.get("serieTemporal", [])
            comuna = data.get("porComuna", [])
            serie_years = _extract_years(serie)
            entry["ultimo_dato_ciudad"] = serie_years[-1] if serie_years else "?"
            entry["ultimo_dato_comunas"] = data.get("ultimoAnio", "?")
            if serie_years:
                entry["ultimo_dato"] = serie_years[-1]

        if json_file.name == "matricula_medellin.json" and isinstance(data, dict):
            serie = data.get("serieTemporal", [])
            real_years = [s["anio"] for s in serie if not s.get("estimado")]
            est_years = [s["anio"] for s in serie if s.get("estimado")]
            if real_years:
                entry["ultimo_dato_real"] = real_years[-1]
            if est_years:
                entry["ultimo_dato_estimado"] = est_years[-1]

        size_kb = json_file.stat().st_size / 1024
        entry["tamano_kb"] = round(size_kb, 1)

        archivos[json_file.name] = entry

    manifest = {
        "generado": datetime.now().isoformat(timespec="seconds"),
        "total_archivos": len(archivos),
        "archivos": archivos,
    }

    output = PUBLIC_DATA / "data_manifest.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {output.name} ({len(archivos)} archivos documentados)")

    # Summary
    obsoletos = [k for k, v in archivos.items() if v.get("obsoleto")]
    if obsoletos:
        print(f"  ⚠️  {len(obsoletos)} archivos con datos >2 años: {', '.join(obsoletos)}")


if __name__ == "__main__":
    build_manifest()
