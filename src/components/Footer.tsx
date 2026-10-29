import Link from "next/link";
import styles from "./Footer.module.css";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className={styles.container}>
            <div className={styles.description}>
                <Image src="/logo.webp" alt="Logo del footer" width={60} height={60}/>
                <span>Explora jugadores, equipos y partidos de la NBA con resultados y estadísticas simulados.</span>
            </div>
            <div className={styles.links}>
                <a href="https://github.com/germanbq/estadisticas-baloncesto" target="_blank" rel="noopener noreferrer">Github</a>
                <Link href="/privacidad">Privacidad</Link>
                <Link href="/fuentesLicencias">Fuentes y licencias</Link>
                <a href="https://github.com/germanbq/estadisticas-baloncesto/blob/main/CREDITOS_FOTOGRAFIAS.md" target="_blank" rel="noopener noreferrer">Créditos de las fotografías</a>
            </div>
            <span className={styles.warning}>Datos simulados. Los marcadores, las participaciones de jugadores, las estadísticas, las clasificaciones y los promedios son ficticios y se generan con fines demostrativos. El calendario y las fichas utilizan información de referencia real. Consulta «Fuentes y licencias» para conocer su procedencia.</span>
            <span className={styles.warning}>Proyecto independiente, no afiliado, patrocinado ni respaldado por la NBA, sus equipos o sus jugadores. Las marcas mencionadas pertenecen a sus respectivos titulares y se utilizan únicamente con fines de identificación y referencia. Los iconos que representan a los equipos son diseños propios y no son sus logotipos oficiales.</span>
        </footer>
    )
}