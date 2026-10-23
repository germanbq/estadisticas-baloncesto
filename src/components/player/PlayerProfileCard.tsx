import Image from "next/image";
import styles from "./PlayerProfileCard.module.css";
import { PlayerProfile } from "@/src/backend/entities/playersEntities";
import FavoriteButton from "../FavoriteButton";
import Link from "next/link";

type DataContainerProps = {
    label: string;
    value: number | string;
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
            <Image src={stats.image} alt={`Imagen ${stats.name}`} width={120} height={120} className={styles.image} loading="eager"/>
            <div className={styles.labels}>
                <Link href={`/equipos/${stats.teamId}`} className={styles.team}>{stats.team}</Link>
                <span className={styles.jerseyNumber}># {stats.jerseyNumber} {stats.position}</span>
            </div>
            <div className={styles.nameAndCountry}>
                <h1 className={styles.name}>{stats.name}</h1>
                <span className={styles.country}>{stats.country}</span>
            </div>
            <dl className={styles.dataContainer}>
                <DataContainer label="Altura" value={Number(stats.height)} unit="m"/>
                <DataContainer label="Peso" value={Number(stats.weight)} unit="kg"/>
                <DataContainer label="Edad" value={stats.age} unit="años"/>
                <DataContainer label="Draft" value={stats.draft === 0 ? "No drafteado": stats.draft} />
            </dl>
            <div className={styles.favorite}>
                <FavoriteButton type="jugadores" itemId={stats.id} isFavorite={stats.isFavorite} />
            </div>
        </article>
    );
}