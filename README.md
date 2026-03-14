# SIE Medellín — Sistema de Inteligencia Educativa

> Dashboard de inteligencia educativa para la Secretaría de Educación de Medellín. Visualización interactiva de indicadores de calidad, cobertura y contexto educativo a escala municipal.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deck.gl](https://img.shields.io/badge/deck.gl-9-00A9E0?logo=data:image/svg+xml;base64,)](https://deck.gl)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Live:** [sie-medellin.vercel.app](https://sie-medellin.vercel.app)

## Descripción

SIE Medellín es una plataforma de datos abiertos educativos que integra múltiples fuentes oficiales (MeData, datos.gov.co/SIMAT, ICFES Saber 11, DANE) para ofrecer una visión integral del sistema educativo de Medellín.

### Características principales

- **Mapa interactivo** con Deck.gl + MapLibre GL — visualización geoespacial de instituciones educativas, cobertura por comuna y calidad por zona
- **Dashboard de KPIs** — indicadores clave de matrícula, deserción, resultados Saber 11, infraestructura
- **Módulos temáticos:**
  - `/cobertura` — Matrícula oficial vs. no oficial, tasas de cobertura bruta y neta
  - `/calidad` — Resultados Saber 11, clasificación ICFES, tendencias históricas
  - `/contexto` — Indicadores socioeconómicos, NBI, estratificación
  - `/instituciones` — Directorio y perfil individual de establecimientos educativos
  - `/mapa` — Exploración geoespacial con capas temáticas
- **Rankings y tablas comparativas** por comuna, zona y estrato
- **Gráficos de tendencias** con Recharts

### Pipeline de datos (Python)

El directorio `loop/` contiene un pipeline ETL en Python que:
- Recolecta datos de MeData (Open Data Medellín), datos.gov.co (SIMAT matrícula, Saber 11, Directorio de establecimientos), ICFES y DANE
- Descarga geometrías de comunas y barrios via Overpass/OSM
- Transforma y procesa datos para consumo del frontend
- Orquestado via `config.yaml` con colectores modulares

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16, React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Mapas | Deck.gl 9 + MapLibre GL |
| Gráficos | Recharts |
| Estado | TanStack React Query |
| Animaciones | Framer Motion |
| Tipografía | Inter, Syne, JetBrains Mono |
| Data pipeline | Python (pandas, geopandas, requests) |

## Estructura del proyecto

```
sie-medellin/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── calidad/            # Módulo de calidad educativa
│   │   ├── cobertura/          # Módulo de cobertura
│   │   ├── contexto/           # Módulo de contexto socioeconómico
│   │   ├── instituciones/      # Directorio de instituciones
│   │   └── mapa/               # Mapa interactivo
│   ├── components/
│   │   ├── charts/             # TrendChart
│   │   ├── dashboard/          # HeroSection, KPICard, KPIGrid, RankingTable
│   │   ├── layout/             # Sidebar, DataSourcesFooter
│   │   └── map/                # MapContainer (Deck.gl)
│   ├── lib/
│   │   ├── data/               # Escalas de color, indicadores
│   │   └── utils/              # Utilidades (cn, etc.)
│   └── types/                  # Tipos TypeScript (education, geo)
├── loop/                       # Pipeline ETL (Python)
│   ├── config.yaml             # Configuración de fuentes de datos
│   ├── orchestrator.py         # Orquestador principal
│   ├── collectors/             # Colectores: MeData, datos.gov, geo
│   └── transformers/           # Procesamiento para frontend
├── public/                     # Assets estáticos
└── package.json
```

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Cespial/sie-medellin.git
cd sie-medellin

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

### Pipeline de datos

```bash
cd loop
pip install -r requirements.txt
python orchestrator.py
```

## Fuentes de datos

| Fuente | Dataset | ID |
|--------|---------|-----|
| datos.gov.co | SIMAT — Matrícula | `nudc-hpkp` |
| datos.gov.co | Saber 11 | `kgpf-yjmc` |
| datos.gov.co | Directorio establecimientos | `cqnp-pnnh` |
| MeData | Datos abiertos de Medellín | Múltiples endpoints |
| ICFES | Resultados Saber | API oficial |
| DANE | Censo, proyecciones | Estadísticas nacionales |

## Licencia

MIT

---

Desarrollado por [Cristian Espinal Maya](https://github.com/Cespial) · [fourier.dev](https://fourier.dev)
