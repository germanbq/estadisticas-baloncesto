# Importadores históricos de datos reales mediante nba_api

Esta carpeta conserva scripts de una fase anterior del proyecto para consultar
datos reales mediante la biblioteca Python `nba_api` e importarlos en PostgreSQL.
Se mantienen como referencia técnica y educativa: **no forman parte del flujo de
datos utilizado por la aplicación actual ni deben ejecutarse para prepararla o
actualizarla**.

## Qué hace cada script

- `import_nba.py`: consulta información de equipos, plantillas y jugadores;
  prepara su importación, revisa imágenes locales y genera un informe.
- `import_games.py`: consulta el calendario y los datos de partidos, incluidos
  resultados y estadísticas reales de jugadores y equipos, para completar las
  tablas correspondientes.

Estos programas pueden escribir en una base de datos. Su conservación en el
repositorio no implica que los datos que descargan se utilicen en la aplicación.

## Por qué no se utilizan

El proyecto decidió no utilizar estos importadores de estadísticas reales por
cuestiones de derechos y condiciones de uso de las fuentes. Poder acceder a datos
mediante una biblioteca no acredita por sí mismo una autorización para publicarlos
o redistribuirlos. Conservar el código tampoco concede permisos sobre los datos,
las imágenes o las marcas de terceros.

Esta es una explicación de la decisión y del alcance del proyecto, no una
afirmación de que cualquier uso de `nba_api` esté prohibido ni una licencia para
reutilizar sus respuestas. Una eventual reutilización de estos scripts requeriría
revisar las condiciones y los permisos aplicables al uso concreto.

## Modelo de datos de la aplicación actual

La explicación pública se encuentra en la página
[Fuentes y licencias](../../../../src/app/fuentesLicencias/page.tsx), accesible
desde el footer en `/fuentesLicencias`:

- Los datos de referencia de equipos, las fichas de jugadores y el calendario
  proceden de BALLDONTLIE, según lo documentado en esa página.
- La participación de los jugadores, los minutos, los marcadores y las
  estadísticas se simulan para demostrar el funcionamiento de la aplicación.
- Las clasificaciones, los acumulados, los promedios y los rankings derivados de
  esos resultados también son ficticios. No representan rendimiento real ni
  predicciones, convocatorias o lesiones reales.

Este modelo distingue la información de referencia real de las cifras simuladas;
no presenta toda la información de la aplicación como ficticia ni utiliza estos
scripts como fuente del calendario actual.

## Relación con el footer y los créditos

El [footer](../../../../src/components/Footer.tsx) identifica el proyecto como
independiente y no afiliado, patrocinado ni respaldado por la NBA, sus equipos o
sus jugadores. Los nombres y marcas se mencionan con fines de identificación y
referencia; los iconos de los equipos son diseños propios, no logotipos oficiales.

Las fotografías tienen una procedencia y unas condiciones independientes de los
datos deportivos. Sus autores, fuentes, licencias y modificaciones se documentan
en [CREDITOS_FOTOGRAFIAS.md](../../../../CREDITOS_FOTOGRAFIAS.md). No debe deducirse
una licencia sobre fotos o marcas a partir del acceso a una API. La página de
fuentes y licencias también recoge el contacto para correcciones y comunicaciones
sobre derechos.

## Rutas y compatibilidad del archivo histórico

Tras mover los scripts a esta carpeta, ambos resuelven la raíz del repositorio
con `Path(__file__).resolve().parents[3]`, independientemente del directorio desde
el que se invoquen. Sus valores predeterminados son:

| Recurso | Ubicación |
| --- | --- |
| Variables de entorno | `.env.local` en la raíz |
| Caché de equipos y jugadores | `.nba-import-cache/` en la raíz |
| Caché de partidos | `.nba-games-cache/` en la raíz |
| Imágenes locales | `public/` y `public/players/` |
| Informes JSON | Esta carpeta; ignorados por Git |

Los argumentos explícitos como `--env-file`, `--cache-dir` y `--report` conservan
su comportamiento: una ruta relativa proporcionada por el usuario se interpreta
desde su directorio de ejecución.

**Corregir las rutas no los hace compatibles con el esquema actual.** Los
importadores conservan referencias a `nba_id`, mientras el esquema actual utiliza
`balldontlie_id`. Los identificadores de ambos proveedores no son intercambiables.
Los scripts no son migraciones ni un procedimiento de instalación de la aplicación;
no se han ejecutado ni se han importado datos reales al realizar esta reorganización.
