"use client";

import { useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import styles from "./SimulatedStats.module.css";

export default function SimulatedStats() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    return (
        <>
            <button
                type="button"
                className={styles.span}
                aria-haspopup="dialog"
                onClick={() => dialogRef.current?.showModal()}
            >
                Estadísticas simuladas
                <TriangleAlert size={16} aria-hidden="true" />
            </button>

            <dialog ref={dialogRef} className={styles.modal} aria-labelledby={titleId} aria-describedby={descriptionId}
                onClick={(event) => {
                    if (event.target !== event.currentTarget) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    if (event.clientX < bounds.left || event.clientX > bounds.right ||
                        event.clientY < bounds.top || event.clientY > bounds.bottom) {
                        event.currentTarget.close();
                    }
                }}
            >
                <h2 id={titleId} className={styles.title}>Estadísticas simuladas</h2>
                <p id={descriptionId} className={styles.description}>
                    Solo las estadísticas de los partidos y los datos derivados de ellas,
                    como los promedios de temporada de equipos y jugadores, se han generado
                    mediante una simulación y no corresponden a estadísticas reales.
                </p>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={() => dialogRef.current?.close()}
                >
                    Cerrar
                </button>
            </dialog>
        </>
    )
}
