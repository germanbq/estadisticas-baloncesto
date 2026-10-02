import Image from "next/image";
import styles from "./PlayerProfileCard.module.css";
import { PlayerProfile } from "@/src/backend/entities/playersEntities";

type DataContainerProps = {
    label: string;
    value: number;
    unit?: string;
}

function DataContainer({label, value, unit}: DataContainerProps) {
    return (
        <div className={styles.data}>
            <dt className={styles.dataName}>{label}</dt>
            <dd>{value} {unit}</dd>
        </div>
    )
}

export default function PlayerProfileCard({stats}: {stats: PlayerProfile}) {
    return (
        <article className={styles.card}>
            <Image src="/LeBron_James.jpg" alt="LeBron James" width={120} height={120} className={styles.image}/>
            <div className={styles.labels}>
                <span className={styles.team}>{stats.team}</span>
                <span className={styles.jerseyNumber}># {stats.jerseyNumber} {stats.position}</span>
            </div>
            <div className={styles.nameAndCountry}>
                <h1 className={styles.name}>{stats.name}</h1>
                <span className={styles.country}>{stats.country}</span>
            </div>
            <dl className={styles.dataContainer}>
                <DataContainer label="Altura" value={stats.height} unit="m"/>
                <DataContainer label="Peso" value={stats.weight} unit="kg"/>
                <DataContainer label="Edad" value={stats.age} unit="años"/>
                <DataContainer label="Draft" value={stats.draft} />
            </dl>
        </article>
    );
}