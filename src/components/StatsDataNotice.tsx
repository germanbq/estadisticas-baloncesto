"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, X } from "lucide-react";
import styles from "./StatsDataNotice.module.css";

export default function StatsDataNotice({ context }: { context?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;

    useEffect(() => {
        if (isOpen && !dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    }, [isOpen]);

    function closeDialog() {
        dialogRef.current?.close();
    }

    return (
        <>
            <button
                type="button"
                className={styles.notice}
                aria-label={`Información sobre los datos ficticios${context ? `: ${context}` : ""}`}
                aria-haspopup="dialog"
                onClick={() => setIsOpen(true)}
            >
                <CircleAlert size={17} aria-hidden="true" />
                <span>Datos ficticios</span>
            </button>
            {isOpen && createPortal(
                <dialog
                    ref={dialogRef}
                    className={styles.dialog}
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    onClose={() => setIsOpen(false)}
                    onClick={(event) => {
                        if (event.target !== event.currentTarget) return;
                        const bounds = event.currentTarget.getBoundingClientRect();
                        if (event.clientX < bounds.left || event.clientX > bounds.right ||
                            event.clientY < bounds.top || event.clientY > bounds.bottom) {
                            closeDialog();
                        }
                    }}
                >
                    <div className={styles.heading}>
                        <h2 id={titleId}>Estadísticas de demostración</h2>
                        <button type="button" className={styles.close} aria-label="Cerrar aviso de datos ficticios" onClick={closeDialog}>
                            <X size={22} aria-hidden="true" />
                        </button>
                    </div>
                    <p id={descriptionId}>
                        Los resultados, clasificaciones y estadísticas de esta demo son ficticios.
                        No representan partidos ni el rendimiento real de los jugadores o equipos.
                    </p>
                    <p>
                        Los nombres reales se utilizan como referencias dentro de una demostración
                        educativa para portfolio y currículum, sin monetización.
                    </p>
                    <p>
                        Este proyecto no está afiliado, patrocinado ni respaldado por la NBA,
                        sus equipos o sus jugadores.
                    </p>
                    <button type="button" className={styles.confirm} onClick={closeDialog}>Entendido</button>
                </dialog>,
                document.body,
            )}
        </>
    );
}
