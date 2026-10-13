import styles from './BarsComparison.module.css';

export default function BarsComparison({homePercentage, awayPercentage}: {homePercentage: number, awayPercentage: number}) {
    return (
        <div className={styles.barContainer}>
            <div className={styles.homeBar} style={{ width: `${homePercentage}%` }}></div>
            <div className={styles.awayBar} style={{ width: `${awayPercentage}%` }}></div>
        </div>
    )
}