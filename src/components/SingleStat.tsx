import styles from "./SingleStat.module.css";

type SingleStatProps = {
    label: string;
    value: number | string | null;
    color?: string;
    smallValue?: string;
}

export default function SingleStat({label, value, color, smallValue}: SingleStatProps) {
    return (
        <div className={styles.stat}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd>
                <span className={styles.value} style={{color}}>{value}</span>
                {smallValue != null && smallValue !== "" && (
                    <span className={styles.smallValue}>{smallValue}</span>
                )}
            </dd>
        </div>
    )
}