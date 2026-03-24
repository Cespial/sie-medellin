"""
Calcula score de riesgo por IE para priorizar intervenciones.
Output: public/data/escuelas_riesgo.json
"""
import json
from pathlib import Path

PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"


def run():
    print("=" * 60)
    print("TRANSFORMER — Scores de Riesgo por IE")
    print("=" * 60)

    profiles_path = PUBLIC_DATA / "perfiles_ie.json"
    if not profiles_path.exists():
        print("  ⚠️ perfiles_ie.json no existe. Ejecutar process_ie_profiles primero.")
        return

    profiles = json.load(open(profiles_path))

    results = []
    for p in profiles:
        puntaje = p.get("promedioGlobal", 250)
        estrato = p.get("socioeconomico", {}).get("estratoPromedio", 3)
        pct_internet = p.get("socioeconomico", {}).get("pctInternet")
        outlier = p.get("outlier")
        evaluados = p.get("evaluados", 0)
        percentil = p.get("percentil", 50)

        # Risk factors (each 0-1, higher = more risk)
        f_puntaje = max(0, min(1, (300 - puntaje) / 150))  # 300=no risk, 150=max risk
        f_estrato = max(0, min(1, (4 - estrato) / 3))  # E4+=no risk, E1=max risk
        f_internet = max(0, min(1, (80 - (pct_internet or 80)) / 80)) if pct_internet is not None else 0.3
        f_outlier = 0.5 if (outlier and outlier.get("tipo") == "sub_rinde") else 0
        f_percentil = max(0, min(1, (40 - percentil) / 40))  # P40+=no risk, P0=max risk

        # Weighted composite (0-100)
        score = round(
            (f_puntaje * 30 + f_estrato * 25 + f_internet * 20 + f_outlier * 15 + f_percentil * 10),
            1
        )

        # Determine risk level
        if score >= 50:
            nivel = "critico"
        elif score >= 35:
            nivel = "alto"
        elif score >= 20:
            nivel = "medio"
        else:
            nivel = "bajo"

        # Identify top risk factors
        factores = []
        if f_puntaje > 0.5:
            factores.append(f"Puntaje bajo ({puntaje:.0f})")
        if f_estrato > 0.5:
            factores.append(f"Estrato vulnerable ({estrato:.1f})")
        if pct_internet is not None and pct_internet < 60:
            factores.append(f"Brecha digital ({pct_internet:.0f}% internet)")
        if f_outlier > 0:
            factores.append("Sub-rinde vs contexto")
        if percentil < 20:
            factores.append(f"Percentil bajo (P{percentil:.0f})")

        results.append({
            "codigoDane": p["codigoDane"],
            "nombre": p["nombre"],
            "naturaleza": p["naturaleza"],
            "comuna": p.get("comuna", ""),
            "comunaNombre": p.get("comunaNombre", ""),
            "scoreRiesgo": score,
            "nivel": nivel,
            "promedioGlobal": puntaje,
            "percentil": percentil,
            "estratoPromedio": estrato,
            "pctInternet": pct_internet,
            "evaluados": evaluados,
            "clasificacion": p.get("clasificacion", ""),
            "factores": factores,
            "coordenadas": p.get("coordenadas"),
        })

    results.sort(key=lambda x: x["scoreRiesgo"], reverse=True)

    output = PUBLIC_DATA / "escuelas_riesgo.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)

    size_kb = output.stat().st_size / 1024
    criticos = sum(1 for r in results if r["nivel"] == "critico")
    altos = sum(1 for r in results if r["nivel"] == "alto")
    medios = sum(1 for r in results if r["nivel"] == "medio")
    bajos = sum(1 for r in results if r["nivel"] == "bajo")

    print(f"\n  ✅ {output.name} ({len(results)} IEs, {size_kb:.1f} KB)")
    print(f"  Crítico: {criticos} | Alto: {altos} | Medio: {medios} | Bajo: {bajos}")
    if results:
        top = results[0]
        print(f"  Mayor riesgo: {top['nombre']} (score {top['scoreRiesgo']}, {', '.join(top['factores'][:2])})")


if __name__ == "__main__":
    run()
