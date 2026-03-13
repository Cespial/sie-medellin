"""
Generates enriched map data for the interactive map.
Merges per-comuna and per-institution data from all sources.
Output: public/data/mapa_enriquecido.json
"""
import json
from pathlib import Path
from collections import defaultdict

PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"


def safe_float(v, default=0.0):
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def run():
    print("=" * 60)
    print("TRANSFORMER — Datos Enriquecidos para Mapa")
    print("=" * 60)

    # ---------- Load all sources ----------

    # 1. Deserción por comuna
    desercion = {}
    dp = PUBLIC_DATA / "desercion_medellin.json"
    if dp.exists():
        with open(dp) as f:
            d = json.load(f)
        for c in d.get("porComuna", []):
            desercion[str(c["comuna"])] = {
                "tasa_desercion": c["tasaDesercion"],
                "desertores": c["desertores"],
                "matricula_desercion": c["matricula"],
            }
        print(f"  Deserción: {len(desercion)} comunas")

    # 2. Aprobación por comuna
    aprobacion = {}
    ap = PUBLIC_DATA / "aprobacion_medellin.json"
    if ap.exists():
        with open(ap) as f:
            a = json.load(f)
        for c in a.get("porComuna", []):
            aprobacion[str(c["comuna"])] = {
                "tasa_aprobacion": c["tasaAprobacion"],
                "aprobados": c["aprobados"],
            }
        print(f"  Aprobación: {len(aprobacion)} comunas")

    # 3. Matrícula por comuna
    matricula = {}
    mp = PUBLIC_DATA / "matricula_medellin.json"
    if mp.exists():
        with open(mp) as f:
            m = json.load(f)
        for c in m.get("porComuna", []):
            comuna = str(c.get("comuna", ""))
            if not comuna:
                continue
            total = c.get("total", 0)
            oficial = c.get("oficial", 0)
            privado = c.get("privado", 0)
            pct_oficial = round(oficial / total * 100, 1) if total > 0 else 0
            matricula[comuna] = {
                "matricula": total,
                "oficial": oficial,
                "privado": privado,
                "pct_oficial": pct_oficial,
            }
        print(f"  Matrícula: {len(matricula)} comunas")

    # 4. Clasificación Saber 11 (has comuna field)
    clasif_ie = {}
    cp = PUBLIC_DATA / "clasificacion_saber11.json"
    if cp.exists():
        with open(cp) as f:
            cl = json.load(f)
        for ie in cl.get("instituciones", []):
            dane = ie.get("codigoDane", "")
            if dane:
                clasif_ie[dane] = {
                    "comuna": str(ie.get("comuna", "")),
                    "clasificacion": ie.get("clasificacion", ""),
                    "sector": ie.get("sector", ""),
                    "evaluados_clasif": ie.get("evaluados", 0),
                }
        print(f"  Clasificación Saber 11: {len(clasif_ie)} IEs")

    # 5. Saber 11 puntajes por IE
    saber_ie = {}
    sp = PUBLIC_DATA / "saber11_por_ie.json"
    if sp.exists():
        with open(sp) as f:
            saber_list = json.load(f)
        for ie in saber_list:
            dane = ie.get("codigoDane", "")
            if dane:
                saber_ie[dane] = {
                    "promedioGlobal": safe_float(ie.get("promedioGlobal")),
                    "evaluados": ie.get("evaluados", 0),
                    "matematicas": safe_float(ie.get("matematicas")),
                    "lecturaCritica": safe_float(ie.get("lecturaCritica")),
                    "cienciasNaturales": safe_float(ie.get("cienciasNaturales")),
                    "socialesCiudadanas": safe_float(ie.get("socialesCiudadanas")),
                    "ingles": safe_float(ie.get("ingles")),
                }
        print(f"  Saber 11 puntajes: {len(saber_ie)} IEs")

    # 6. ISCE por IE
    isce_ie = {}
    ip = PUBLIC_DATA / "isce_por_ie.json"
    if ip.exists():
        with open(ip) as f:
            isce_list = json.load(f)
        for ie in isce_list:
            dane = ie.get("codigoDane", "")
            if dane:
                # Use most recent available year
                val = safe_float(ie.get("isce_2018")) or safe_float(ie.get("isce_2017")) or safe_float(ie.get("isce_2016"))
                isce_ie[dane] = {
                    "comuna": str(ie.get("comuna", "")),
                    "isce": round(val, 2) if val else 0,
                }
        print(f"  ISCE: {len(isce_ie)} IEs")

    # ---------- Aggregate to comuna ----------

    # Saber 11 weighted average per comuna
    saber_by_comuna = defaultdict(lambda: {"scores": [], "evaluados": 0, "count": 0, "clasif": defaultdict(int)})
    for dane, clasif in clasif_ie.items():
        comuna = clasif.get("comuna", "")
        if not comuna:
            continue
        saber = saber_ie.get(dane, {})
        prom = saber.get("promedioGlobal", 0)
        evalu = saber.get("evaluados", 0) or clasif.get("evaluados_clasif", 0)
        if prom > 0 and evalu > 0:
            saber_by_comuna[comuna]["scores"].append((prom, evalu))
            saber_by_comuna[comuna]["evaluados"] += evalu
            saber_by_comuna[comuna]["count"] += 1
        # Count classifications
        cl = clasif.get("clasificacion", "")
        if cl:
            saber_by_comuna[comuna]["clasif"][cl] += 1

    # ISCE average per comuna
    isce_by_comuna = defaultdict(list)
    for dane, data in isce_ie.items():
        comuna = data.get("comuna", "")
        val = data.get("isce", 0)
        if comuna and val > 0:
            isce_by_comuna[comuna].append(val)

    # ---------- Build comprehensive per-comuna dict ----------
    all_comunas = set(
        list(desercion.keys()) + list(aprobacion.keys()) +
        list(matricula.keys()) + list(saber_by_comuna.keys())
    )

    comunas_result = {}
    for comuna in sorted(all_comunas):
        entry = {}

        if comuna in desercion:
            entry.update(desercion[comuna])
        if comuna in aprobacion:
            entry.update(aprobacion[comuna])
        if comuna in matricula:
            entry.update(matricula[comuna])

        # Saber 11 weighted avg
        saber = saber_by_comuna.get(comuna)
        if saber and saber["scores"]:
            total_eval = saber["evaluados"]
            weighted = sum(s * e for s, e in saber["scores"]) / total_eval
            entry["saber11_promedio"] = round(weighted, 1)
            entry["saber11_evaluados"] = total_eval
            entry["saber11_ies"] = saber["count"]
            entry["saber11_clasif"] = dict(saber["clasif"])

        # ISCE avg
        isce = isce_by_comuna.get(comuna, [])
        if isce:
            entry["isce_promedio"] = round(sum(isce) / len(isce), 2)
            entry["isce_ies"] = len(isce)

        comunas_result[comuna] = entry

    # ---------- Build per-institution enriched data ----------
    ie_result = {}
    all_danes = set(list(saber_ie.keys()) + list(clasif_ie.keys()) + list(isce_ie.keys()))
    for dane in all_danes:
        entry = {}
        if dane in saber_ie:
            s = saber_ie[dane]
            entry["promedioGlobal"] = s["promedioGlobal"]
            entry["evaluados"] = s["evaluados"]
            entry["matematicas"] = s["matematicas"]
            entry["lecturaCritica"] = s["lecturaCritica"]
            entry["cienciasNaturales"] = s["cienciasNaturales"]
            entry["socialesCiudadanas"] = s["socialesCiudadanas"]
            entry["ingles"] = s["ingles"]
        if dane in clasif_ie:
            entry["clasificacion"] = clasif_ie[dane].get("clasificacion", "")
        if dane in isce_ie:
            entry["isce"] = isce_ie[dane].get("isce", 0)
        if entry:
            ie_result[dane] = entry

    # ---------- Output ----------
    output = {
        "comunas": comunas_result,
        "instituciones": ie_result,
    }

    output_path = PUBLIC_DATA / "mapa_enriquecido.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = output_path.stat().st_size / 1024
    print(f"\n  {output_path.name} ({size_kb:.1f} KB)")
    print(f"  Comunas enriquecidas: {len(comunas_result)}")
    print(f"  Instituciones enriquecidas: {len(ie_result)}")
    print("Completo")


if __name__ == "__main__":
    run()
