import styles from '../app/DateButtons.module.css';

export default function DateButtonsSkeleton() {
    return (
        <section className={styles.buttonsContainer} role="status" aria-label="Cargando fechas" aria-busy="true">
            <div className={`${styles.chevron} ${styles.placeholder}`} aria-hidden="true" />
            {Array.from({length: 5}, (_, index) => (
                <div key={index} className={`${styles.button} ${styles.loadingButton}`} aria-hidden="true">
                    <span className={styles.placeholder}>Mes, día</span>
                    <span className={`${styles.date} ${styles.placeholder}`}>00</span>
                    <span className={styles.placeholder}>0 partidos</span>
                </div>
            ))}
            <div className={`${styles.chevron} ${styles.placeholder}`} aria-hidden="true" />
        </section>
    );
}
