import styles from './GamesSkeleton.module.css';
import DateButtonsSkeleton from './DateButtonsSkeleton';
import listStyles from '../app/Games.module.css';
import favoriteStyles from '../favorites/FavoriteGames.module.css';

export default function GamesSkeleton({showDates = false, variant = "default"}: {
    showDates?: boolean;
    variant?: "default" | "favorites";
}) {
    return (
        <div role="status" aria-label="Cargando partidos" aria-busy="true">
            {showDates && <DateButtonsSkeleton />}
            <div className={variant === "favorites" ? `${styles.games} ${styles.favorites}` : listStyles.container} aria-hidden="true">
                {Array.from({length: 3}, (_, index) => (
                    <div className={variant === "favorites" ? favoriteStyles.cardContainer : listStyles.cardContainer} key={index}>
                        <div className={styles.card}>
                            <div className={styles.header}>
                                <div className={`${styles.skeleton} ${styles.label}`} />
                                <div className={`${styles.skeleton} ${styles.stadium}`} />
                                <div className={`${styles.skeleton} ${styles.favorite}`} />
                            </div>
                            <div className={styles.teams}>
                                {[0, 1].map((side) => (
                                    <div className={styles.team} key={side}>
                                        <div className={`${styles.skeleton} ${styles.logo}`} />
                                        <div className={`${styles.skeleton} ${styles.name}`} />
                                        <div className={`${styles.skeleton} ${styles.record}`} />
                                        <div className={`${styles.skeleton} ${styles.score}`} />
                                </div>
                            ))}
                            <div className={`${styles.skeleton} ${styles.versus}`} />
                        </div>
                    </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
