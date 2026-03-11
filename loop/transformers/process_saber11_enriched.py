"""
Procesa todos los batches de Saber 11 descargados de datos.gov.co
y genera datos enriquecidos para el frontend.
"""
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"


def run():
    print("=" * 60)
    print("TRANSFORMER — Saber 11 Enriched (datos.gov.co)")
    print("=" * 60)

    # Load all batches
    all_records = []
    i = 1
    while True:
        suffix = "" if i == 1 else f"_batch{i}"
        path = RAW_DIR / f"saber11_medellin{suffix}.json"
        if not path.exists():
            break
        try:
            data = json.load(open(path, "r", encoding="utf-8"))
            all_records.extend(data)
            print(f"  Batch {i}: {len(data)} registros")
        except json.JSONDecodeError:
            print(f"  Batch {i}: JSON corrupto, omitido")
        i += 1

    print(f"  Total: {len(all_records)} registros")

    # Aggregate by IE
    by_ie = defaultdict(lambda: {
        "scores": [], "mat": [], "lec": [], "cin": [], "soc": [], "ing": [],
        "periodos": set(), "naturaleza": "", "nombre": ""
    })
    by_period = defaultdict(lambda: {"total": 0, "count": 0, "by_gender": defaultdict(lambda: {"total": 0, "count": 0})})

    for r in all_records:
        try:
            score = float(r.get("punt_global", 0) or 0)
        except (ValueError, TypeError):
            continue
        if score <= 0:
            continue

        ie = r.get("cole_cod_dane_establecimiento", "")
        period = r.get("periodo", "")
        gender = r.get("estu_genero", "")

        by_ie[ie]["scores"].append(score)
        by_ie[ie]["periodos"].add(period)
        by_ie[ie]["naturaleza"] = r.get("cole_naturaleza", "")
        by_ie[ie]["nombre"] = r.get("cole_nombre_establecimiento", "")

        for field, key in [("punt_matematicas", "mat"), ("punt_lectura_critica", "lec"),
                           ("punt_c_naturales", "cin"), ("punt_sociales_ciudadanas", "soc"),
                           ("punt_ingles", "ing")]:
            try:
                v = float(r.get(field, 0) or 0)
                if v > 0:
                    by_ie[ie][key].append(v)
            except (ValueError, TypeError):
                pass

        by_period[period]["total"] += score
        by_period[period]["count"] += 1
        by_period[period]["by_gender"][gender]["total"] += score
        by_period[period]["by_gender"][gender]["count"] += 1

    # Enhanced IE rankings
    ie_list = []
    for code, d in by_ie.items():
        if len(d["scores"]) >= 5:
            avg = sum(d["scores"]) / len(d["scores"])
            entry = {
                "codigoDane": code,
                "nombre": d["nombre"],
                "naturaleza": d["naturaleza"],
                "promedioGlobal": round(avg, 1),
                "evaluados": len(d["scores"]),
                "periodos": len(d["periodos"]),
            }
            for key, label in [("mat", "matematicas"), ("lec", "lecturaCritica"),
                               ("cin", "cienciasNaturales"), ("soc", "socialesCiudadanas"),
                               ("ing", "ingles")]:
                if d[key]:
                    entry[label] = round(sum(d[key]) / len(d[key]), 1)
            ie_list.append(entry)

    ie_list.sort(key=lambda x: x["promedioGlobal"], reverse=True)

    # Period series
    period_series = []
    for p in sorted(by_period.keys()):
        d = by_period[p]
        avg = d["total"] / d["count"] if d["count"] > 0 else 0
        entry = {
            "periodo": p,
            "promedio": round(avg, 1),
            "evaluados": d["count"],
        }
        for g, gd in d["by_gender"].items():
            if gd["count"] > 0:
                key = f"promedio_{g.strip().lower()}" if g else "promedio_nd"
                entry[key] = round(gd["total"] / gd["count"], 1)
        period_series.append(entry)

    # Save
    out1 = PUBLIC_DATA / "saber11_por_ie.json"
    with open(out1, "w", encoding="utf-8") as f:
        json.dump(ie_list, f, ensure_ascii=False, indent=2)

    out2 = PUBLIC_DATA / "saber11_serie_temporal.json"
    with open(out2, "w", encoding="utf-8") as f:
        json.dump(period_series, f, ensure_ascii=False, indent=2)

    print(f"  {len(ie_list)} IEs -> {out1.name}")
    print(f"  {len(period_series)} períodos -> {out2.name}")

    if ie_list:
        top = ie_list[0]
        print(f"  Top IE: {top['nombre']} ({top['promedioGlobal']})")


if __name__ == "__main__":
    run()
