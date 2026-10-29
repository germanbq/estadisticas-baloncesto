"use client"

import { CSSProperties, useState } from "react";
import { useSearchParams } from 'next/navigation';

import styles from "./StatsLeaders.module.css";
import { SlidersHorizontal, Trophy } from "lucide-react";
import FilterButton  from "../FilterButton"
import Image from "next/image";
import { LeaderPlayer } from "@/src/backend/entities/playersEntities";
import Link from "next/link";
import StatsLeadersSkeleton from "../skeletons/StatsLeadersSkeleton";
import NoDataCard from "../NoDataCard";
import PlayerAvatar from "../PlayerAvatar";
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";
import { useFetch } from "@/src/hooks/useFetch";

type PlayerCardProps = {
    id: number;
    className: string;
    image: string;
    name: string;
    pos: string;
    team: string;
    jerseyNumber: string;
    metric: number;
    color: string;
    position: string;
}

function PlayerCard(props: PlayerCardProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    return (
        <Link href={`/jugadores/${props.id}`} className={`${styles.playerCard} ${styles[props.className]}`} style={{"--color-acento": props.color} as CSSProperties}>
            <div className={styles.pos}>
                {props.pos === "1"? <Trophy color="#FF5A00"></Trophy>: ""}
                <span>{props.pos}</span>
            </div>
            <div className={styles.avatar}>
                {!props.image || failedSrc === props.image 
                    ? <PlayerAvatar />
                    : <Image src={props.image} onError={() => setFailedSrc(props.image)} alt={props.name} width={130} height={145}/>
                }
            </div>
            <span className={styles.playerName}>{props.name}</span>
            <div className={styles.teamAndJersey}>
                <span className={styles.team}>{props.team}</span>
                <span className={styles.jersey}>#{props.jerseyNumber} {props.position}</span>
            </div>
            <div className={`${styles.metric} ${props.pos === "1" ? styles.numberOne : ""}`} >
                {Number(props.metric.toFixed(2))}
            </div>
        </Link>
    )
}

export default function StatsLeader() {
    const searchParams = useSearchParams();
    const [metric, setMetric] = useState(() => searchParams.get("metric") || "points");

    useSyncQueryParams({ metric: metric});

    const {data, loading, hasError} = useFetch<LeaderPlayer[]>(`/api/jugadores/lideres?metric=${encodeURIComponent(metric)}`);
    const leaders = data ?? [];
    
    return (
        <section>
            <span className={styles.title}>LÍDERES DE LA LIGA</span>
            <section className={styles.filters}>
                <div className={styles.filtersIcon}>
                    <SlidersHorizontal className={styles.icon}/>
                    <span>Métricas de clasificacion</span>
                </div>
                <div className={styles.buttons}>
                    <FilterButton value="PTS" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="points"/>
                    <FilterButton value="REB" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="rebounds"/>
                    <FilterButton value="AST" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="assists"/>
                    <FilterButton value="STL" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="steals"/>
                    <FilterButton value="BLK" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="blocks"/>
                    <FilterButton value="FG%" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="fg_percentage"/>
                    <FilterButton value="3P%" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} selectedValue="three_percentage"/>
                </div>
            </section>
            {loading ? <StatsLeadersSkeleton /> : hasError ? (
                <div className={styles.noDataContainer}>
                    <NoDataCard text="No se pudieron cargar los líderes de la liga. Inténtalo de nuevo." />
                </div>
            ) : leaders.length === 0 ? (
                <div className={styles.noDataContainer}>
                    <NoDataCard text="No hay estadísticas disponibles para mostrar los líderes de la liga en esta métrica" />
                </div>
            ) : (
                <section className={styles.playerCardsContainer}>
                    {leaders.map((player, index) => (
                        <PlayerCard key={player.id} id={player.id}
                            className={`position${index+1}`} image={player.image}
                            name={player.name} pos={String(index+1)} team={player.team}
                            jerseyNumber={player.jerseyNumber} metric={player.value}
                            color={["#FF5A00", "#A5E7FF", "#C58A5A"][index]} position={player.position}/>
                    ))}
                </section>
            )}
        </section>
    )
}
