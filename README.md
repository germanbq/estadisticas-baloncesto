# Stats · Estadísticas de baloncesto

Aplicación web **full stack** para consultar estadísticas de la NBA, explorar jugadores y equipos, comparar sus datos y guardar favoritos personales.

Desarrollada con **Next.js, React y TypeScript**, con un backend organizado por capas, autenticación mediante **Clerk** y persistencia en **PostgreSQL** mediante consultas SQL directas.

**Estado:** proyecto en desarrollo. La versión actual utiliza datos de ejemplo cargados desde [`database/seed.sql`](./database/seed.sql); todavía no existe una integración automática con una fuente externa de estadísticas.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Decisiones técnicas](#decisiones-técnicas)
- [Base de datos](#base-de-datos)
- [API HTTP](#api-http)
- [Instalación local](#instalación-local)
- [Comandos](#comandos)
- [Estado y próximos pasos](#estado-y-próximos-pasos)
- [Recursos gráficos y propiedad intelectual](#recursos-gráficos-y-propiedad-intelectual)
- [Créditos de las fotografías](#créditos-de-las-fotografías)

## Funcionalidades

- **Partidos por fecha:** navegación entre días, número de encuentros y acceso a la ficha de cada partido.
- **Clasificación por conferencias:** victorias, derrotas, porcentaje de victorias, diferencia media de puntos y rachas.
- **Buscador de jugadores:** búsqueda por nombre con filtros por posición y conferencia.
- **Líderes estadísticos:** clasificación por puntos, rebotes, asistencias, robos, tapones y porcentajes de tiro.
- **Fichas de jugadores:** información personal, estadísticas por temporada y últimos partidos.
- **Fichas de equipos:** información general, posición en la conferencia y estadísticas de sus jugadores.
- **Comparación previa al partido:** rendimiento de los equipos, enfrentamientos directos, últimos resultados y líderes estadísticos.
- **Partidos finalizados:** marcador por periodos, estadísticas individuales y colectivas y selección del MVP mediante una fórmula propia.
- **Favoritos personales:** jugadores, equipos y partidos asociados a cada usuario autenticado.
- **Interfaz adaptable:** estilos para distintos tamaños de pantalla, tablas con desplazamiento y estados de carga mediante skeletons.

## Tecnologías

| Área | Tecnología | Uso |
| --- | --- | --- |
| Lenguaje principal | TypeScript 5 y TSX | Tipado del frontend y backend, modelos y contratos entre capas |
| Interfaz | React 19 | Componentes reutilizables, composición, hooks y estado local |
| Framework full stack | Next.js 16 con App Router | Páginas, layouts, rutas dinámicas, componentes de servidor y Route Handlers |
| Entorno del servidor | Node.js | Ejecución del backend integrado en Next.js |
| Marcado y estilos | HTML mediante JSX, CSS Modules y Tailwind CSS 4 | Estructura semántica, estilos por componente y clases de utilidad |
| Base de datos | PostgreSQL | Almacenamiento relacional de entidades, estadísticas y favoritos |
| Lenguajes de base de datos | SQL y PL/pgSQL | Consultas, funciones y triggers |
| Acceso a datos | `pg` —node-postgres— | Consultas SQL directas y pool de conexiones, sin ORM |
| Autenticación | Clerk | Inicio de sesión, identificación del usuario y acceso a favoritos |
| Iconografía | Lucide React | Iconos de navegación, métricas y acciones |


Las versiones concretas se encuentran en [`package.json`](./package.json) y [`package-lock.json`](./package-lock.json). TypeScript utiliza la opción `strict` en [`tsconfig.json`](./tsconfig.json).

## Arquitectura

La aplicación reúne frontend y backend en un único proyecto Next.js. El backend se organiza por capas y cubre cuatro áreas funcionales: partidos, jugadores, equipos y favoritos.

| Ubicación | Responsabilidad |
| --- | --- |
| [`src/app`](./src/app) | Páginas, layouts y rutas dinámicas de la aplicación |
| [`src/app/api`](./src/app/api) | Endpoints HTTP: lectura de parámetros y delegación en los controladores |
| [`src/components`](./src/components) | Componentes de interfaz, tarjetas, filtros, tablas y skeletons |
| [`src/backend/controllers`](./src/backend/controllers) | Validación de entradas, comprobaciones de autenticación y respuestas HTTP |
| [`src/backend/services`](./src/backend/services) | Aplica las reglas de negocio y coordina las operaciones de la aplicación |
| [`src/backend/repositories`](./src/backend/repositories) | Acceso a datos mediante contratos y coordinación de la ejecución de consultas |
| [`src/backend/queries`](./src/backend/queries) | Construcción de las sentencias SQL y sus parámetros |
| [`src/backend/interfaces`](./src/backend/interfaces) | Contratos de repositorios y constructores de consultas |
| [`src/backend/entities`](./src/backend/entities) | Tipos de datos de jugadores, equipos, partidos y favoritos |
| [`src/backend/containers`](./src/backend/containers) | Creación y conexión manual de las dependencias |
| [`src/backend/shared`](./src/backend/shared) | Pool de PostgreSQL, ejecutor de consultas y contratos SQL compartidos |
| [`src/backend/rules`](./src/backend/rules) | Constantes de configuración de las consultas y reglas de negocio la aplicación |
| [`database`](./database) | Esquema relacional, funciones, triggers y datos de ejemplo |

### Patrones y principios aplicados

- **Repository Pattern:** los servicios acceden a los datos a través de interfaces de repositorio.
- **Service Layer:** la configuración y las reglas de la aplicación se separan de la gestión de peticiones HTTP.
- **Inyección de dependencias por constructor:** cada clase recibe los colaboradores que necesita.
- **Programación orientada a objetos:** controladores, servicios, repositorios y constructores de consultas se implementan con clases.
- **Separación de responsabilidades:** construir SQL, ejecutarlo, aplicar reglas y responder al cliente corresponden a piezas distintas.
- **Inversión de dependencias:** los servicios dependen de contratos de repositorio, y los repositorios utilizan la abstracción `IQueryExecutor` para ejecutar SQL.

Por ejemplo, [`GamesContainer.ts`](./src/backend/containers/GamesContainer.ts) construye el ejecutor de PostgreSQL, las consultas, el repositorio, el servicio y el controlador de partidos. El ejecutor concreto [`PostgresQueryExecutor`](./src/backend/shared/PostgresQueryExecutor.ts) implementa el contrato `IQueryExecutor`.

Hay dos formas de consumir el backend: las páginas de servidor pueden llamar directamente a los controladores, mientras que los componentes interactivos del navegador utilizan los endpoints de `src/app/api`. Ambas vías reutilizan las mismas capas de acceso a datos.

## Decisiones técnicas

### Frontend y operaciones asíncronas

| Técnica | Aplicación en el proyecto |
| --- | --- |
| Componentes de servidor y cliente | Fichas cargadas desde componentes de servidor e interactividad mediante componentes con `"use client"` |
| Composición y reutilización | Componentes compartidos como `FavoriteButton`, `GameCard`, `FilterButton` y `SingleStat` |
| Estado reflejado en la URL | Parámetros para fechas, búsquedas, conferencias, métricas y filtros |
| Debounce | Espera de 300 ms antes de trasladar el texto de búsqueda a la URL |
| Cancelación de peticiones | `AbortController` al cambiar dependencias o desmontar componentes |
| Consultas en paralelo | `Promise.all` para solicitar datos independientes de jugadores y partidos |
| Control de peticiones duplicadas | Bloqueo del botón de favorito mientras se procesa una operación |
| Estados de carga | Skeletons y un archivo `loading.tsx` para la ficha de jugador |
| Diseño adaptable | Flexbox, Grid, media queries y contenedores con desplazamiento horizontal |
| Medidas de accesibilidad | Elementos semánticos, etiquetas ARIA, estados seleccionados, indicación de carga y estilos de foco visible |

### Autenticación y gestión de favoritos

Clerk gestiona la autenticación y proporciona la identidad del usuario. Los controladores obtienen el `userId` en el servidor; las operaciones de favoritos utilizan esa identidad para consultar o modificar únicamente los registros del usuario autenticado.

La página de favoritos comprueba la sesión desde su layout. Los endpoints de favoritos devuelven `401` cuando no existe una sesión válida. La interfaz también permite abrir el inicio de sesión al intentar guardar un favorito sin haberse autenticado.

### Validación y respuestas HTTP

Los controladores comprueban identificadores y valores permitidos para métricas, posiciones y conferencias. La API devuelve resultados en JSON, códigos de estado según la operación y mensajes de error para entradas inválidas, falta de autenticación o fallos del servidor.

## Base de datos

### Modelo relacional

| Tabla | Contenido |
| --- | --- |
| `teams` | Información de los equipos |
| `players` | Información de los jugadores y su equipo actual |
| `games` | Equipos participantes, fecha, estado, resultado y marcadores por periodo |
| `player_game_stats` | Estadísticas de cada jugador en cada partido y equipo con el que lo disputó |
| `team_game_stats` | Estadísticas colectivas de cada equipo en cada partido |
| `player_season_stats` | Totales acumulados de cada jugador por temporada |
| `team_season_stats` | Totales acumulados de cada equipo por temporada |
| `favorite_players`, `favorite_teams`, `favorite_games` | Relación entre el identificador de usuario de Clerk y sus favoritos |

El esquema utiliza claves primarias y foráneas, claves compuestas, restricciones `UNIQUE` y comprobaciones `CHECK`. Estas últimas validan, entre otras condiciones, valores no negativos, coherencia entre rebotes y consistencia de los marcadores de los partidos finalizados.

Las fechas se almacenan como `TIMESTAMPTZ`. Los filtros de partidos por día calculan el intervalo correspondiente a la zona `Europe/Madrid`. Los marcadores por periodo se representan mediante arrays `SMALLINT[]`.

### Consultas y cálculos

- **SQL directo y parametrizado:** los valores se envían mediante parámetros de `pg`. Las métricas utilizadas para construir expresiones SQL se restringen a una lista permitida en el controlador.
- **Construcción de JSON:** `jsonb_agg` y `jsonb_build_object` agrupan las temporadas de un jugador en el resultado de su ficha.
- **Tratamiento de valores ausentes:** `COALESCE` y `NULLIF` permiten calcular promedios y porcentajes evitando divisiones por cero.
- **Calendario:** `generate_series` genera el conjunto de días utilizado para contar los partidos de fechas próximas.
- **Métricas derivadas:** promedios por partido, porcentajes de tiro, porcentaje de victorias, diferencia media de puntos y net rating se calculan a partir de los datos almacenados.
- **MVP del partido:** una puntuación ponderada implementada en [`GamesQueries.ts`](./src/backend/queries/GamesQueries.ts) combina estadísticas individuales. Los empates se resuelven por puntos y después por identificador del jugador. Es un criterio propio de la aplicación.

### Funciones y triggers

| Automatización | Evento |
| --- | --- |
| Validar que el equipo de una estadística individual participa en el partido | Antes de insertar o actualizar `player_game_stats` |
| Acumular victorias, derrotas, puntos y rachas de los equipos | Al insertar un partido finalizado o cambiar su estado de pendiente a finalizado |
| Acumular posesiones propias y del rival | Al insertar estadísticas en `team_game_stats` |
| Acumular estadísticas y partidos jugados de un jugador | Al insertar estadísticas en `player_game_stats` |

Las funciones de acumulación utilizan `INSERT ... ON CONFLICT DO UPDATE`. Esta automatización cubre los eventos indicados; las correcciones o eliminaciones posteriores de estadísticas requieren un tratamiento específico de los acumulados.

Archivos de referencia: [`schema.sql`](./database/schema.sql), [`triggers.sql`](./database/triggers.sql) y [`seed.sql`](./database/seed.sql). El seed se ejecuta dentro de una transacción `BEGIN` / `COMMIT`.

## API HTTP

Los Route Handlers de Next.js exponen los siguientes endpoints:

| Método | Ruta | Parámetros | Función |
| --- | --- | --- | --- |
| `GET` | `/api/partidos/listado` | `date` | Partidos de una fecha |
| `GET` | `/api/partidos/numero` | `date` | Número de partidos para los cinco días centrados en la fecha |
| `GET` | `/api/clasificacion` | `conf` | Clasificación de una conferencia |
| `GET` | `/api/jugadores/lideres` | `metric` | Líderes de una métrica |
| `GET` | `/api/jugadores/buscador` | `search`, `pos`, `conf` | Búsqueda filtrada de jugadores |
| `GET` | `/api/favoritos/numero` | — | Recuento de favoritos por tipo |
| `GET`, `POST`, `DELETE` | `/api/favoritos/jugadores` | `itemId` en altas y bajas | Consultar, añadir o eliminar jugadores favoritos |
| `GET`, `POST`, `DELETE` | `/api/favoritos/equipos` | `itemId` en altas y bajas | Consultar, añadir o eliminar equipos favoritos |
| `GET`, `POST`, `DELETE` | `/api/favoritos/partidos` | `itemId` en altas y bajas | Consultar, añadir o eliminar partidos favoritos |

Los parámetros se envían en la query string. `date` utiliza el formato `YYYY-MM-DD`. En clasificación, `conf` admite `East` y `West`; el buscador también admite `BOTH`. Las posiciones son `PG`, `SG`, `SF`, `PF`, `C` y `ALL`.

Las métricas admitidas son `points`, `rebounds`, `assists`, `steals`, `blocks`, `fg_percentage` y `three_percentage`.

Las lecturas correctas devuelven `{ "data": ... }`. Las altas y bajas de favoritos devuelven `204` sin cuerpo cuando se completan. Las rutas de favoritos requieren autenticación.

## Instalación y ejecución

Requisitos: Node.js 20.9 o superior, PostgreSQL y una aplicación de Clerk.

### 1. Clonar e instalar

```bash
git clone https://github.com/germanbq/estadisticas-baloncesto.git
cd estadisticas-baloncesto
npm ci
```

### 2. Configurar el entorno

Crea `.env.local` en la raíz y sustituye los valores por los tuyos. `tu_nombre_bd` representa el nombre que elijas para la base de datos:

```dotenv
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/tu_nombre_bd
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
CLERK_SECRET_KEY=TU_CLAVE_SECRETA
```

### 3. Inicializar la base de datos

Sustituye `tu_nombre_bd` por el mismo nombre utilizado en `.env.local` y `postgres` por tu usuario de PostgreSQL. Ejecuta en este orden:

```bash
createdb -h localhost -U postgres tu_nombre_bd
psql -h localhost -U postgres -d tu_nombre_bd -f database/schema.sql
psql -h localhost -U postgres -d tu_nombre_bd -f database/triggers.sql
psql -h localhost -U postgres -d tu_nombre_bd -f database/seed.sql
```

Utiliza una base de datos de desarrollo: `schema.sql` elimina las tablas existentes.

### 4. Iniciar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Iniciar el servidor de desarrollo |
| `npm run build` | Generar la compilación de producción |
| `npm start` | Iniciar el servidor con una compilación de producción ya generada |
| `npm run lint` | Ejecutar ESLint |
| `npx tsc --noEmit` | Comprobar los tipos de TypeScript sin emitir archivos |

El análisis estático se apoya en TypeScript estricto y ESLint. El repositorio todavía no incluye una suite de pruebas automatizadas.

## Estado y próximos pasos

La aplicación dispone de las funcionalidades descritas y trabaja con datos de ejemplo. La configuración actual se orienta al desarrollo local.

Próximos pasos:

- Integrar una fuente externa de datos y automatizar su actualización.
- Incorporar pruebas unitarias, de integración y de los flujos completos de usuario.
- Preparar el despliegue de la aplicación en Vercel y de PostgreSQL en Supabase.
- Desarrollar una versión móvil con React Native.

## Recursos gráficos y propiedad intelectual

Este proyecto es independiente y no está afiliado, patrocinado ni respaldado por la NBA, sus equipos o sus jugadores.

Las fotografías de public/players/, así como otras imágenes de terceros, pertenecen a sus respectivos titulares. No se reivindica su autoría. Las fotografías se pueden reutilizar conforme a sus licencias individuales, documentadas en los créditos; las insignias tienen declaración CC0. Las versiones adaptadas de fotografías CC BY-SA se distribuyen bajo la licencia indicada para cada imagen. Estas licencias de los recursos gráficos son independientes de la licencia del código.

Cualquier licencia del código de este proyecto excluye estos recursos gráficos. Su conversión a WebP no cambia sus derechos de propiedad intelectual.

La procedencia, autoría y condiciones de uso de cada recurso deben verificarse antes de su publicación o redistribución.

## Créditos de las fotografías

Los autores, fuentes y licencias de las imágenes están disponibles
en [Créditos de las fotografías](./CREDITOS_FOTOGRAFIAS.md).

## Avisos de datos ficticios

La interfaz identifica los resultados y estadísticas como datos ficticios mediante un aviso general y botones en las tarjetas, tablas y comparativas. Al pulsarlos se abre una explicación de la finalidad educativa, la ausencia de monetización y la independencia del proyecto. El diálogo también se cierra con Escape y devuelve el foco al botón que lo abrió.

Estos avisos describen una demo con datos de ejemplo: **no transforman ni sustituyen los datos de PostgreSQL**. Antes de publicar la demo, comprueba que la base de datos usada por ese despliegue contenga únicamente estadísticas ficticias. No utilices los scripts de importación de estadísticas reales para alimentar esa demo.
