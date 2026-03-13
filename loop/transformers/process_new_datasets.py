"""
Procesa los 4 nuevos datasets descargados y genera JSONs optimizados para el frontend.
Genera:
- public/data/bachilleres_medellin.json
- public/data/educacion_superior_medellin.json
- public/data/paridad_genero_medellin.json
- public/data/docentes_perfil_medellin.json
"""
import json
from pathlib import Path
from collections import defaultdict

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def safe_int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def process_bachilleres():
    """Procesa bachilleres -> graduados por año."""
    print("Procesando Bachilleres...")
    filepath = RAW_DIR / "bachilleres_medellin.json"
    if not filepath.exists():
        print("  No hay datos de bachilleres")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    result = []
    for r in records:
        mat_11 = safe_int(r.get("matricula_11_total"))
        mat_26 = safe_int(r.get("matricula_26_total"))
        apr_11 = safe_int(r.get("aprobados_11_total"))
        apr_26 = safe_int(r.get("aprobados_26_total"))

        entry = {
            "anio": r.get("a_o", ""),
            "graduados_11": apr_11,
            "graduados_26": apr_26,
            "matricula_11": mat_11,
            "matricula_26": mat_26,
            "tasa_graduacion_11": round(apr_11 / mat_11 * 100, 1) if mat_11 > 0 else 0,
            "tasa_graduacion_26": round(apr_26 / mat_26 * 100, 1) if mat_26 > 0 else 0,
            "oficial_11": safe_int(r.get("aprobados_11_oficial")),
            "no_oficial_11": safe_int(r.get("aprobados_11_no_oficial")),
        }
        result.append(entry)

    result.sort(key=lambda x: x["anio"])

    output = PUBLIC_DATA / "bachilleres_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  {output.name}: {len(result)} registros")


def process_educacion_superior():
    """Procesa matrícula educación superior."""
    print("Procesando Educación Superior...")
    filepath = RAW_DIR / "educacion_superior_medellin.json"
    if not filepath.exists():
        print("  No hay datos de educación superior")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    result = []
    for r in records:
        tec = safe_int(r.get("tecnica_profesional"))
        tecno = safe_int(r.get("tecnologica"))
        uni = safe_int(r.get("universitaria"))
        esp = safe_int(r.get("especializacion"))
        mae = safe_int(r.get("maestria"))
        doc = safe_int(r.get("doctorado"))

        entry = {
            "anio": r.get("a_o", ""),
            "tecnica": tec,
            "tecnologica": tecno,
            "universitaria": uni,
            "especializacion": esp,
            "maestria": mae,
            "doctorado": doc,
            "total": tec + tecno + uni + esp + mae + doc,
            "ies_con_oferta": safe_int(r.get("ies_con_oferta")),
        }
        result.append(entry)

    result.sort(key=lambda x: x["anio"])

    output = PUBLIC_DATA / "educacion_superior_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  {output.name}: {len(result)} registros")


def process_paridad_genero():
    """Procesa índice de paridad de género."""
    print("Procesando Paridad de Género...")
    filepath = RAW_DIR / "paridad_genero_medellin.json"
    if not filepath.exists():
        print("  No hay datos de paridad")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    if not records:
        print("  Sin registros")
        return

    r = records[0]

    result = {
        "anio": r.get("anno_inf", "2020"),
        "matricula_por_nivel": [
            {"nivel": "Prejardín", "femenino": safe_int(r.get("matr_fem_prej")), "masculino": safe_int(r.get("matr_masc_prej"))},
            {"nivel": "Transición", "femenino": safe_int(r.get("matr_fem_trans")), "masculino": safe_int(r.get("matr_masc_trans"))},
            {"nivel": "Primaria", "femenino": safe_int(r.get("matr_fem_prim")), "masculino": safe_int(r.get("matr_masc_prim"))},
            {"nivel": "Secundaria", "femenino": safe_int(r.get("matr_fem_sec")), "masculino": safe_int(r.get("matr_masc_sec"))},
            {"nivel": "Media", "femenino": safe_int(r.get("matr_fem_media")), "masculino": safe_int(r.get("matr_masc_media"))},
        ],
        "ipg_cobertura_bruta": [
            {"nivel": "Prejardín", "ipg": safe_float(r.get("ipg_cbruta_prej"))},
            {"nivel": "Transición", "ipg": safe_float(r.get("ipg_cbruta_trans"))},
            {"nivel": "Primaria", "ipg": safe_float(r.get("ipg_cbruta_prim"))},
            {"nivel": "Secundaria", "ipg": safe_float(r.get("ipg_cbruta_sec"))},
            {"nivel": "Media", "ipg": safe_float(r.get("ipg_cbruta_media"))},
        ],
        "poblacion_por_edad": [
            {"rango": "3-4", "hombres": safe_int(r.get("hom_3y4")), "mujeres": safe_int(r.get("muj_3y4"))},
            {"rango": "5", "hombres": safe_int(r.get("hom_5")), "mujeres": safe_int(r.get("muj_5"))},
            {"rango": "6-10", "hombres": safe_int(r.get("hom_6a10")), "mujeres": safe_int(r.get("muj_6a10"))},
            {"rango": "11-14", "hombres": safe_int(r.get("hom_11a14")), "mujeres": safe_int(r.get("muj_11a14"))},
            {"rango": "15-16", "hombres": safe_int(r.get("hom_15y16")), "mujeres": safe_int(r.get("muj_15y16"))},
        ],
    }

    output = PUBLIC_DATA / "paridad_genero_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  {output.name}: 1 registro procesado")


def process_docentes():
    """Procesa perfil docente por dimensiones."""
    print("Procesando Docentes...")
    filepath = RAW_DIR / "docentes_medellin_perfil.json"
    if not filepath.exists():
        print("  No hay datos de docentes")
        return

    with open(filepath, "r") as f:
        records = json.load(f)

    total = 0
    por_genero = defaultdict(int)
    por_nivel_educativo = defaultdict(int)
    por_nivel_ensenanza = defaultdict(int)
    por_estatuto = defaultdict(int)
    por_tipo_vinculacion = defaultdict(int)
    por_zona = defaultdict(int)

    for r in records:
        n = safe_int(r.get("docentes_n"))
        total += n
        por_genero[r.get("genero", "N/D")] += n
        por_nivel_educativo[r.get("niv_educ_d", "N/D")] += n
        por_nivel_ensenanza[r.get("nivel_ensenanza", "N/D")] += n
        por_estatuto[r.get("estatuto_3a", "N/D")] += n
        por_tipo_vinculacion[r.get("tipo_vinculacion", "N/D")] += n
        por_zona[r.get("zona", "N/D")] += n

    def to_list(d, key_name):
        return sorted(
            [{key_name: k, "total": v} for k, v in d.items()],
            key=lambda x: x["total"],
            reverse=True,
        )

    result = {
        "anio": records[0].get("anno_inf", "2022") if records else "2022",
        "total_docentes": total,
        "por_genero": to_list(por_genero, "genero"),
        "por_nivel_educativo": to_list(por_nivel_educativo, "nivel"),
        "por_nivel_ensenanza": to_list(por_nivel_ensenanza, "nivel"),
        "por_estatuto": to_list(por_estatuto, "estatuto"),
        "por_tipo_vinculacion": to_list(por_tipo_vinculacion, "tipo"),
        "por_zona": to_list(por_zona, "zona"),
    }

    output = PUBLIC_DATA / "docentes_perfil_medellin.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  {output.name}: {total} docentes en {len(records)} registros")


def run():
    print("=" * 60)
    print("TRANSFORMER — Nuevos Datasets para Frontend")
    print("=" * 60)

    process_bachilleres()
    process_educacion_superior()
    process_paridad_genero()
    process_docentes()

    print("\nTransformación completa")


if __name__ == "__main__":
    run()
