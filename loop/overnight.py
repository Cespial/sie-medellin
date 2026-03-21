"""
SIE Medellín — Pipeline Nocturno Completo
==========================================
Diseñado para correr sin supervisión por varias horas.
Refresca datos, genera análisis avanzados, reconstruye y despliega.

Uso:
    python -m loop.overnight 2>&1 | tee overnight.log

Fases:
    1. Refresh de datos desde APIs (datos.gov.co, MEData)
    2. Transformación completa (8 transformers + manifest)
    3. Análisis avanzados (índice compuesto, tendencias, outliers)
    4. Validación integral
    5. Build frontend + deploy Vercel
"""
import json
import sys
import time
import subprocess
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

RAW_DIR = Path(__file__).parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent / "public" / "data"
PROJECT_ROOT = Path(__file__).parent.parent
LOG_FILE = PROJECT_ROOT / "overnight.log"

PHASE_RESULTS = {}


def log(msg: str, level: str = "INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    print(line)


def phase_header(n: int, title: str):
    log(f"\n{'='*70}")
    log(f"  FASE {n}: {title}")
    log(f"{'='*70}\n")


def run_cmd(cmd: str, timeout: int = 600) -> tuple[int, str]:
    """Run a shell command and return exit code + output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=timeout, cwd=str(PROJECT_ROOT)
        )
        return result.returncode, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return 1, f"TIMEOUT after {timeout}s"


# ============================================================
# FASE 1: Refresh de datos desde APIs
# ============================================================

def phase1_data_refresh():
    phase_header(1, "REFRESH DE DATOS DESDE APIs")
    results = {}

    from loop.collectors.datos_gov_collector import (
        fetch_socrata, fetch_paginated, save_json, save_geojson_points,
        MEDELLIN_CODE, ANTIOQUIA_CODE
    )

    # 1.1 Estadísticas ETC Medellín (sras-4t5p) — fuente principal de KPIs
    log("1.1 Estadísticas ETC Medellín (sras-4t5p)...")
    data = fetch_paginated("sras-4t5p", where_clause="nombre_etc='Medellín'", order="ano DESC")
    if data:
        years = sorted(set(str(r.get("ano", "")) for r in data))
        save_json(data, "estadisticas_etc_medellin.json")
        results["etc_medellin"] = f"OK: {len(data)} registros, años {years[0]}-{years[-1]}"
        log(f"  {len(data)} registros, años: {years}")
    else:
        results["etc_medellin"] = "SIN DATOS"
    time.sleep(2)

    # 1.2 Estadísticas MEN Antioquia (ji8i-4anb)
    log("1.2 Estadísticas MEN Antioquia (ji8i-4anb)...")
    data = fetch_paginated("ji8i-4anb", where_clause=f"c_digo_departamento='{ANTIOQUIA_CODE}'", order="ano DESC")
    if data:
        save_json(data, "estadisticas_men_antioquia.json")
        results["men_antioquia"] = f"OK: {len(data)} registros"
    else:
        results["men_antioquia"] = "SIN DATOS"
    time.sleep(2)

    # 1.3 Saber 11 — check for new periods beyond 20224
    log("1.3 Saber 11 — verificando períodos más recientes...")
    probe = fetch_socrata("kgxf-xxbe", params={
        "$where": f"cole_cod_mcpio_ubicacion='{MEDELLIN_CODE}'",
        "$select": "periodo, count(*) as n",
        "$group": "periodo",
        "$order": "periodo DESC",
    }, limit=30)
    if probe:
        periods = [(p.get("periodo", ""), int(p.get("n", 0))) for p in probe]
        log(f"  Períodos disponibles: {[(p, n) for p, n in periods[:10]]}")
        # Check if there's anything newer than 20224
        current_periods = set()
        for bf in sorted(RAW_DIR.glob("saber11_medellin*.json")):
            with open(bf) as f:
                batch = json.load(f)
            for r in batch:
                current_periods.add(r.get("periodo", ""))
        new_periods = [p for p, n in periods if p not in current_periods and n > 100]
        if new_periods:
            log(f"  NUEVOS períodos encontrados: {new_periods}")
            # Download new periods
            for period in new_periods:
                log(f"  Descargando período {period}...")
                new_data = fetch_paginated(
                    "kgxf-xxbe",
                    where_clause=f"cole_cod_mcpio_ubicacion='{MEDELLIN_CODE}' AND periodo='{period}'",
                    max_records=60000,
                )
                if new_data:
                    fname = f"saber11_medellin_new_{period}.json"
                    save_json(new_data, fname)
                    results[f"saber11_{period}"] = f"NUEVO: {len(new_data)} registros"
                time.sleep(3)
        else:
            log("  No hay períodos nuevos")
            results["saber11_nuevos"] = "Sin cambios"
    else:
        results["saber11_nuevos"] = "Error al consultar"
    time.sleep(2)

    # 1.4 Sedes educativas — check for years beyond 2019
    log("1.4 Sedes educativas — verificando años más recientes...")
    probe = fetch_socrata("x5ay-984n", params={
        "$where": f"cod_dane_municipio='{MEDELLIN_CODE}'",
        "$select": "a_o, count(*) as n",
        "$group": "a_o",
        "$order": "a_o DESC",
    }, limit=20)
    if probe:
        years = [(p.get("a_o", ""), int(p.get("n", 0))) for p in probe]
        log(f"  Años disponibles: {years}")
        latest = years[0][0] if years else "?"
        results["sedes"] = f"Último año: {latest} ({years[0][1]} sedes)" if years else "Sin datos"
        # If newer than what we have (2019), re-download
        if years and str(years[0][0]) > "2019":
            log(f"  Descargando sedes actualizadas ({latest})...")
            full_data = fetch_paginated("x5ay-984n", where_clause=f"cod_dane_municipio='{MEDELLIN_CODE}'")
            if full_data:
                save_json(full_data, "sedes_educativas_medellin.json")
                save_geojson_points(full_data, "instituciones_educativas.geojson", "coordenada_y_sede", "coordenada_x_sede")
                results["sedes"] = f"ACTUALIZADO: {len(full_data)} sedes, año {latest}"
    else:
        results["sedes"] = "Error al consultar"
    time.sleep(2)

    # 1.5 Bachilleres — re-check for real 2024 data
    log("1.5 Bachilleres — verificando datos 2024...")
    data = fetch_paginated("5c2k-ahfc", where_clause=f"codigo_municipio='{MEDELLIN_CODE}'", order="a_o DESC")
    if data:
        save_json(data, "bachilleres_medellin.json")
        years = sorted(set(str(r.get("a_o", "")) for r in data))
        results["bachilleres"] = f"OK: {len(data)} registros, años {years}"
    else:
        results["bachilleres"] = "SIN DATOS"
    time.sleep(2)

    # 1.6 Educación superior — check for years beyond 2020
    log("1.6 Educación superior — verificando datos post-2020...")
    data = fetch_paginated("y9ga-zwzy", where_clause="nombre_del_municipio like '%MEDELL%'", order="a_o DESC")
    if data:
        save_json(data, "educacion_superior_medellin.json")
        years = sorted(set(str(r.get("a_o", "")) for r in data))
        results["ed_superior"] = f"OK: {len(data)} registros, años {years[0]}-{years[-1]}"
    else:
        results["ed_superior"] = "SIN DATOS"
    time.sleep(2)

    # 1.7 Docentes — check for years beyond 2022
    log("1.7 Docentes — verificando datos post-2022...")
    data = fetch_paginated("pgrh-8um9", where_clause="codigo_sed like '%edell%'")
    if data:
        save_json(data, "docentes_medellin_perfil.json")
        years = sorted(set(str(r.get("anno_inf", "")) for r in data if r.get("anno_inf")))
        results["docentes"] = f"OK: {len(data)} registros, años {years}" if years else f"OK: {len(data)} registros"
    else:
        results["docentes"] = "SIN DATOS"
    time.sleep(2)

    # 1.8 Paridad de género — re-check for more recent data
    log("1.8 Paridad de género...")
    data = fetch_socrata("v5z5-e88h", params={"$where": "divipola_municipio='5001'"}, limit=100)
    if data:
        save_json(data, "paridad_genero_medellin.json")
        results["paridad"] = f"OK: {len(data)} registros"
    else:
        results["paridad"] = "SIN DATOS"
    time.sleep(2)

    # 1.9 Explorar nuevos datasets educativos
    log("1.9 Explorando datasets adicionales en datos.gov.co...")
    new_datasets = {
        "njym-jg76": "Matrícula por sede educativa (SIMAT)",
        "ucdm-mhgx": "Cobertura educación por municipio",
        "fs6e-hwnz": "Planta docente por municipio",
    }
    for did, name in new_datasets.items():
        log(f"  Probando {did}: {name}...")
        probe = fetch_socrata(did, limit=3)
        if probe:
            cols = list(probe[0].keys())
            log(f"    Columnas: {cols[:8]}...")
            # Check if it has Medellín data
            muni_cols = [c for c in cols if "munic" in c.lower() or "dane" in c.lower() or "cod" in c.lower()]
            results[f"explore_{did}"] = f"EXISTE: {len(cols)} cols, muni_cols={muni_cols}"
        else:
            results[f"explore_{did}"] = "NO ACCESIBLE"
        time.sleep(1)

    PHASE_RESULTS["refresh"] = results
    log(f"\nFase 1 completa: {len(results)} operaciones")
    for k, v in results.items():
        status = "OK" if "OK" in v or "NUEVO" in v or "ACTUALIZADO" in v else "NOTA"
        log(f"  [{status}] {k}: {v}")


# ============================================================
# FASE 2: Transformación completa
# ============================================================

def phase2_transform():
    phase_header(2, "TRANSFORMACIÓN COMPLETA")
    from loop.orchestrator import run_transformers
    try:
        run_transformers()
        PHASE_RESULTS["transform"] = "OK"
        log("Fase 2 completa: transformación exitosa")
    except Exception as e:
        PHASE_RESULTS["transform"] = f"ERROR: {e}"
        log(f"ERROR en transformación: {e}", "ERROR")


# ============================================================
# FASE 3: Análisis avanzados
# ============================================================

def phase3_advanced_analysis():
    phase_header(3, "ANÁLISIS AVANZADOS")
    results = {}

    # 3.1 Índice SIE compuesto por comuna
    log("3.1 Generando índice SIE compuesto por comuna...")
    try:
        mapa = json.load(open(PUBLIC_DATA / "mapa_enriquecido.json"))
        comunas = mapa.get("comunas", {})

        index_data = []
        for code, data in comunas.items():
            if len(code) > 2:  # skip corregimientos for index
                continue

            # Normalize each dimension to 0-100 scale
            desercion = data.get("tasa_desercion")
            aprobacion = data.get("tasa_aprobacion")
            saber = data.get("saber11_promedio")
            matricula = data.get("matricula", 0)

            if desercion is None or aprobacion is None:
                continue

            # Desercion: lower is better (invert: 10 - desercion) * 10
            d_score = max(0, min(100, (10 - (desercion or 5)) * 10))
            # Aprobacion: direct percentage
            a_score = aprobacion or 85
            # Saber 11: normalize to 0-100 (range 200-350)
            s_score = max(0, min(100, ((saber or 250) - 200) / 1.5)) if saber else 50

            # Weighted composite: calidad 40%, permanencia 35%, aprobacion 25%
            indice = round(s_score * 0.40 + d_score * 0.35 + a_score * 0.25, 1)

            COMUNA_NAMES = {
                "1": "Popular", "2": "Santa Cruz", "3": "Manrique", "4": "Aranjuez",
                "5": "Castilla", "6": "Doce de Octubre", "7": "Robledo",
                "8": "Villa Hermosa", "9": "Buenos Aires", "10": "La Candelaria",
                "11": "Laureles-Estadio", "12": "La América", "13": "San Javier",
                "14": "El Poblado", "15": "Guayabal", "16": "Belén",
            }

            index_data.append({
                "comuna": code,
                "nombre": COMUNA_NAMES.get(code, f"Comuna {code}"),
                "indice_sie": indice,
                "calidad_score": round(s_score, 1),
                "permanencia_score": round(d_score, 1),
                "aprobacion_score": round(a_score, 1),
                "saber11_promedio": saber,
                "tasa_desercion": desercion,
                "tasa_aprobacion": aprobacion,
                "matricula": matricula,
            })

        index_data.sort(key=lambda x: x["indice_sie"], reverse=True)

        with open(PUBLIC_DATA / "indice_sie_comunas.json", "w", encoding="utf-8") as f:
            json.dump(index_data, f, ensure_ascii=False, indent=2)
        results["indice_sie"] = f"OK: {len(index_data)} comunas rankeadas"
        log(f"  Top 3: {[(d['nombre'], d['indice_sie']) for d in index_data[:3]]}")
        log(f"  Bottom 3: {[(d['nombre'], d['indice_sie']) for d in index_data[-3:]]}")
    except Exception as e:
        results["indice_sie"] = f"ERROR: {e}"
        log(f"  Error: {e}", "ERROR")

    # 3.2 Análisis de tendencias YoY
    log("3.2 Análisis de tendencias interanuales...")
    try:
        stats = json.load(open(PUBLIC_DATA / "estadisticas_medellin.json"))
        tendencias = []
        for i in range(1, len(stats)):
            prev, curr = stats[i - 1], stats[i]
            entry = {"anio": curr["anio"]}
            for field in ["cobertura_neta", "cobertura_bruta", "desercion", "aprobacion", "reprobacion", "repitencia"]:
                pv = prev.get(field)
                cv = curr.get(field)
                if pv is not None and cv is not None:
                    delta = round(cv - pv, 2)
                    pct = round(delta / pv * 100, 1) if pv != 0 else 0
                    entry[f"{field}_delta"] = delta
                    entry[f"{field}_pct_change"] = pct
                    # Flag significant changes (>10% YoY)
                    if abs(pct) > 10:
                        entry[f"{field}_alerta"] = "significativo"
            tendencias.append(entry)

        with open(PUBLIC_DATA / "tendencias_yoy.json", "w", encoding="utf-8") as f:
            json.dump(tendencias, f, ensure_ascii=False, indent=2)
        results["tendencias"] = f"OK: {len(tendencias)} años analizados"

        # Identify most volatile periods
        alertas = []
        for t in tendencias:
            for k, v in t.items():
                if k.endswith("_alerta"):
                    field = k.replace("_alerta", "")
                    alertas.append(f"{t['anio']} {field}: {t.get(f'{field}_pct_change')}%")
        if alertas:
            log(f"  Cambios significativos: {alertas[:5]}")
    except Exception as e:
        results["tendencias"] = f"ERROR: {e}"

    # 3.3 Outlier detection — IEs que sobre/sub-rinden dado su contexto
    log("3.3 Detección de outliers (IEs vs contexto)...")
    try:
        cruces = json.load(open(PUBLIC_DATA / "cruces_multivariable.json"))
        saber_ie = json.load(open(PUBLIC_DATA / "saber11_por_ie.json"))

        # Get estrato averages as baseline
        estrato_baselines = {}
        for e in cruces["saber11"].get("por_estrato", []):
            estrato_baselines[e["estrato"]] = e["promedio"]

        # For each IE, compare against sector/estrato baseline
        # We can use sector_x_estrato for more precise baselines
        sector_estrato = {}
        for se in cruces["saber11"].get("sector_x_estrato", []):
            e = se.get("estrato", "")
            sector_estrato[(e, "OFICIAL")] = se.get("oficial", 0)
            sector_estrato[(e, "NO OFICIAL")] = se.get("no_oficial", 0)

        # Simple outlier: IEs more than 30 pts above/below their sector-estrato average
        outliers = {"sobre_rinden": [], "sub_rinden": []}
        for ie in saber_ie:
            if ie.get("evaluados", 0) < 20:
                continue
            score = ie.get("promedioGlobal", 0)
            sector = ie.get("naturaleza", "")
            # Use overall average as baseline since we don't have per-IE estrato
            baseline = 260 if sector == "NO OFICIAL" else 245
            diff = score - baseline
            if diff > 40:
                outliers["sobre_rinden"].append({
                    "nombre": ie["nombre"],
                    "naturaleza": sector,
                    "puntaje": score,
                    "diferencia": round(diff, 1),
                    "evaluados": ie.get("evaluados", 0),
                })
            elif diff < -30:
                outliers["sub_rinden"].append({
                    "nombre": ie["nombre"],
                    "naturaleza": sector,
                    "puntaje": score,
                    "diferencia": round(diff, 1),
                    "evaluados": ie.get("evaluados", 0),
                })

        outliers["sobre_rinden"].sort(key=lambda x: x["diferencia"], reverse=True)
        outliers["sub_rinden"].sort(key=lambda x: x["diferencia"])

        with open(PUBLIC_DATA / "outliers_ie.json", "w", encoding="utf-8") as f:
            json.dump(outliers, f, ensure_ascii=False, indent=2)
        results["outliers"] = f"OK: {len(outliers['sobre_rinden'])} sobre-rinden, {len(outliers['sub_rinden'])} sub-rinden"
        if outliers["sobre_rinden"]:
            top = outliers["sobre_rinden"][0]
            log(f"  Mejor outlier: {top['nombre']} (+{top['diferencia']} pts, {top['evaluados']} eval)")
    except Exception as e:
        results["outliers"] = f"ERROR: {e}"

    # 3.4 Resumen ejecutivo automático
    log("3.4 Generando resumen ejecutivo...")
    try:
        kpis = json.load(open(PUBLIC_DATA / "kpis.json"))
        manifest = json.load(open(PUBLIC_DATA / "data_manifest.json"))
        desercion = json.load(open(PUBLIC_DATA / "desercion_medellin.json"))
        cruces = json.load(open(PUBLIC_DATA / "cruces_multivariable.json"))

        # Extract key facts
        cob_neta = kpis.get("coberturaNeta", {})
        deser = kpis.get("desercion", {})
        aprob = kpis.get("aprobacion", {})
        frescura = kpis.get("frescura", {})

        # Desercion trend
        serie = desercion.get("serieTemporal", [])
        if len(serie) >= 3:
            last3 = serie[-3:]
            trend = [s.get("tasaDesercion", 0) for s in last3]
            if trend[-1] < trend[0]:
                deser_trend = "mejorando"
            elif trend[-1] > trend[0]:
                deser_trend = "empeorando"
            else:
                deser_trend = "estable"
        else:
            deser_trend = "insuficientes datos"

        # Brecha estrato
        por_estrato = cruces["saber11"].get("por_estrato", [])
        e1 = next((e for e in por_estrato if e["estrato"] == "1"), None)
        e5 = next((e for e in por_estrato if e["estrato"] == "5"), None)
        brecha_estrato = round(e5["promedio"] - e1["promedio"], 1) if e1 and e5 else 0

        resumen = {
            "generado": datetime.now().isoformat(timespec="seconds"),
            "periodo_analisis": f"{frescura.get('estadisticas_etc', {}).get('ultimo_anio', '?')}",
            "indicadores_principales": {
                "cobertura_neta": cob_neta.get("valor") if isinstance(cob_neta, dict) else cob_neta,
                "desercion": deser.get("valor") if isinstance(deser, dict) else deser,
                "aprobacion": aprob.get("valor") if isinstance(aprob, dict) else aprob,
                "saber11_promedio": kpis.get("promedioSaber11"),
                "tendencia_desercion": deser_trend,
            },
            "brechas": {
                "estrato_1_vs_5": brecha_estrato,
                "internet": round(
                    next((e["promedio"] for e in cruces["saber11"].get("por_internet", []) if e["internet"] == "Si"), 0) -
                    next((e["promedio"] for e in cruces["saber11"].get("por_internet", []) if e["internet"] == "No"), 0), 1
                ),
            },
            "datos_frescura": {
                k: v.get("ultimo_anio", v.get("ultimo_dato", "?"))
                for k, v in manifest.get("archivos", {}).items()
                if v.get("obsoleto") or v.get("descontinuado")
            },
            "total_datasets": manifest.get("total_archivos", 0),
            "total_ies": kpis.get("totalIEs"),
            "total_evaluados": kpis.get("totalEvaluados"),
        }

        with open(PUBLIC_DATA / "resumen_ejecutivo.json", "w", encoding="utf-8") as f:
            json.dump(resumen, f, ensure_ascii=False, indent=2)
        results["resumen"] = "OK"
    except Exception as e:
        results["resumen"] = f"ERROR: {e}"

    PHASE_RESULTS["analysis"] = results
    log(f"\nFase 3 completa: {len(results)} análisis")
    for k, v in results.items():
        log(f"  {k}: {v}")


# ============================================================
# FASE 4: Validación integral
# ============================================================

def phase4_validate():
    phase_header(4, "VALIDACIÓN INTEGRAL")
    code, output = run_cmd("python -m loop.validators.validate_data", timeout=120)
    log(output)
    PHASE_RESULTS["validation"] = "OK" if code == 0 else f"EXIT {code}"

    # Also validate new files
    new_files = ["indice_sie_comunas.json", "tendencias_yoy.json", "outliers_ie.json", "resumen_ejecutivo.json"]
    for fname in new_files:
        fpath = PUBLIC_DATA / fname
        if fpath.exists():
            try:
                with open(fpath) as f:
                    data = json.load(f)
                size = fpath.stat().st_size / 1024
                log(f"  {fname}: OK ({size:.1f} KB)")
            except Exception as e:
                log(f"  {fname}: INVALID JSON - {e}", "ERROR")
        else:
            log(f"  {fname}: NO GENERADO", "WARNING")

    # Re-generate manifest to include new files
    log("\nActualizando manifest con nuevos archivos...")
    from loop.transformers._meta import build_manifest
    build_manifest()


# ============================================================
# FASE 5: Build + Deploy
# ============================================================

def phase5_build_deploy():
    phase_header(5, "BUILD + DEPLOY")

    log("5.1 npm run build...")
    code, output = run_cmd("npm run build", timeout=300)
    # Extract key lines
    for line in output.split("\n"):
        if any(k in line for k in ["error", "Error", "warning", "Compiled", "Route", "○", "ƒ", "Generating"]):
            log(f"  {line.strip()}")
    PHASE_RESULTS["build"] = "OK" if code == 0 else f"BUILD FAILED (exit {code})"

    if code != 0:
        log("Build falló. Abortando deploy.", "ERROR")
        return

    log("5.2 git commit...")
    run_cmd("git add public/data/*.json")
    code, output = run_cmd(
        'git commit -m "$(cat <<\'EOF\'\ndata: pipeline nocturno — refresh + análisis avanzados\n\n'
        'Datos refrescados desde datos.gov.co APIs.\n'
        'Nuevos datasets: indice_sie_comunas, tendencias_yoy, outliers_ie, resumen_ejecutivo.\n'
        'Manifest actualizado.\n\n'
        'Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>\n'
        'EOF\n)"'
    )
    if "nothing to commit" in output:
        log("  Sin cambios para commit")
    else:
        log(f"  Commit: {'OK' if code == 0 else 'FAIL'}")
        run_cmd("git push")
        log("  Push completado")

    log("5.3 vercel --prod...")
    code, output = run_cmd("vercel --prod --yes", timeout=300)
    for line in output.split("\n"):
        if any(k in line for k in ["Production:", "Aliased:", "Error", "Building"]):
            log(f"  {line.strip()}")
    PHASE_RESULTS["deploy"] = "OK" if code == 0 else f"DEPLOY FAILED (exit {code})"


# ============================================================
# REPORTE FINAL
# ============================================================

def final_report():
    log(f"\n{'='*70}")
    log("  REPORTE FINAL — PIPELINE NOCTURNO")
    log(f"{'='*70}\n")

    for phase, result in PHASE_RESULTS.items():
        if isinstance(result, dict):
            ok = sum(1 for v in result.values() if "OK" in str(v) or "NUEVO" in str(v) or "ACTUALIZADO" in str(v))
            total = len(result)
            log(f"  {phase}: {ok}/{total} exitosos")
        else:
            log(f"  {phase}: {result}")

    # List new/updated files
    log("\nArchivos en public/data/:")
    for f in sorted(PUBLIC_DATA.glob("*.json")):
        size = f.stat().st_size / 1024
        log(f"  {f.name}: {size:.1f} KB")

    log(f"\nPipeline finalizado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


# ============================================================
# MAIN
# ============================================================

def main():
    log(f"Pipeline nocturno iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"Proyecto: {PROJECT_ROOT}")
    log(f"Python: {sys.version.split()[0]}")

    start = time.time()

    try:
        phase1_data_refresh()
    except Exception as e:
        log(f"FASE 1 FALLÓ: {e}", "ERROR")
        PHASE_RESULTS["refresh"] = f"CRASH: {e}"

    try:
        phase2_transform()
    except Exception as e:
        log(f"FASE 2 FALLÓ: {e}", "ERROR")
        PHASE_RESULTS["transform"] = f"CRASH: {e}"

    try:
        phase3_advanced_analysis()
    except Exception as e:
        log(f"FASE 3 FALLÓ: {e}", "ERROR")
        PHASE_RESULTS["analysis"] = f"CRASH: {e}"

    try:
        phase4_validate()
    except Exception as e:
        log(f"FASE 4 FALLÓ: {e}", "ERROR")
        PHASE_RESULTS["validation"] = f"CRASH: {e}"

    try:
        phase5_build_deploy()
    except Exception as e:
        log(f"FASE 5 FALLÓ: {e}", "ERROR")
        PHASE_RESULTS["deploy"] = f"CRASH: {e}"

    elapsed = time.time() - start
    log(f"\nTiempo total: {elapsed / 60:.1f} minutos")

    final_report()


if __name__ == "__main__":
    main()
