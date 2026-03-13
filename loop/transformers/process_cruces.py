"""
Procesa microdatos Saber 11 y datos comunales para generar cruces multivariable.
Genera: public/data/cruces_multivariable.json
"""
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"


def safe_float(v, default=0.0):
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def avg(lst):
    return round(sum(lst) / len(lst), 1) if lst else 0


def process_saber11_cruces():
    """Extract socioeconomic cross-tabulations from Saber 11 microdatos."""
    print("Procesando cruces Saber 11...")

    # Load all available batches
    all_records = []
    for f in sorted(RAW_DIR.glob("saber11_medellin*.json")):
        with open(f) as fh:
            batch = json.load(fh)
            all_records.extend(batch)
    print(f"  {len(all_records)} registros totales")

    # --- 1. Score by stratum ---
    by_estrato = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        estrato = r.get("fami_estratovivienda", "N/A")
        if estrato and estrato not in ("N/A", "Sin Estrato"):
            by_estrato[estrato].append(score)

    estrato_result = []
    for e in ["Estrato 1", "Estrato 2", "Estrato 3", "Estrato 4", "Estrato 5", "Estrato 6"]:
        scores = by_estrato.get(e, [])
        if scores:
            estrato_result.append({
                "estrato": e.replace("Estrato ", ""),
                "promedio": avg(scores),
                "evaluados": len(scores),
            })

    # --- 2. Score by internet access ---
    by_internet = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        inet = r.get("fami_tieneinternet", "")
        if inet in ("Si", "No"):
            by_internet[inet].append(score)

    internet_result = [
        {"internet": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_internet.items())
    ]

    # --- 3. Score by mother's education ---
    by_madre = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        madre = r.get("fami_educacionmadre", "")
        if madre and madre != "N/A":
            by_madre[madre].append(score)

    madre_result = sorted(
        [{"nivel": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_madre.items() if len(v) >= 50],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # --- 4. Score by school shift ---
    by_jornada = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        jornada = r.get("cole_jornada", "")
        if jornada:
            by_jornada[jornada].append(score)

    jornada_result = sorted(
        [{"jornada": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_jornada.items() if len(v) >= 30],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # --- 5. Score by school type (carácter) ---
    by_caracter = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        car = r.get("cole_caracter", "")
        if car:
            by_caracter[car].append(score)

    caracter_result = sorted(
        [{"tipo": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_caracter.items() if len(v) >= 30],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # --- 6. Score by sector (oficial/no oficial) ---
    by_sector = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        sector = r.get("cole_naturaleza", "")
        if sector:
            by_sector[sector].append(score)

    sector_result = sorted(
        [{"sector": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_sector.items()],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # --- 7. Score by gender ---
    by_genero = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        gen = r.get("estu_genero", "")
        if gen in ("F", "M"):
            by_genero[gen].append(score)

    genero_result = [
        {"genero": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_genero.items())
    ]

    # --- 8. Estrato × Internet (2D cross) ---
    cross_estrato_inet = defaultdict(lambda: defaultdict(list))
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        estrato = r.get("fami_estratovivienda", "")
        inet = r.get("fami_tieneinternet", "")
        if estrato and estrato not in ("N/A", "Sin Estrato") and inet in ("Si", "No"):
            cross_estrato_inet[estrato.replace("Estrato ", "")][inet].append(score)

    cross_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        entry = {"estrato": e}
        for inet in ["Si", "No"]:
            scores = cross_estrato_inet[e].get(inet, [])
            entry[f"con_internet" if inet == "Si" else "sin_internet"] = avg(scores)
            entry[f"n_{'con' if inet == 'Si' else 'sin'}"] = len(scores)
        if entry.get("con_internet") or entry.get("sin_internet"):
            cross_result.append(entry)

    # --- 9. Score by bilingual status ---
    by_bilingue = defaultdict(list)
    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue
        bil = r.get("cole_bilingue", "")
        if bil in ("S", "N"):
            by_bilingue["Bilingüe" if bil == "S" else "No bilingüe"].append(score)

    bilingue_result = [
        {"tipo": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_bilingue.items())
    ]

    return {
        "por_estrato": estrato_result,
        "por_internet": internet_result,
        "por_educacion_madre": madre_result,
        "por_jornada": jornada_result,
        "por_caracter": caracter_result,
        "por_sector": sector_result,
        "por_genero": genero_result,
        "estrato_x_internet": cross_result,
        "por_bilingue": bilingue_result,
        "total_evaluados": len(all_records),
    }


def process_cruces_comunales():
    """Cross-tabulate deserción × aprobación × matrícula per comuna."""
    print("Procesando cruces comunales...")

    # Load desercion
    desercion = {}
    dp = PUBLIC_DATA / "desercion_medellin.json"
    if dp.exists():
        with open(dp) as f:
            d = json.load(f)
        for c in d.get("porComuna", []):
            desercion[c["comuna"]] = {
                "tasa_desercion": c["tasaDesercion"],
                "desertores": c["desertores"],
                "matricula_total": c["matricula"],
            }

    # Load aprobacion
    aprobacion = {}
    ap = PUBLIC_DATA / "aprobacion_medellin.json"
    if ap.exists():
        with open(ap) as f:
            a = json.load(f)
        for c in a.get("porComuna", []):
            aprobacion[c["comuna"]] = {
                "tasa_aprobacion": c["tasaAprobacion"],
                "aprobados": c["aprobados"],
            }

    # Load matricula per comuna
    matricula = {}
    mp = PUBLIC_DATA / "matricula_medellin.json"
    if mp.exists():
        with open(mp) as f:
            m = json.load(f)
        for c in m.get("porComuna", []):
            matricula[c.get("comuna", "")] = {
                "matricula": c.get("total", 0),
                "oficial": c.get("oficial", 0),
                "privado": c.get("privado", 0),
            }

    # Load saber11 per IE and aggregate to comuna (from clasificacion)
    saber_comuna = defaultdict(list)
    cp = PUBLIC_DATA / "clasificacion_saber11.json"
    if cp.exists():
        with open(cp) as f:
            cl = json.load(f)
        for ie in cl.get("instituciones", []):
            comuna = ie.get("comuna", "")
            evaluados = ie.get("evaluados", 0)
            if comuna and evaluados > 0:
                saber_comuna[comuna].append(evaluados)

    # Merge all by comuna
    all_comunas = set(list(desercion.keys()) + list(aprobacion.keys()))
    result = []
    for comuna in sorted(all_comunas):
        entry = {"comuna": comuna}
        if comuna in desercion:
            entry.update(desercion[comuna])
        if comuna in aprobacion:
            entry.update(aprobacion[comuna])
        if comuna in matricula:
            entry["matricula_total_serie"] = matricula[comuna]["matricula"]
            entry["oficial"] = matricula[comuna]["oficial"]
            entry["privado"] = matricula[comuna]["privado"]
        if comuna in saber_comuna:
            entry["ies_con_saber11"] = len(saber_comuna[comuna])
            entry["evaluados_saber11"] = sum(saber_comuna[comuna])
        result.append(entry)

    return result


def run():
    print("=" * 60)
    print("TRANSFORMER — Cruces Multivariable")
    print("=" * 60)

    saber_cruces = process_saber11_cruces()
    comunas_cruces = process_cruces_comunales()

    output_data = {
        "saber11": saber_cruces,
        "comunas": comunas_cruces,
    }

    output = PUBLIC_DATA / "cruces_multivariable.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    size_kb = output.stat().st_size / 1024
    print(f"\n  {output.name} ({size_kb:.1f} KB)")
    print(f"  Cruces Saber 11: {len(saber_cruces)} dimensiones")
    print(f"  Comunas cruzadas: {len(comunas_cruces)}")
    print("Completo")


if __name__ == "__main__":
    run()
