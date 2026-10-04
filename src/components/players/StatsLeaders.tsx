"use client"

import { CSSProperties, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import styles from "./StatsLeaders.module.css";
import { SlidersHorizontal, Trophy } from "lucide-react";
import FilterButton  from "../FilterButton"
import Image from "next/image";
import { LeaderPlayer } from "@/src/backend/entities/playersEntities";
import Link from "next/link";
import StatsLeadersSkeleton from "./StatsLeadersSkeleton";

type PlayerCardProps = {
    id: number;
    className: string;
    image: string;
    name: string;
    pos: string;
    team: string;
    jerseyNumber: number;
    metric: number;
    color: string;
    position: string;
}

function PlayerCard(props: PlayerCardProps) {
    return (
        <Link href={`/jugadores/${props.id}`} className={`${styles.playerCard} ${styles[props.className]}`} style={{"--color-acento": props.color} as CSSProperties}>
            <div className={styles.pos}>
                {props.pos === "1"? <Trophy color="#FF5A00"></Trophy>: ""}
                <span>{props.pos}</span>
            </div>
            <Image src={props.image} alt={props.name} width={130} height={145} className={styles.image}/>
            <span className={styles.playerName}>{props.name}</span>
            <div className={styles.teamAndJersey}>
                <span className={styles.team}>{props.team}</span>
                <span className={styles.jersey}>#{props.jerseyNumber} {props.position}</span>
            </div>
            <div className={`${styles.metric} ${props.pos === "1" ? styles.numberOne : ""}`} >
                {props.metric}
            </div>
        </Link>
    )
}

export default function StatsLeader() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [metric, setMetric] = useState(() => searchParams.get("metric") || "points");
    const [leaders, setLeaders] = useState<LeaderPlayer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(searchParams.get("metric") === metric) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("metric", metric);
        router.replace(`${pathname}?${params.toString()}`, {scroll: false,});
    }, [metric, pathname, router, searchParams])

    useEffect(() => {
        const controller = new AbortController();

        async function loadLeaders() {
            try {
                setLoading(true);
                const response = await fetch(`/api/jugadores/lideres?metric=${encodeURIComponent(metric)}`,
                { signal: controller.signal });
                const result = await response.json();

                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }   
                
                setLeaders(result.data);
            } catch(error){
                if (controller.signal.aborted) return;
                console.error(error);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        
        void loadLeaders();
        return () => controller.abort();
    }, [metric])

    return (
        <>
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
            {loading ? <StatsLeadersSkeleton /> 
            :   <>
                    <section className={styles.playerCardsContainer}>
                        {leaders.map((player, index) => (
                            <PlayerCard key={player.id} id={player.id}
                                        className={`position${index+1}`} image={player.image}
                                        name={player.name} pos={String(index+1)} team={player.team} 
                                        jerseyNumber={player.jerseyNumber} metric={Number(player.value)} 
                                        color={["#FF5A00", "#A5E7FF", "#C58A5A"][index]} position={player.position}/>
                        ))}
                    </section>
                </>
            }
        </>
    )
}