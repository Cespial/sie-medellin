"""
Procesa los datasets de MEData (deserción, aprobación, Saber histórico, ISCE, docentes)
y genera JSONs optimizados para el frontend.
"""
import json
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PUBLIC_DATA = Path(__file__).parent.parent.parent / "public" / "data"
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def safe_load(filename: str) -> list | dict | None:
    filepath = RAW_DIR / filename
    if not filepath.exists():
        print(f"  ⚠️ {filename} no existe")
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content.startswith("<"):
                print(f"  ⚠️ {filename} contiene HTML (redirect), no JSON")
                return None
            return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"  ⚠️ {filename} JSON inválido: {e}")
        return None


def process_desercion():
    print("📊 Procesando Deserción (MEData)...")
    data = safe_load("medata_desercion.json")
    if not data:
        return

    if isinstance(data, dict):
        data = data.get("data", data.get("records", [data]))

    print(f"  Tipo: {type(data)}, Registros: {len(data) if isinstance(data, list) else 'dict'}")

    if isinstance(data, list) and data:
        print(f"  Ejemplo: {json.dumps(data[0], ensure_ascii=False)[:200]}")
        output = PUBLIC_DATA / "medata_desercion.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def process_aprobacion():
    print("\n📊 Procesando Aprobación (MEData)...")
    data = safe_load("medata_aprobacion.json")
    if not data:
        return

    if isinstance(data, dict):
        data = data.get("data", data.get("records", [data]))

    print(f"  Tipo: {type(data)}, Registros: {len(data) if isinstance(data, list) else 'dict'}")

    if isinstance(data, list) and data:
        print(f"  Ejemplo: {json.dumps(data[0], ensure_ascii=False)[:200]}")
        output = PUBLIC_DATA / "medata_aprobacion.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def process_saber11_historico():
    print("\n📊 Procesando Saber 11 Histórico (MEData)...")
    data = safe_load("medata_saber11_historico.json")
    if not data:
        return

    if isinstance(data, dict):
        data = data.get("data", data.get("records", [data]))

    print(f"  Tipo: {type(data)}, Registros: {len(data) if isinstance(data, list) else 'dict'}")

    if isinstance(data, list) and data:
        print(f"  Ejemplo: {json.dumps(data[0], ensure_ascii=False)[:200]}")
        output = PUBLIC_DATA / "medata_saber11_historico.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def process_isce():
    print("\n📊 Procesando ISCE (MEData)...")
    data = safe_load("medata_isce.json")
    if not data:
        return

    if isinstance(data, dict):
        data = data.get("data", data.get("records", [data]))

    print(f"  Tipo: {type(data)}, Registros: {len(data) if isinstance(data, list) else 'dict'}")

    if isinstance(data, list) and data:
        print(f"  Ejemplo: {json.dumps(data[0], ensure_ascii=False)[:200]}")
        output = PUBLIC_DATA / "medata_isce.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def process_docentes():
    print("\n📊 Procesando Docentes (MEData)...")
    data = safe_load("medata_docentes.json")
    if not data:
        return

    if isinstance(data, dict):
        data = data.get("data", data.get("records", [data]))

    print(f"  Tipo: {type(data)}, Registros: {len(data) if isinstance(data, list) else 'dict'}")

    if isinstance(data, list) and data:
        print(f"  Ejemplo: {json.dumps(data[0], ensure_ascii=False)[:200]}")
        output = PUBLIC_DATA / "medata_docentes.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {output.name}")


def run():
    print("=" * 60)
    print("TRANSFORMER — MEData Datasets")
    print("=" * 60)

    process_desercion()
    process_aprobacion()
    process_saber11_historico()
    process_isce()
    process_docentes()

    print("\n✅ Transformación MEData completa")


if __name__ == "__main__":
    run()
