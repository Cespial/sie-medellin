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


SUBJECTS = ["matematicas", "lectura_critica", "c_naturales", "sociales_ciudadanas", "ingles"]
SUBJECT_LABELS = {
    "matematicas": "Matemáticas",
    "lectura_critica": "Lectura Crítica",
    "c_naturales": "C. Naturales",
    "sociales_ciudadanas": "Sociales",
    "ingles": "Inglés",
}


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

    # --- Single pass: collect all dimensions ---
    by_estrato = defaultdict(list)
    by_internet = defaultdict(list)
    by_madre = defaultdict(list)
    by_padre = defaultdict(list)
    by_jornada = defaultdict(list)
    by_caracter = defaultdict(list)
    by_sector = defaultdict(list)
    by_genero = defaultdict(list)
    by_bilingue = defaultdict(list)
    by_computador = defaultdict(list)
    by_automovil = defaultdict(list)
    by_lavadora = defaultdict(list)
    by_personas = defaultdict(list)
    by_cuartos = defaultdict(list)

    # 2D crosses
    cross_estrato_inet = defaultdict(lambda: defaultdict(list))
    cross_genero_estrato = defaultdict(lambda: defaultdict(list))
    cross_sector_estrato = defaultdict(lambda: defaultdict(list))

    # Per-subject by estrato
    materias_estrato = defaultdict(lambda: defaultdict(list))
    # Per-subject by gender
    materias_genero = defaultdict(lambda: defaultdict(list))

    for r in all_records:
        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue

        estrato_raw = r.get("fami_estratovivienda", "")
        estrato_num = estrato_raw.replace("Estrato ", "") if estrato_raw and estrato_raw not in ("N/A", "Sin Estrato") else ""
        inet = r.get("fami_tieneinternet", "")
        madre = r.get("fami_educacionmadre", "")
        padre = r.get("fami_educacionpadre", "")
        jornada = r.get("cole_jornada", "")
        caracter = r.get("cole_caracter", "")
        sector = r.get("cole_naturaleza", "")
        genero = r.get("estu_genero", "")
        bilingue = r.get("cole_bilingue", "")
        computador = r.get("fami_tienecomputador", "")
        automovil = r.get("fami_tieneautomovil", "")
        lavadora = r.get("fami_tienelavadora", "")
        personas = r.get("fami_personashogar", "")
        cuartos = r.get("fami_cuartoshogar", "")

        # 1D aggregations
        if estrato_num:
            by_estrato[estrato_num].append(score)
        if inet in ("Si", "No"):
            by_internet[inet].append(score)
        if madre and madre != "N/A":
            by_madre[madre].append(score)
        if padre and padre != "N/A":
            by_padre[padre].append(score)
        if jornada:
            by_jornada[jornada].append(score)
        if caracter:
            by_caracter[caracter].append(score)
        if sector:
            by_sector[sector].append(score)
        if genero in ("F", "M"):
            by_genero[genero].append(score)
        if bilingue in ("S", "N"):
            by_bilingue["Bilingüe" if bilingue == "S" else "No bilingüe"].append(score)
        if computador in ("Si", "No"):
            by_computador[computador].append(score)
        if automovil in ("Si", "No"):
            by_automovil[automovil].append(score)
        if lavadora in ("Si", "No"):
            by_lavadora[lavadora].append(score)
        if personas:
            by_personas[personas].append(score)
        if cuartos:
            by_cuartos[cuartos].append(score)

        # 2D crosses
        if estrato_num and inet in ("Si", "No"):
            cross_estrato_inet[estrato_num][inet].append(score)
        if estrato_num and genero in ("F", "M"):
            cross_genero_estrato[estrato_num][genero].append(score)
        if estrato_num and sector:
            cross_sector_estrato[estrato_num][sector].append(score)

        # Per-subject scores
        for subj in SUBJECTS:
            s = safe_float(r.get(f"punt_{subj}"))
            if s > 0:
                if estrato_num:
                    materias_estrato[estrato_num][subj].append(s)
                if genero in ("F", "M"):
                    materias_genero[genero][subj].append(s)

    # --- Build results ---

    # 1. Estrato
    estrato_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        scores = by_estrato.get(e, [])
        if scores:
            estrato_result.append({
                "estrato": e,
                "promedio": avg(scores),
                "evaluados": len(scores),
            })

    # 2. Internet
    internet_result = [
        {"internet": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_internet.items())
    ]

    # 3. Madre education
    madre_result = sorted(
        [{"nivel": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_madre.items() if len(v) >= 50],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # 4. Padre education
    padre_result = sorted(
        [{"nivel": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_padre.items() if len(v) >= 50],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # 5. Jornada
    jornada_result = sorted(
        [{"jornada": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_jornada.items() if len(v) >= 30],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # 6. Carácter
    caracter_result = sorted(
        [{"tipo": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_caracter.items() if len(v) >= 30],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # 7. Sector
    sector_result = sorted(
        [{"sector": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_sector.items()],
        key=lambda x: x["promedio"],
        reverse=True,
    )

    # 8. Género
    genero_result = [
        {"genero": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_genero.items())
    ]

    # 9. Bilingüe
    bilingue_result = [
        {"tipo": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_bilingue.items())
    ]

    # 10. Computador
    computador_result = [
        {"tiene": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_computador.items())
    ]

    # 11. Automóvil
    automovil_result = [
        {"tiene": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_automovil.items())
    ]

    # 12. Lavadora
    lavadora_result = [
        {"tiene": k, "promedio": avg(v), "evaluados": len(v)}
        for k, v in sorted(by_lavadora.items())
    ]

    # 13. Personas en hogar
    personas_result = sorted(
        [{"personas": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_personas.items() if len(v) >= 30],
        key=lambda x: x["personas"],
    )

    # 14. Cuartos en hogar
    cuartos_result = sorted(
        [{"cuartos": k, "promedio": avg(v), "evaluados": len(v)} for k, v in by_cuartos.items() if len(v) >= 30],
        key=lambda x: x["cuartos"],
    )

    # --- 2D crosses ---

    # Estrato × Internet
    cross_ei_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        entry = {"estrato": e}
        for inet in ["Si", "No"]:
            scores = cross_estrato_inet[e].get(inet, [])
            entry["con_internet" if inet == "Si" else "sin_internet"] = avg(scores)
            entry[f"n_{'con' if inet == 'Si' else 'sin'}"] = len(scores)
        if entry.get("con_internet") or entry.get("sin_internet"):
            cross_ei_result.append(entry)

    # Género × Estrato
    cross_ge_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        entry = {"estrato": e}
        for g in ["F", "M"]:
            scores = cross_genero_estrato[e].get(g, [])
            entry[g.lower()] = avg(scores)
            entry[f"n_{g.lower()}"] = len(scores)
        if entry.get("f") or entry.get("m"):
            cross_ge_result.append(entry)

    # Sector × Estrato
    cross_se_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        entry = {"estrato": e}
        for s in ["OFICIAL", "NO OFICIAL"]:
            scores = cross_sector_estrato[e].get(s, [])
            key = "oficial" if s == "OFICIAL" else "no_oficial"
            entry[key] = avg(scores)
            entry[f"n_{key}"] = len(scores)
        if entry.get("oficial") or entry.get("no_oficial"):
            cross_se_result.append(entry)

    # --- Per-subject aggregations ---

    # Per-subject by estrato
    mat_estrato_result = []
    for e in ["1", "2", "3", "4", "5", "6"]:
        entry = {"estrato": e}
        for subj in SUBJECTS:
            scores = materias_estrato[e].get(subj, [])
            entry[subj] = avg(scores)
        mat_estrato_result.append(entry)

    # Per-subject by gender
    mat_genero_result = []
    for g in ["F", "M"]:
        entry = {"genero": g}
        for subj in SUBJECTS:
            scores = materias_genero[g].get(subj, [])
            entry[subj] = avg(scores)
        mat_genero_result.append(entry)

    return {
        "por_estrato": estrato_result,
        "por_internet": internet_result,
        "por_educacion_madre": madre_result,
        "por_educacion_padre": padre_result,
        "por_jornada": jornada_result,
        "por_caracter": caracter_result,
        "por_sector": sector_result,
        "por_genero": genero_result,
        "estrato_x_internet": cross_ei_result,
        "genero_x_estrato": cross_ge_result,
        "sector_x_estrato": cross_se_result,
        "materias_x_estrato": mat_estrato_result,
        "materias_x_genero": mat_genero_result,
        "por_bilingue": bilingue_result,
        "por_computador": computador_result,
        "por_automovil": automovil_result,
        "por_lavadora": lavadora_result,
        "por_personas_hogar": personas_result,
        "por_cuartos_hogar": cuartos_result,
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
