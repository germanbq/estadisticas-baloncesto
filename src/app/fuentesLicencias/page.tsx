import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

const CONTACT_EMAIL = "gerbq2004@gmail.com";
const PHOTO_CREDITS_URL =
    "https://github.com/germanbq/estadisticas-baloncesto/blob/main/CREDITOS_FOTOGRAFIAS.md";

export const metadata: Metadata = {
    title: "Fuentes y licencias | Stats",
    description:
        "Procedencia de los datos de referencia, alcance de la simulación, créditos de las fotografías y contacto sobre derechos.",
};

export default function SourcesAndLicensesPage() {
    return (
        <main lang="es" className={styles.container}>
            <article aria-labelledby="fuentes-titulo">
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>
                        Volver a los partidos
                    </Link>
                    <h1 id="fuentes-titulo">Fuentes y licencias</h1>
                    <p className={styles.updated}>
                        Última actualización: <time dateTime="2026-10-29">29 de octubre de 2026</time>.
                    </p>
                    <p>
                        Stats es un proyecto educativo e independiente que combina
                        información de referencia sobre baloncesto con resultados
                        y estadísticas generados para demostrar el funcionamiento
                        de la aplicación.
                    </p>
                </header>

                <aside className={styles.notice} aria-labelledby="simulacion-titulo">
                    <h2 id="simulacion-titulo">Esta aplicación contiene datos ficticios</h2>
                    <p>
                        El calendario y las fichas utilizan datos reales de
                        referencia. <strong>La participación de jugadores, los
                        resultados y las estadísticas son simulados.</strong> Las
                        clasificaciones, los promedios y los demás indicadores
                        calculados a partir de ellos también son ficticios.
                    </p>
                </aside>

                <section className={styles.section} aria-labelledby="datos-titulo">
                    <h2 id="datos-titulo">1. Qué información es real y cuál se simula</h2>
                    <div className={styles.dataGrid}>
                        <div className={styles.dataCard}>
                            <h3>Datos de referencia</h3>
                            <ul>
                                <li>Nombres e información básica de equipos.</li>
                                <li>Fichas de jugadores y sus campos disponibles.</li>
                                <li>Calendario: fechas, horarios y equipos enfrentados.</li>
                            </ul>
                        </div>
                        <div className={styles.dataCard}>
                            <h3>Datos simulados</h3>
                            <ul>
                                <li>Selección de participantes y minutos disputados.</li>
                                <li>Marcadores y estadísticas de jugadores y equipos.</li>
                                <li>Clasificaciones, acumulados, promedios y rankings.</li>
                            </ul>
                        </div>
                    </div>
                    <p>
                        La participación simulada no acredita convocatorias,
                        lesiones ni la composición real de una plantilla en la
                        fecha del partido. Las cifras generadas no describen el
                        rendimiento real de los jugadores o equipos ni constituyen
                        una predicción de resultados.
                    </p>
                </section>

                <section className={styles.section} aria-labelledby="proveedor-titulo">
                    <h2 id="proveedor-titulo">2. Fuente del calendario y de las fichas</h2>
                    <p>
                        Los datos de referencia de equipos, jugadores y calendario
                        se obtienen de <a href="https://www.balldontlie.io/">BALLDONTLIE</a>.
                        Puedes consultar su <a href="https://docs.balldontlie.io/">documentación</a>{" "}
                        y sus <a href="https://www.balldontlie.io/terms.html">condiciones de uso</a>.
                    </p>
                    <p>
                        Sus condiciones permiten almacenar y mostrar en una
                        aplicación propia los datos obtenidos legítimamente,
                        dentro de su alcance. Ese permiso no supone una licencia
                        general sobre fotografías, marcas u otros derechos de
                        terceros, ni convierte estos datos en información oficial
                        de la NBA.
                    </p>
                    <p>
                        Los datos de referencia pueden contener errores o quedar
                        desactualizados. Los horarios y enfrentamientos pueden
                        cambiar; para organizar una visita a un partido, confirma
                        la información con el organizador.
                    </p>
                </section>

                <section className={styles.section} aria-labelledby="fotografias-titulo">
                    <h2 id="fotografias-titulo">3. Fotografías y atribuciones</h2>
                    <p>
                        Las fotografías de jugadores son obras de sus respectivos
                        autores. El documento de <a href={PHOTO_CREDITS_URL}>créditos de las fotografías</a>{" "}
                        identifica, para cada imagen, su autor, fuente, licencia
                        y las modificaciones realizadas, incluida la preparación
                        de las versiones WebP.
                    </p>
                    <p>
                        Cada fotografía conserva la licencia indicada en su
                        entrada; no se ofrece una licencia única para todas las
                        imágenes. Para reutilizar una fotografía, consulta su
                        ficha y las condiciones de esa licencia.
                    </p>
                    <p>
                        Las fotografías pueden corresponder a otras temporadas y
                        mostrar camisetas de equipos anteriores. No acreditan el
                        equipo actual ni la participación del jugador en un
                        encuentro concreto.
                    </p>
                </section>

                <section className={styles.section} aria-labelledby="marcas-titulo">
                    <h2 id="marcas-titulo">4. Nombres, marcas e iconos</h2>
                    <p>
                        Stats no está afiliado, patrocinado ni respaldado por la
                        NBA, sus equipos, sus jugadores o BALLDONTLIE. Los nombres
                        y las marcas mencionados pertenecen a sus respectivos
                        titulares y se utilizan con fines de identificación y
                        referencia.
                    </p>
                    <p>
                        Los iconos que representan a los equipos son diseños
                        propios del proyecto y no son sus logotipos oficiales.
                        La aparición de nombres o fotografías no implica el
                        respaldo de sus titulares al proyecto o a la simulación.
                    </p>
                </section>

                <section className={styles.section} aria-labelledby="contacto-titulo">
                    <h2 id="contacto-titulo">5. Correcciones y comunicaciones sobre derechos</h2>
                    <p>
                        Si detectas un error de atribución o consideras que algún
                        contenido afecta a tus derechos, puedes escribir a{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                    </p>
                    <p>
                        Incluye la dirección de la página afectada, el contenido
                        concreto, una explicación de la incidencia y, cuando
                        corresponda, la fuente o documentación que permita
                        comprobarla. No es necesario adjuntar documentos de
                        identidad para una primera comunicación.
                    </p>
                    <p>
                        La comunicación se revisará y, cuando proceda, se corregirá
                        o retirará el contenido afectado. Consulta la{" "}
                        <Link href="/privacidad">política de privacidad</Link>{" "}
                        para conocer el tratamiento de los datos que facilites
                        al contactar.
                    </p>
                </section>
            </article>
        </main>
    );
}
