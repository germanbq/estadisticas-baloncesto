import cardStyles from "./FavoriteTeams.module.css";
import statStyles from "../SingleStat.module.css";
import styles from "./FavoriteTeamsSkeleton.module.css";

export default function FavoriteTeamsSkeleton() {
    return (
        <section className={cardStyles.section} role="status" aria-label="Cargando equipos favoritos" aria-busy="true">
            {[0, 1, 2].map((card) => (
                <article key={card} className={cardStyles.article} aria-hidden="true">
                    <div className={cardStyles.articleHeader}>
                        <div className={cardStyles.information}>
                            <div className={`${styles.skeleton} ${styles.logo}`} />
                            <div className={cardStyles.spans}>
                                <div className={`${styles.skeleton} ${styles.name}`} />
                                <div className={cardStyles.badges}>
                                    <div className={`${styles.skeleton} ${styles.record}`} />
                                    <div className={`${styles.skeleton} ${styles.streak}`} />
                                </div>
                            </div>
                        </div>
                        <div className={`${styles.skeleton} ${styles.profileLink}`} />
                    </div>
                    <div className={cardStyles.statsContainer}>
                        {[0, 1, 2, 3, 4, 5].map((stat) => (
                            <div key={stat} className={`${statStyles.stat} ${styles.stat}`}>
                                <div className={`${styles.skeleton} ${styles.label}`} />
                                <div className={`${styles.skeleton} ${styles.value}`} />
                            </div>
                        ))}
                    </div>
                    <div className={cardStyles.favorite}>
                        <div className={`${styles.skeleton} ${styles.favorite}`} />
                    </div>
                </article>
            ))}
        </section>
    );
}
