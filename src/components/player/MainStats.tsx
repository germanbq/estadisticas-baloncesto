import styles from "./MainStats.module.css";
import { CircleDot, ArrowUp, Share2, Hand, Shield, Crosshair, Goal} from "lucide-react";

type DataContainerProps = {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function DataContainer({icon, label, value}: DataContainerProps) {
    return (
        <div className={styles.dataContainers}>
            <dt className={styles.dataNames}>
                <span>{label}</span>
                {icon}
            </dt>
            <dd className={styles.value}>{value}</dd>
        </div>
    )
}

export default function MainStats() {
    return (
        <>
        <span className={styles.title}>Promedios de temporada 2025-2026</span>
        <section className={styles.statsGrid}>
            <DataContainer icon={<CircleDot />} label="PTS" value="29.8" />
            <DataContainer icon={<ArrowUp />} label="REB" value="7.8" />
            <DataContainer icon={<Share2 />} label="AST" value="8.4" />
            { true ? <DataContainer icon={<Hand />} label="STL" value="1.2" />
                : <DataContainer icon={<Shield />} label="BLK" value="0.8" />}
        </section>
        <section className={styles.percentageGrid}>
            <DataContainer icon={<Crosshair />} label="FG%" value="59.8" />
            <DataContainer icon={<Goal />} label="3P%" value="42.3" />
        </section>
        </>
    )
}