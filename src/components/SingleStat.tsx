import styles from "./SingleStat.module.css";

type SingleStatProps = {
    label: string;
    value: number | string;
}

export default function SingleStat({label, value}: SingleStatProps) {
    return (
        <div className={styles.stat}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={styles.value}>{value}</dd>
        </div>
    )
}