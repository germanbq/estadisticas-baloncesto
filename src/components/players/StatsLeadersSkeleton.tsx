import styles from "./StatsLeadersSkeleton.module.css";

export default function StatsLeadersSkeleton() {
  return (
    <div
      className={styles.podium}
      role="status"
      aria-label="Cargando mejores jugadores"
    >
      {[1, 2, 3].map((position) => (
        <div
          key={position}
          className={`${styles.card} ${styles[`position${position}`]}`}
          aria-hidden="true"
        >
          <div className={`${styles.skeleton} ${styles.rank}`} />
          <div className={`${styles.skeleton} ${styles.photo}`} />
          <div className={`${styles.skeleton} ${styles.name}`} />
          <div className={styles.teamAndJersey}>
            <div className={`${styles.skeleton} ${styles.team}`} />
            <div className={`${styles.skeleton} ${styles.jersey}`} />
          </div>

          <div className={styles.metric}>
            <div className={`${styles.skeleton} ${styles.value}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
