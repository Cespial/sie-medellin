# SIE Medellin

Sistema de Inteligencia Educativa para la Secretaria de Educacion de Medellin.
Plataforma full-stack que integra 21 datasets de 5+ fuentes oficiales para visualizar el estado del sistema educativo en 16 comunas, 5 corregimientos y 452+ instituciones educativas.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deck.gl](https://img.shields.io/badge/deck.gl-9-00A9E0)](https://deck.gl)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)

**Live:** [sie-medellin.vercel.app](https://sie-medellin.vercel.app)

---

## Arquitectura

```
                    datos.gov.co    MEData     ICFES    OSM/Overpass
                        |            |          |           |
                        v            v          v           v
                   +-----------------------------------------+
                   |     Python Pipeline (loop/)             |
                   |  3 collectors -> 8 transformers ->      |
                   |  1 validator -> 1 manifest generator    |
                   +-----------------------------------------+
                        |                           |
                   public/data/              public/geojson/
                   21 JSON files             6 GeoJSON files
                        |                           |
                   +-----------------------------------------+
                   |     Next.js 16 Frontend (src/)          |
                   |  12 rutas | 26 componentes | 14 charts  |
                   |  Deck.gl mapa | Recharts graficas       |
                   +-----------------------------------------+
                                    |
                              Vercel (prod)
```

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 + React 19 (App Router) |
| Lenguaje | TypeScript 5 (strict mode) |
| Estilos | Tailwind CSS 4 + Geist Sans/Mono |
| Mapas | Deck.gl 9 (WebGL) |
| Graficas | Recharts 3 |
| Animaciones | Framer Motion 12 |
| Iconos | Lucide React |
| Pipeline | Python 3.11 (pandas, geopandas, requests) |
| Deploy | Vercel |

---

## Rutas

| Ruta | Proposito | Datos |
|------|-----------|-------|
| `/` | Dashboard ejecutivo: 8 KPIs, alertas, rankings | kpis, mapa_enriquecido, estadisticas, saber11 |
| `/mapa` | Mapa interactivo Deck.gl con 6 variables por comuna | mapa_enriquecido, GeoJSON |
| `/cobertura` | Tasas de cobertura neta/bruta 2011-2024 | estadisticas_medellin, estadisticas_historicas |
| `/calidad` | Saber 11 rankings + ISCE por IE | saber11_por_ie, isce_por_ie |
| `/permanencia` | Desercion por comuna + aprobacion | desercion, aprobacion |
| `/matricula` | Matricula 2004-2024 (real + estimada) | matricula_medellin |
| `/equidad` | Paridad genero + poblaciones especiales | paridad_genero, poblaciones, cruces |
| `/instituciones` | Directorio de 452 IEs con filtros | saber11_por_ie |
| `/instituciones/[codigo]` | Perfil individual por codigo DANE | saber11_por_ie, mapa_enriquecido |
| `/contexto` | Ed. superior, docentes, fuentes de datos | educacion_superior, docentes_perfil |
| `/analisis` | Panel de cruces multivariable (14 ejes + 3 cruces 2D) | cruces_multivariable |

---

## Datos: Frescura y Fuentes

Cada cifra tiene un ano real identificado. El dashboard muestra vintage labels con color-coding.

### Datos actuales (2024)

| Dataset | Fuente | ID | Ultimo dato |
|---------|--------|-----|-------------|
| Cobertura neta/bruta | datos.gov.co | sras-4t5p | 2024 |
| Desercion ciudad | datos.gov.co | sras-4t5p | 2024 |
| Aprobacion ciudad | datos.gov.co | sras-4t5p | 2024 |
| Estadisticas Antioquia | datos.gov.co | ji8i-4anb | 2024 |

### Datos recientes (2022-2023)

| Dataset | Fuente | Ultimo dato | Nota |
|---------|--------|-------------|------|
| Saber 11 microdatos | datos.gov.co/kgxf-xxbe | 2022 (periodo ICFES 20224) | 148K registros con puntaje |
| Bachilleres graduados | datos.gov.co | 2023 | 2024 eliminado (copia de 2022 en API) |
| Docentes perfil | datos.gov.co/MEN | 2022 | 11,634 docentes, snapshot |

### Datos historicos (>3 anos)

| Dataset | Fuente | Ultimo dato | Nota |
|---------|--------|-------------|------|
| Desercion por comuna | MEData CSV | 2017 | 21 comunas, unico ano en CSV |
| Aprobacion por comuna | MEData CSV | ~2017 | Por comuna/genero/nivel |
| Matricula por comuna | MEData CSV | 2019 | 2020-2024 estimados (cob x pob) |
| Sedes educativas | datos.gov.co/x5ay-984n | 2019 | 771 sedes, 441,926 matriculados |
| Ed. superior | datos.gov.co/MEN | 2020 | 16 anos deduplicados |
| Paridad genero | datos.gov.co/MEN | 2020 | 1 registro snapshot |
| ISCE | MEData CSV | 2018 | Descontinuado por MEN |

### Generados

| Dataset | Contenido |
|---------|-----------|
| cruces_multivariable.json | 14 ejes socioeconomicos + 3 cruces 2D (148K evaluados) |
| mapa_enriquecido.json | 21 comunas + 504 IEs fusionando todas las fuentes |
| data_manifest.json | Frescura de los 21 archivos (auto-generado) |

---

## Pipeline de Datos (Python)

### Orden de ejecucion

```bash
python -m loop.orchestrator --fuente transform
```

```
1. process_for_frontend     -> kpis, saber11_por_ie, sedes_resumen, estadisticas
2. process_medata_csv       -> desercion, saber11_historico, isce, matricula, aprobacion, clasificacion
3. process_new_datasets     -> bachilleres, ed_superior, paridad, docentes
4. process_saber11_enriched -> saber11_por_ie (enriquecido), saber11_serie_temporal
5. process_poblaciones      -> poblaciones_especiales, saber_3_5_9
6. process_cruces           -> cruces_multivariable (14 ejes + 3 cruces 2D)
7. process_map_data         -> mapa_enriquecido (fusion de todas las fuentes)
8. build_manifest           -> data_manifest.json (frescura automatica)
```

### Collectors

| Collector | Fuente | Metodo |
|-----------|--------|--------|
| datos_gov_collector.py | datos.gov.co (Socrata API) | SoQL queries, paginacion automatica |
| medata_collector.py | MEData (CKAN) | Descarga CSV directa |
| geo_collector.py | Overpass/OSM + GeoJSON local | Limites comunales, centroides |

### Validacion

```bash
python -m loop.validators.validate_data
```

Verifica: poblacion truncada, tasas fuera de rango, KPIs duplicados, datos obsoletos.
Salida: CRITICAL / WARNING / INFO con exit code 1 si hay criticos.

### Controles de calidad implementados

- Sanitizacion de `tamano_promedio_grupo` corrupto (>100 -> null)
- Sanitizacion de `sedes_conectadas_a_internet` (0 -> null)
- Deduplicacion de ed. superior (31 -> 16 registros)
- Deteccion automatica de filas copiadas en bachilleres (2024 = copia de 2022)
- Umbral minimo 10 evaluados para rankings Saber 11
- Periodos con <100 evaluados marcados como `muestra_menor`
- Parsing de comas en poblacion ("379,616" -> 379616)
- Estimacion matricula: `cobertura_bruta * poblacion_5_16 / 100` (2020-2024)

---

## Componentes

### Charts (14)

| Componente | Visualizacion | Datos |
|-----------|---------------|-------|
| TrendChart | Area chart temporal | estadisticas_historicas |
| MedellinTrendChart | Area chart con delta YoY | estadisticas_medellin |
| Saber11HistoricoChart | Line chart + tabla top 5 | saber11_historico |
| MatriculaChart | Stacked area (oficial/privado) + estimaciones | matricula_medellin |
| DesercionComunaChart | Horizontal bar por comuna | desercion_medellin |
| AprobacionChart | Multi-tab (comuna/genero/nivel) | aprobacion_medellin |
| GenderGapChart | Line chart F vs M | saber11_serie_temporal |
| ISCEChart | Horizontal bar top 20 IEs | isce_por_ie |
| BachilleresChart | Grouped bar grado 11 + 26 | bachilleres_medellin |
| EdSuperiorChart | Stacked bar por nivel | educacion_superior |
| ParidadGeneroChart | Bar + IPG gauge | paridad_genero |
| DocentesChart | Pie + horizontal bar | docentes_perfil |
| PoblacionesChart | Pie + bar por comuna (tabs) | poblaciones_especiales |
| CrucesPanel | 6 tabs, 20+ graficas | cruces_multivariable |

### Dashboard (5)

ExecutiveDashboard, HeroSection, KPICard, KPIGrid, RankingTable

### Layout (2)

Sidebar (chevron logo, responsive drawer), DataSourcesFooter (dinamico desde manifest)

### UI (3)

ChartSkeleton, DataVintage (badge de frescura), ErrorState

---

## Instalacion

### Frontend

```bash
git clone https://github.com/Cespial/sie-medellin.git
cd sie-medellin
npm install
npm run dev          # http://localhost:3000
```

### Pipeline de datos

```bash
pip install -r loop/requirements.txt

# Recolectar datos crudos (requiere API tokens)
python -m loop.orchestrator --fuente all

# Solo transformar (sin descargar)
python -m loop.orchestrator --fuente transform

# Validar datos generados
python -m loop.validators.validate_data
```

### Variables de entorno

Crear `.env.local`:

```
SOCRATA_APP_TOKEN=      # datos.gov.co (opcional, mejora rate limit)
```

No se requieren otras variables para desarrollo local. Los datos pre-procesados estan en `public/data/`.

---

## Deploy

```bash
vercel --prod
```

El proyecto esta configurado en Vercel con zero-config para Next.js 16.
Build: ~4s (Turbopack). 13 paginas estaticas, 1 dinamica.

---

## Estructura

```
sie-medellin/
├── src/
│   ├── app/                          # 12 rutas (App Router)
│   │   ├── page.tsx                  # Dashboard ejecutivo
│   │   ├── mapa/page.tsx             # Deck.gl map
│   │   ├── cobertura/page.tsx
│   │   ├── calidad/page.tsx
│   │   ├── permanencia/page.tsx
│   │   ├── matricula/page.tsx
│   │   ├── equidad/page.tsx
│   │   ├── contexto/page.tsx
│   │   ├── analisis/page.tsx
│   │   ├── instituciones/page.tsx
│   │   └── instituciones/[codigo]/page.tsx
│   ├── components/
│   │   ├── charts/                   # 14 componentes Recharts
│   │   ├── dashboard/                # KPIs, rankings, hero
│   │   ├── layout/                   # Sidebar, footer
│   │   ├── map/                      # Deck.gl container
│   │   └── ui/                       # Skeleton, vintage, error
│   ├── hooks/                        # useFetchData, useDataManifest
│   ├── lib/                          # chart-styles, colorScales, indicators
│   └── types/                        # education.ts, geo.ts
├── loop/                             # Pipeline ETL (Python)
│   ├── orchestrator.py               # CLI: --fuente {all|transform|geo|...}
│   ├── config.yaml                   # Fuentes y configuracion
│   ├── collectors/                   # 3 colectores (datos_gov, medata, geo)
│   ├── transformers/                 # 8 transformers + _meta.py
│   ├── validators/                   # validate_data.py
│   └── data/raw/                     # 45 archivos, 218 MB (no tracked)
├── public/
│   ├── data/                         # 21 JSON datasets (375+ KB)
│   └── geojson/                      # 6 archivos GeoJSON
└── package.json
```

---

## Hallazgos Clave (auditoría verificada)

Estos numeros fueron verificados contra datos crudos el 2026-03-20:

1. **Brecha socioeconomica**: 59.6 pts entre estrato 1 (234.2) y estrato 5 (293.8) en Saber 11
2. **Internet**: +31.9 pts de diferencia (Si: 255.8 vs No: 223.9)
3. **Educacion de la madre**: 101.8 pts entre postgrado (308.0) y ninguna (206.2)
4. **Jornada**: completa supera sabatina en 87.8 pts (factor institucional mas fuerte)
5. **Sector en E1**: oficiales superan no-oficiales en 19.0 pts (se invierte desde E3)
6. **Genero**: 10.5 pts a favor de hombres, transversal a todos los estratos

---

## Roadmap

### Fase 1: Datos frescos (prioridad alta)

- [ ] **Saber 11 2024**: Actualizar microdatos cuando ICFES publique periodo 20244 (esperado S2 2026)
- [ ] **Sedes 2024**: Re-query x5ay-984n con filtro ano=2024 (si disponible)
- [ ] **Matricula real 2020-2024**: Buscar fuente MEData actualizada o SIMAT directo
- [ ] **Desercion por comuna 2024**: Solicitar a Secretaria de Educacion o buscar en MEData
- [ ] **Docentes 2024**: Re-query datos.gov.co/MEN con filtro ano reciente
- [ ] **Bachilleres 2024**: Monitorear API para datos reales (no copia de 2022)

### Fase 2: Enriquecimiento analitico

- [ ] **Correlacion desercion x seguridad**: Cruzar con tasas de homicidio por comuna (Obs. Seguridad Medellin)
- [ ] **ECV Medellin**: Integrar Encuesta de Calidad de Vida (asistencia escolar, gasto educativo)
- [ ] **Censo DANE 2018**: Agregar poblacion por edad, vivienda, servicios por comuna
- [ ] **IPM por comuna**: Indice de Pobreza Multidimensional para correlacion con desercion
- [ ] **Serie temporal por comuna**: Desercion historica si se consiguen CSVs MEData de mas anos
- [ ] **Saber 3/5/9**: Ya hay datos (saber_3_5_9.json) — construir visualizaciones

### Fase 3: Funcionalidades

- [ ] **Comparador de IEs**: Seleccionar 2-3 instituciones y comparar radar charts
- [ ] **Alertas automaticas**: Definir umbrales y generar reportes de comunas en riesgo
- [ ] **Export PDF**: Generar informe ejecutivo descargable
- [ ] **API REST**: Endpoints para consumo externo de datos procesados
- [ ] **Modo presentacion**: Vista optimizada para proyector (KPIs grandes, graficas simplificadas)
- [ ] **i18n**: Soporte ingles para audiencia internacional
- [ ] **Filtros temporales**: Selector de ano en dashboard para comparar periodos

### Fase 4: Infraestructura

- [ ] **CI/CD**: GitHub Actions para lint + build + deploy automatico
- [ ] **Tests**: Vitest para componentes, pytest para pipeline
- [ ] **Cron pipeline**: Scheduled re-collection mensual via Vercel Cron o GitHub Actions
- [ ] **Supabase**: Migrar de JSON estatico a base de datos para queries dinamicos
- [ ] **Rate limiting**: Implementar cache de API Socrata con TTL
- [ ] **Monitoring**: Vercel Analytics + Speed Insights

### Fase 5: Datos avanzados

- [ ] **Machine learning**: Modelo predictivo de desercion por IE (features: estrato, internet, educacion madre)
- [ ] **Clustering comunas**: K-means o DBSCAN para identificar tipologias comunales
- [ ] **Indice compuesto**: Crear indice SIE propio ponderando cobertura + calidad + permanencia + equidad
- [ ] **Georreferenciacion fina**: Desercion a nivel de barrio (si datos disponibles)
- [ ] **Benchmarking nacional**: Comparar Medellin ETC vs otras ciudades principales (Bogota, Cali, Barranquilla)

---

## Licencia

MIT

---

Desarrollado por [Cristian Espinal](https://github.com/Cespial) para [Tensor](https://tensor.com.co)
