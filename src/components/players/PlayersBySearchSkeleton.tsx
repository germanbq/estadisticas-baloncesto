import cardStyles from "./PlayersBySearch.module.css";
import statStyles from "../SingleStat.module.css";
import styles from "./PlayersBySearchSkeleton.module.css";

export default function PlayersBySearchSkeleton() {
    return (
        <section className={cardStyles.section} role="status" aria-label="Cargando jugadores">
            {[0, 1, 2].map((card) => (
                <article key={card} className={cardStyles.card} aria-hidden="true">
                    <div className={cardStyles.articleHeader}>
                        <div className={cardStyles.information}>
                            <div className={`${styles.skeleton} ${styles.photo}`} />
                            <div className={cardStyles.personalInformation}>
                                <div className={`${styles.skeleton} ${styles.name}`} />
                                <div className={`${styles.skeleton} ${styles.team}`} />
                            </div>
                        </div>
                        <div className={`${styles.skeleton} ${styles.profileLink}`} />
                    </div>
                    <dl className={cardStyles.statsContainer}>
                        {["PTS", "REB", "AST", "STL", "BLK"].map((stat) => (
                            <div key={stat} className={statStyles.stat}>
                                <dt className={`${styles.skeleton} ${styles.label}`} />
                                <dd className={`${styles.skeleton} ${styles.value}`} />
                            </div>
                        ))}
                    </dl>
                </article>
            ))}
        </section>
    );
}
