import styles from "./loading.module.css";

const mainStats = Array.from({ length: 4 });
const percentageStats = Array.from({ length: 2 });
const tableColumns = Array.from({ length: 9 });
const tableRows = Array.from({ length: 4 });

export default function Loading() {
  return (
    <main className={styles.page}>
        <section className={styles.profileCard}>
            <div className={`${styles.skeleton} ${styles.avatar}`} />
            <div className={styles.badges}>
                <div className={`${styles.skeleton} ${styles.teamBadge}`} />
                <div className={`${styles.skeleton} ${styles.numberBadge}`} />
            </div>

            <div className={`${styles.skeleton} ${styles.playerName}`} />
            <div className={`${styles.skeleton} ${styles.country}`} />

            <div className={styles.playerDetails}>
                {Array.from({ length: 4 }).map((_, index) => (
                    <div className={styles.detail} key={index}>
                        <div className={`${styles.skeleton} ${styles.detailLabel}`}/>
                        <div className={`${styles.skeleton} ${styles.detailValue}`}/>
                    </div>
                ))}
            </div>
        </section>

        <section className={styles.statsSection}>
            <div className={`${styles.skeleton} ${styles.sectionTitle}`} />

            <div className={styles.statsGrid}>
                {mainStats.map((_, index) => (
                    <div className={styles.statCard} key={index}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.skeleton} ${styles.statLabel}`}/>
                            <div className={`${styles.skeleton} ${styles.statIcon}`}/>
                        </div>
                        <div className={`${styles.skeleton} ${styles.statNumber}`}/>
                    </div>
                ))}

                {percentageStats.map((_, index) => (
                    <div className={`${styles.statCard} ${styles.percentageCard}`} key={index}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.skeleton} ${styles.statLabel}`}/>
                            <div className={`${styles.skeleton} ${styles.statIcon}`}/>
                        </div>
                        <div className={`${styles.skeleton} ${styles.statNumber}`}/>
                    </div>
                ))}
            </div>
        </section>
        
        <div className={`${styles.skeleton} ${styles.sectionTitle}`} />
        <section className={styles.tableSection}></section>
    </main>
  );
}