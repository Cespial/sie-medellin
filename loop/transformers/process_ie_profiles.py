"""
Genera perfiles completos por institución educativa.
Fusiona: microdatos Saber 11 + sedes + clasificación + ISCE + outliers + mapa enriquecido.
Output: public/data/perfiles_ie.json
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


def run():
    print("=" * 60)
    print("TRANSFORMER — Perfiles Institucionales Completos")
    print("=" * 60)

    # --- 1. Load ALL saber11 microdatos ---
    print("Cargando microdatos Saber 11...")
    all_records = []
    for f in sorted(RAW_DIR.glob("saber11_medellin*.json")):
        with open(f) as fh:
            all_records.extend(json.load(fh))
    print(f"  {len(all_records)} registros totales")

    # --- 2. Aggregate per IE from microdatos (single pass) ---
    print("Agregando por IE...")
    ie_raw = defaultdict(lambda: {
        "nombre": "", "naturaleza": "", "jornada": "",
        "scores": [], "periodos": defaultdict(lambda: {"scores": [], "count": 0}),
        "materias": {"matematicas": [], "lectura_critica": [], "c_naturales": [],
                     "sociales_ciudadanas": [], "ingles": []},
        "estratos": defaultdict(int), "internet": {"Si": 0, "No": 0},
        "computador": {"Si": 0, "No": 0}, "madre_edu": defaultdict(int),
        "genero": {"F": 0, "M": 0}, "total_estudiantes": 0,
    })

    for r in all_records:
        code = r.get("cole_cod_dane_establecimiento", "")
        if not code:
            continue

        score = safe_float(r.get("punt_global"))
        if score <= 0:
            continue

        ie = ie_raw[code]
        ie["nombre"] = r.get("cole_nombre_establecimiento", "")
        ie["naturaleza"] = r.get("cole_naturaleza", "")
        ie["jornada"] = r.get("cole_jornada", "")
        ie["scores"].append(score)
        ie["total_estudiantes"] += 1

        # Per-period
        periodo = r.get("periodo", "")
        if periodo:
            ie["periodos"][periodo]["scores"].append(score)
            ie["periodos"][periodo]["count"] += 1

        # Subjects
        for field, key in [("punt_matematicas", "matematicas"),
                           ("punt_lectura_critica", "lectura_critica"),
                           ("punt_c_naturales", "c_naturales"),
                           ("punt_sociales_ciudadanas", "sociales_ciudadanas"),
                           ("punt_ingles", "ingles")]:
            v = safe_float(r.get(field))
            if v > 0:
                ie["materias"][key].append(v)

        # Socioeconomic
        estrato = r.get("fami_estratovivienda", "")
        if estrato and estrato not in ("N/A", "Sin Estrato"):
            e_num = estrato.replace("Estrato ", "")
            ie["estratos"][e_num] += 1

        inet = r.get("fami_tieneinternet", "")
        if inet in ("Si", "No"):
            ie["internet"][inet] += 1

        comp = r.get("fami_tienecomputador", "")
        if comp in ("Si", "No"):
            ie["computador"][comp] += 1

        madre = r.get("fami_educacionmadre", "")
        if madre and madre != "N/A":
            ie["madre_edu"][madre] += 1

        genero = r.get("estu_genero", "")
        if genero in ("F", "M"):
            ie["genero"][genero] += 1

    print(f"  {len(ie_raw)} IEs con microdatos")

    # --- 3. Load supplementary data ---
    # Sedes
    sedes_by_ie = defaultdict(list)
    sedes_path = RAW_DIR / "sedes_educativas_medellin.json"
    if sedes_path.exists():
        sedes_raw = json.load(open(sedes_path))
        for s in sedes_raw:
            code = s.get("codigo_dane", "")
            if code:
                sedes_by_ie[code].append({
                    "nombre": s.get("nombre_sede", ""),
                    "direccion": s.get("direccion", ""),
                    "barrio": s.get("barrio_vereda", ""),
                    "zona": s.get("zona", ""),
                    "telefono": s.get("telefono", ""),
                    "email": s.get("email", ""),
                    "matricula": int(s.get("total_matricula", 0) or 0),
                    "principal": s.get("principal", "") == "S",
                    "lat": safe_float(s.get("coordenada_y_sede")),
                    "lon": safe_float(s.get("coordenada_x_sede")),
                })
        print(f"  {len(sedes_by_ie)} IEs con datos de sedes")

    # Clasificación
    clasif_map = {}
    clasif_path = PUBLIC_DATA / "clasificacion_saber11.json"
    if clasif_path.exists():
        cl = json.load(open(clasif_path))
        for ie in cl.get("instituciones", []):
            clasif_map[ie.get("codigoDane", "")] = {
                "clasificacion": ie.get("clasificacion", ""),
                "comuna": ie.get("comuna", ""),
                "matriculados": ie.get("evaluados", 0),
            }

    # ISCE
    isce_map = {}
    isce_path = PUBLIC_DATA / "isce_por_ie.json"
    if isce_path.exists():
        for ie in json.load(open(isce_path)):
            code = ie.get("codigoDane", "")
            if code:
                isce_map[code] = {y: ie.get(f"isce_{y}") for y in ["2015", "2016", "2017", "2018"] if ie.get(f"isce_{y}")}

    # Outliers
    outlier_map = {}
    outlier_path = PUBLIC_DATA / "outliers_ie.json"
    if outlier_path.exists():
        ol = json.load(open(outlier_path))
        for ie in ol.get("sobre_rinden", []):
            outlier_map[ie["nombre"]] = {"tipo": "sobre_rinde", "diferencia": ie["diferencia"]}
        for ie in ol.get("sub_rinden", []):
            outlier_map[ie["nombre"]] = {"tipo": "sub_rinde", "diferencia": ie["diferencia"]}

    # Mapa enriquecido (context per comuna)
    comuna_context = {}
    mapa_path = PUBLIC_DATA / "mapa_enriquecido.json"
    if mapa_path.exists():
        mapa = json.load(open(mapa_path))
        comuna_context = mapa.get("comunas", {})

    # Índice SIE
    sie_index = {}
    sie_path = PUBLIC_DATA / "indice_sie_comunas.json"
    if sie_path.exists():
        for c in json.load(open(sie_path)):
            sie_index[c["comuna"]] = c.get("indice_sie", 0)

    # --- 4. City-wide averages for benchmarking ---
    city_avg = {}
    all_globals = [s for ie in ie_raw.values() for s in ie["scores"]]
    city_avg["global"] = round(sum(all_globals) / len(all_globals), 1) if all_globals else 0

    for subj in ["matematicas", "lectura_critica", "c_naturales", "sociales_ciudadanas", "ingles"]:
        all_subj = [s for ie in ie_raw.values() for s in ie["materias"][subj]]
        city_avg[subj] = round(sum(all_subj) / len(all_subj), 1) if all_subj else 0

    # Sector averages
    sector_avgs = {"OFICIAL": [], "NO OFICIAL": []}
    for ie in ie_raw.values():
        nat = ie["naturaleza"]
        if nat in sector_avgs and ie["scores"]:
            avg = sum(ie["scores"]) / len(ie["scores"])
            sector_avgs[nat].append(avg)
    sector_avg = {}
    for k, v in sector_avgs.items():
        sector_avg[k] = round(sum(v) / len(v), 1) if v else 0

    # --- 5. Build profiles ---
    print("Construyendo perfiles completos...")
    profiles = []
    all_ie_avgs = []  # for percentile calculation

    for code, ie in ie_raw.items():
        if len(ie["scores"]) < 3:
            continue
        avg_global = round(sum(ie["scores"]) / len(ie["scores"]), 1)
        all_ie_avgs.append((code, avg_global))

    all_ie_avgs.sort(key=lambda x: x[1])
    percentile_map = {}
    total_ies = len(all_ie_avgs)
    for rank, (code, _) in enumerate(all_ie_avgs):
        percentile_map[code] = round((rank / total_ies) * 100, 1)

    # Per-comuna ranking
    comuna_ies = defaultdict(list)
    for code, avg in all_ie_avgs:
        comuna = clasif_map.get(code, {}).get("comuna", "")
        if comuna:
            comuna_ies[comuna].append((code, avg))

    COMUNA_NAMES = {
        "1": "Popular", "2": "Santa Cruz", "3": "Manrique", "4": "Aranjuez",
        "5": "Castilla", "6": "Doce de Octubre", "7": "Robledo",
        "8": "Villa Hermosa", "9": "Buenos Aires", "10": "La Candelaria",
        "11": "Laureles-Estadio", "12": "La América", "13": "San Javier",
        "14": "El Poblado", "15": "Guayabal", "16": "Belén",
        "50": "Palmitas", "60": "San Cristóbal", "70": "Altavista",
        "80": "San Antonio de Prado", "90": "Santa Elena",
    }

    for code, ie in ie_raw.items():
        if len(ie["scores"]) < 3:
            continue

        avg_global = round(sum(ie["scores"]) / len(ie["scores"]), 1)
        comuna = clasif_map.get(code, {}).get("comuna", "")

        # Materias with benchmarks
        materias = {}
        ie_mat_avg = []
        for subj in ["matematicas", "lectura_critica", "c_naturales", "sociales_ciudadanas", "ingles"]:
            vals = ie["materias"][subj]
            if vals:
                subj_avg = round(sum(vals) / len(vals), 1)
                ie_mat_avg.append(subj_avg)
                materias[subj] = {
                    "puntaje": subj_avg,
                    "ciudad": city_avg.get(subj, 0),
                    "sector": 0,  # filled below
                }
            else:
                materias[subj] = {"puntaje": 0, "ciudad": city_avg.get(subj, 0), "sector": 0}

        # Mark strength/weakness
        if ie_mat_avg:
            own_avg = sum(ie_mat_avg) / len(ie_mat_avg)
            for subj, m in materias.items():
                m["fortaleza"] = m["puntaje"] > own_avg + 2
                m["debilidad"] = m["puntaje"] < own_avg - 2

        # Socioeconomic profile
        total_est = ie["total_estudiantes"]
        estratos = {}
        estrato_sum = 0
        estrato_count = 0
        for e in ["1", "2", "3", "4", "5", "6"]:
            n = ie["estratos"].get(e, 0)
            estratos[e] = round(n / total_est * 100, 1) if total_est > 0 else 0
            estrato_sum += int(e) * n
            estrato_count += n

        inet_total = ie["internet"]["Si"] + ie["internet"]["No"]
        comp_total = ie["computador"]["Si"] + ie["computador"]["No"]

        socio = {
            "estratos": estratos,
            "estratoPromedio": round(estrato_sum / estrato_count, 1) if estrato_count > 0 else 0,
            "pctInternet": round(ie["internet"]["Si"] / inet_total * 100, 1) if inet_total > 0 else None,
            "pctComputador": round(ie["computador"]["Si"] / comp_total * 100, 1) if comp_total > 0 else None,
            "educacionMadre": dict(ie["madre_edu"]),
            "ratioGenero": {
                "F": round(ie["genero"]["F"] / total_est * 100, 1) if total_est > 0 else 50,
                "M": round(ie["genero"]["M"] / total_est * 100, 1) if total_est > 0 else 50,
            },
        }

        # Historical by period
        historico = []
        for p in sorted(ie["periodos"].keys()):
            pd = ie["periodos"][p]
            if pd["scores"]:
                historico.append({
                    "periodo": p,
                    "promedio": round(sum(pd["scores"]) / len(pd["scores"]), 1),
                    "evaluados": pd["count"],
                })

        # Sedes
        sedes = sedes_by_ie.get(code, [])
        # Get coordinates from principal sede
        coords = None
        for s in sedes:
            if s["principal"] and s["lat"] and s["lon"]:
                coords = [s["lon"], s["lat"]]
                break
        if not coords:
            for s in sedes:
                if s["lat"] and s["lon"]:
                    coords = [s["lon"], s["lat"]]
                    break

        # Sede contact info
        principal_sede = next((s for s in sedes if s["principal"]), sedes[0] if sedes else None)

        # Rank in comuna
        rank_comuna = None
        total_ies_comuna = 0
        if comuna and comuna in comuna_ies:
            comuna_ranked = sorted(comuna_ies[comuna], key=lambda x: x[1], reverse=True)
            total_ies_comuna = len(comuna_ranked)
            for i, (c, _) in enumerate(comuna_ranked):
                if c == code:
                    rank_comuna = i + 1
                    break

        # Similar IEs (same sector + comuna, sorted by score)
        similares = []
        if comuna and comuna in comuna_ies:
            for c, avg in sorted(comuna_ies[comuna], key=lambda x: x[1], reverse=True):
                if c != code and ie_raw[c]["naturaleza"] == ie["naturaleza"]:
                    similares.append({
                        "codigoDane": c,
                        "nombre": ie_raw[c]["nombre"],
                        "promedioGlobal": avg,
                        "clasificacion": clasif_map.get(c, {}).get("clasificacion", ""),
                    })
                if len(similares) >= 3:
                    break

        # Outlier status
        outlier = outlier_map.get(ie["nombre"])

        # Context
        ctx = comuna_context.get(comuna, {})

        # Score esperado (simple: estrato_promedio * regression slope)
        # From cruces: E1=234.2, E5=293.8 → slope ≈ 14.9 pts per estrato
        estrato_prom = socio["estratoPromedio"]
        score_esperado = round(219.3 + estrato_prom * 14.9, 1) if estrato_prom > 0 else None
        valor_agregado = round(avg_global - score_esperado, 1) if score_esperado else None

        profile = {
            "codigoDane": code,
            "nombre": ie["nombre"],
            "naturaleza": ie["naturaleza"],
            "jornada": ie["jornada"],
            "comuna": comuna,
            "comunaNombre": COMUNA_NAMES.get(comuna, ""),
            "clasificacion": clasif_map.get(code, {}).get("clasificacion", ""),
            "outlier": outlier,
            # Contact
            "direccion": principal_sede["direccion"] if principal_sede else "",
            "barrio": principal_sede["barrio"] if principal_sede else "",
            "telefono": principal_sede["telefono"] if principal_sede else "",
            "email": principal_sede["email"] if principal_sede else "",
            "zona": principal_sede["zona"] if principal_sede else "",
            "coordenadas": coords,
            # Performance
            "promedioGlobal": avg_global,
            "percentil": percentile_map.get(code, 0),
            "rankComuna": rank_comuna,
            "totalIEsComuna": total_ies_comuna,
            "evaluados": len(ie["scores"]),
            "periodos": len(ie["periodos"]),
            "materias": materias,
            # Socioeconomic
            "socioeconomico": socio,
            # Historical
            "historico": historico,
            # ISCE
            "isce": isce_map.get(code, {}),
            # Sedes
            "sedes": [{"nombre": s["nombre"], "direccion": s["direccion"], "barrio": s["barrio"],
                       "zona": s["zona"], "matricula": s["matricula"], "principal": s["principal"]}
                      for s in sedes],
            # Context
            "contextoComuna": {
                "nombre": COMUNA_NAMES.get(comuna, ""),
                "tasaDesercion": ctx.get("tasa_desercion"),
                "tasaAprobacion": ctx.get("tasa_aprobacion"),
                "saber11Promedio": ctx.get("saber11_promedio"),
                "indiceSIE": sie_index.get(comuna, 0),
                "totalIEs": total_ies_comuna,
            },
            # Similar
            "similares": similares,
            # Value added
            "scoreEsperado": score_esperado,
            "valorAgregado": valor_agregado,
        }
        profiles.append(profile)

    profiles.sort(key=lambda x: x["promedioGlobal"], reverse=True)

    output = PUBLIC_DATA / "perfiles_ie.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(profiles, f, ensure_ascii=False)

    size_kb = output.stat().st_size / 1024
    print(f"\n  ✅ {output.name} ({len(profiles)} perfiles, {size_kb:.1f} KB)")

    # Stats
    with_coords = sum(1 for p in profiles if p["coordenadas"])
    with_sedes = sum(1 for p in profiles if p["sedes"])
    with_outlier = sum(1 for p in profiles if p["outlier"])
    with_isce = sum(1 for p in profiles if p["isce"])
    with_socio = sum(1 for p in profiles if p["socioeconomico"]["estratoPromedio"] > 0)

    print(f"  Con coordenadas: {with_coords}")
    print(f"  Con sedes: {with_sedes}")
    print(f"  Con outlier flag: {with_outlier}")
    print(f"  Con ISCE: {with_isce}")
    print(f"  Con perfil socioeconómico: {with_socio}")

    top = profiles[0]
    print(f"\n  Top IE: {top['nombre']} ({top['promedioGlobal']}, percentil {top['percentil']})")
    print(f"  Valor agregado top: {top.get('valorAgregado')} pts sobre esperado")


if __name__ == "__main__":
    run()
