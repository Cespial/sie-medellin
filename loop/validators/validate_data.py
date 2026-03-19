"""
SIE Medellin — Data Validators
Run after pipeline to detect data quality issues.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Resolve paths relative to the project root (two levels up from this file)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "public" / "data"

CURRENT_YEAR = datetime.now().year

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class Finding:
    """A single validation finding."""

    def __init__(self, severity: str, file: str, message: str):
        self.severity = severity  # CRITICAL, WARNING, INFO
        self.file = file
        self.message = message

    def __str__(self):
        return f"[{self.severity}] {self.file}: {self.message}"


def _load_json(filename: str):
    """Load a JSON file from the data directory.  Returns None if missing."""
    path = DATA_DIR / filename
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

def validate_estadisticas_medellin() -> list[Finding]:
    """Validate estadisticas_medellin.json for known data-quality bugs."""
    findings: list[Finding] = []
    fname = "estadisticas_medellin.json"
    data = _load_json(fname)

    if data is None:
        findings.append(Finding("CRITICAL", fname, "File not found"))
        return findings

    if not isinstance(data, list) or len(data) == 0:
        findings.append(Finding("CRITICAL", fname, "Expected non-empty array"))
        return findings

    for row in data:
        anio = row.get("anio", "?")

        # --- poblacion truncation ---
        pob = row.get("poblacion_5_16")
        if pob is not None and pob < 100_000:
            findings.append(Finding(
                "CRITICAL", fname,
                f"anio={anio}: poblacion_5_16={pob} — likely truncated (expected >300k for Medellin)"
            ))

        # --- tamano_promedio_grupo corruption ---
        tpg = row.get("tamano_promedio_grupo")
        if tpg is not None and tpg > 100:
            findings.append(Finding(
                "CRITICAL", fname,
                f"anio={anio}: tamano_promedio_grupo={tpg} — data corruption (expected ~30)"
            ))

        # --- sedes_conectadas_a_internet missing ---
        sci = row.get("sedes_conectadas_a_internet")
        if sci is None or sci == 0:
            findings.append(Finding(
                "WARNING", fname,
                f"anio={anio}: sedes_conectadas_a_internet={sci} — missing data (null or zero)"
            ))

        # --- cobertura_neta > 100 ---
        cn = row.get("cobertura_neta")
        if cn is not None and cn > 100:
            findings.append(Finding(
                "INFO", fname,
                f"anio={anio}: cobertura_neta={cn}% > 100% — possible with ETC methodology but worth reviewing"
            ))

        # --- desercion unusually high ---
        des = row.get("desercion")
        if des is not None and des > 10:
            findings.append(Finding(
                "WARNING", fname,
                f"anio={anio}: desercion={des}% > 10% — unusually high for Medellin"
            ))

        # --- aprobacion unusually low ---
        apr = row.get("aprobacion")
        if apr is not None and apr < 70:
            findings.append(Finding(
                "WARNING", fname,
                f"anio={anio}: aprobacion={apr}% < 70% — unusually low for Medellin"
            ))

    return findings


def validate_kpis() -> list[Finding]:
    """Validate kpis.json for duplicates and suspicious values."""
    findings: list[Finding] = []
    fname = "kpis.json"
    data = _load_json(fname)

    if data is None:
        findings.append(Finding("CRITICAL", fname, "File not found"))
        return findings

    if not isinstance(data, dict):
        findings.append(Finding("CRITICAL", fname, "Expected JSON object"))
        return findings

    # --- duplicate KPI fields ---
    # Check for both flat and nested versions of the same metric
    duplicate_pairs = [
        ("tasaDesercion", "desercion"),
        ("tasaAprobacion", "aprobacion"),
        ("tasaCoberturaNeta", "coberturaNeta"),
        ("tasaReprobacion", "reprobacion"),
    ]
    for flat_key, nested_key in duplicate_pairs:
        has_flat = flat_key in data
        has_nested = nested_key in data
        if has_flat and has_nested:
            findings.append(Finding(
                "WARNING", fname,
                f"Duplicate KPI: both '{flat_key}' and '{nested_key}' present — pick one canonical form"
            ))

    # --- totalMatriculados ---
    tm = data.get("totalMatriculados")
    if tm is None or tm <= 0:
        findings.append(Finding(
            "CRITICAL", fname,
            f"totalMatriculados={tm} — must be > 0"
        ))

    # --- promedioSaber11 ---
    ps = data.get("promedioSaber11")
    if ps is not None and not (100 <= ps <= 500):
        findings.append(Finding(
            "CRITICAL", fname,
            f"promedioSaber11={ps} — expected between 100 and 500"
        ))
    elif ps is None:
        findings.append(Finding(
            "WARNING", fname,
            "promedioSaber11 is missing"
        ))

    # --- totalIEs ---
    ti = data.get("totalIEs")
    if ti is None or ti <= 0:
        findings.append(Finding(
            "CRITICAL", fname,
            f"totalIEs={ti} — must be > 0"
        ))

    return findings


def validate_desercion_medellin() -> list[Finding]:
    """Validate desercion_medellin.json for series length."""
    findings: list[Finding] = []
    fname = "desercion_medellin.json"
    data = _load_json(fname)

    if data is None:
        findings.append(Finding("CRITICAL", fname, "File not found"))
        return findings

    serie = data.get("serieTemporal", [])
    n = len(serie)
    if n < 3:
        findings.append(Finding(
            "WARNING", fname,
            f"serieTemporal has only {n} year(s) — need at least 3 for meaningful trend analysis"
        ))
    else:
        findings.append(Finding(
            "INFO", fname,
            f"serieTemporal has {n} year(s)"
        ))

    return findings


def validate_matricula_medellin() -> list[Finding]:
    """Validate matricula_medellin.json for data freshness."""
    findings: list[Finding] = []
    fname = "matricula_medellin.json"
    data = _load_json(fname)

    if data is None:
        findings.append(Finding("CRITICAL", fname, "File not found"))
        return findings

    serie = data.get("serieTemporal", [])
    if not serie:
        findings.append(Finding("CRITICAL", fname, "serieTemporal is empty"))
        return findings

    latest_year = max(int(r.get("anio", 0)) for r in serie)
    age = CURRENT_YEAR - latest_year
    if age > 3:
        findings.append(Finding(
            "WARNING", fname,
            f"Latest year in serieTemporal is {latest_year} — {age} years old (current: {CURRENT_YEAR})"
        ))
    else:
        findings.append(Finding(
            "INFO", fname,
            f"Latest year in serieTemporal is {latest_year} ({age} year(s) from current)"
        ))

    return findings


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def run_all() -> list[Finding]:
    """Run every validator and return all findings."""
    findings: list[Finding] = []
    findings.extend(validate_estadisticas_medellin())
    findings.extend(validate_kpis())
    findings.extend(validate_desercion_medellin())
    findings.extend(validate_matricula_medellin())
    return findings


def _print_report(findings: list[Finding]):
    """Pretty-print the validation report to stdout."""
    # Sort: CRITICAL first, then WARNING, then INFO
    order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    findings.sort(key=lambda f: order.get(f.severity, 9))

    counts = {"CRITICAL": 0, "WARNING": 0, "INFO": 0}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1

    print("=" * 72)
    print("SIE Medellin — Data Validation Report")
    print(f"Data directory: {DATA_DIR}")
    print(f"Run at: {datetime.now().isoformat(timespec='seconds')}")
    print("=" * 72)

    for f in findings:
        print(f"  {f}")

    print("-" * 72)
    print(f"Summary: {counts['CRITICAL']} CRITICAL, {counts['WARNING']} WARNING, {counts['INFO']} INFO")
    if counts["CRITICAL"] > 0:
        print(">>> FIX CRITICAL issues before publishing the dashboard. <<<")
    print("=" * 72)


if __name__ == "__main__":
    all_findings = run_all()
    _print_report(all_findings)
    # Exit with non-zero if any CRITICAL findings
    sys.exit(1 if any(f.severity == "CRITICAL" for f in all_findings) else 0)
