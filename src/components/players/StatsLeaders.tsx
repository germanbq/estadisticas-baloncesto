"use client"

import { CSSProperties, useState } from "react";
import styles from "./StatsLeaders.module.css";
import { SlidersHorizontal, Trophy } from "lucide-react";
import FilterButton  from "./FilterButton"
import Image from "next/image";

type PlayerCardProps = {
    className: string;
    image: string;
    name: string;
    pos: string;
    team: string;
    jerseyNumber: string;
    metric: number;
    color: string;
}

function PlayerCard(props: PlayerCardProps) {
    return (
        <article className={`${styles.playerCard} ${styles[props.className]}`} style={{"--color-acento": props.color} as CSSProperties}>
            <div className={styles.pos}>
                {props.pos === "1"? <Trophy color="#FF5A00"></Trophy>: ""}
                <span>{props.pos}</span>
            </div>
            <Image src={props.image} alt={props.name} width={120} height={120} className={styles.image}/>
            <span className={styles.playerName}>{props.name}</span>
            <div className={styles.teamAndJersey}>
                <span className={styles.team}>{props.team}</span>
                <span className={styles.jersey}>#{props.jerseyNumber}</span>
            </div>
            <div className={`${styles.metric} ${props.pos === "1" ? styles.numberOne : ""}`} >
                {props.metric}
            </div>
        </article>
    )
}
export default function StatsLeader() {
    const [metric, setMetric] = useState("PTS")
    return (
        <section className={styles.section}>
            <span className={styles.title}>LÍDERES DE LA LIGA</span>
            <section className={styles.filters}>
                <div className={styles.filtersIcon}>
                    <SlidersHorizontal className={styles.icon}/>
                    <span>Métricas de clasificacion</span>
                </div>
                <div className={styles.buttons}>
                    <FilterButton value="PTS" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="REB" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="AST" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="STL" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="BLK" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="FG%" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="3P%" selected={metric} setSelected={setMetric} className={styles.button} activeClassName={styles.active} />       
                </div>
            </section>
            <section className={styles.playerCardsContainer}>
                <PlayerCard className={"position1"} image="/LeBron_James.jpg" name="Lebron James" pos="1" team="PHI" jerseyNumber="23" metric={29.8} color="#FF5A00" />
                <PlayerCard className={"position2"} image="/LeBron_James.jpg" name="Kawhi Leonard" pos="2" team="TOR" jerseyNumber="2" metric={29.1} color="#A5E7FF" />
                <PlayerCard className={"position3"} image="/LeBron_James.jpg" name="Stephen Curry" pos="3" team="GSW" jerseyNumber="30" metric={28.4} color="#C58A5A" />           
            </section>
        </section>
    )
}