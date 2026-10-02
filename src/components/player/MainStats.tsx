import { PlayerProfile } from "@/src/backend/entities/playersEntities";
import styles from "./MainStats.module.css";
import { CircleDot, ArrowUp, Share2, Hand, Shield, Crosshair, Goal} from "lucide-react";

type DataContainerProps = {
    icon: React.ReactNode;
    label: string;
    value: number;
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

export default function MainStats({stats}: {stats: PlayerProfile}) {
    return (
        <>
        <span className={styles.title}>Promedios de temporada 2025-2026</span>
        <section className={styles.statsGrid}>
            <DataContainer icon={<CircleDot />} label="PTS" value={stats.seasons[0].points} />
            <DataContainer icon={<ArrowUp />} label="REB" value={stats.seasons[0].rebounds} />
            <DataContainer icon={<Share2 />} label="AST" value={stats.seasons[0].assists} />
            { stats.seasons[0].steals > stats.seasons[0].blocks 
                ? <DataContainer icon={<Hand />} label="STL" value={stats.seasons[0].steals} />
                : <DataContainer icon={<Shield />} label="BLK" value={stats.seasons[0].blocks} />}
        </section>
        <section className={styles.percentageGrid}>
            <DataContainer icon={<Crosshair />} label="FG%" value={stats.seasons[0].fgPercentage} />
            <DataContainer icon={<Goal />} label="3P%" value={stats.seasons[0].threePercentage} />
        </section>
        </>
    )
}