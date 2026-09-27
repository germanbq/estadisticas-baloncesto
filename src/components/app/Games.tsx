"use client"
import { useState } from "react";
import Image from "next/image";
import styles from "./Games.module.css";
import { ChevronRight, ChevronLeft } from "lucide-react";


type DateButtonProps = {
    date: Date;
    gamesNumber: number;
    day: Date;
    setDay: (date: Date) => void;
}

type GameProps = {
    finalizado: boolean;
    homeTeam: string;
    awayTeam: string;
    homeScore?: string;
    awayScore?: string;
    homeRecord: string;
    awayRecord: string;
    homeImage: string;
    awayImage: string;
    place: string;
    date: Date;
}

function DateButton({date, gamesNumber, day, setDay}: DateButtonProps) {
    const hoy = new Date();
    const esHoy = date.toDateString() === hoy.toDateString();
    const weekDay = date.toLocaleDateString("es-ES", { weekday: "short",});
    const month = date.toLocaleDateString("es-ES", { month: "short" });
    const monthDate = month.charAt(0).toUpperCase() + month.slice(1);
    return(
        <button className={`${styles.button} ${day.getDate() === date.getDate() && day.getMonth() === date.getMonth() && day.getFullYear() === date.getFullYear()     
                            ? styles.active : ""}`}
                onClick={() => setDay(date)}>
            <span>{esHoy ? "Hoy" : `${monthDate}, ${weekDay}`}</span>
            <span className={styles.date}>{date.getDate()}</span>
            <span>{gamesNumber} partidos</span>        
        </button>
    )
}

function Game(props: GameProps) {
    return (
        <article className={styles.game}>
            <div className={styles.gameLabels}>
                {props.finalizado ? <span>Finalizado</span> : <span>{props.date.toLocaleDateString("es-ES")}</span>}
                <span>{props.place}</span>
            </div>
            <div className={styles.gameTeams}>
                <div className={styles.teamColumn}>
                    <Image src={props.homeImage} alt="Logo del local" width={64} height={64}/>
                    <span className={styles.teamName}>{props.homeTeam}</span>
                    <span>({props.homeRecord})</span>
                    <span className={styles.teamScore}>{props.homeScore}</span>
                </div>
                <span className={styles.hour}>
                    {props.date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                <div className={styles.teamColumn}>
                    <Image src={props.awayImage} alt="Logo del visitante" width={64} height={64}/>
                    <span className={styles.teamName}>{props.awayTeam}</span>
                    <span>({props.awayRecord})</span>
                    <span className={styles.teamScore}>{props.awayScore}</span>
                </div>
            </div>
        </article>
    )
}

export default function Games() {
    const [day, setDay] = useState(new Date());
    return (
        <div>
            <section className={styles.buttonsContainer}>
                <ChevronLeft className={styles.chevron}/>
                <DateButton date={new Date("2026-09-25T20:30:00")} gamesNumber={5} day={day} setDay={setDay}/>
                <DateButton date={new Date("2026-09-26T20:30:00")} gamesNumber={5} day={day} setDay={setDay}/>
                <DateButton date={new Date("2026-09-27T20:30:00")} gamesNumber={5} day={day} setDay={setDay}/>
                <DateButton date={new Date("2026-09-28T20:30:00")} gamesNumber={5} day={day} setDay={setDay}/>
                <DateButton date={new Date("2026-09-29T20:30:00")} gamesNumber={5} day={day} setDay={setDay}/>
                <ChevronRight className={styles.chevron}/>
            </section>
            <section className={styles.gamesContainer}>
                <Game finalizado={true}
                    homeTeam="Los Angeles Lakers" awayTeam="Boston Celtics"
                    homeScore="112" awayScore="108"
                    homeRecord="10-5" awayRecord="12-3"
                    homeImage="/los-angeles-lakers.webp" awayImage="/boston-celtics.webp"
                    place="Los Ángeles" date={new Date("2026-09-27T19:00:00")}
                />
                <Game finalizado={true}
                    homeTeam="Golden State Warriors" awayTeam="Chicago Bulls"
                    homeScore="120" awayScore="115"
                    homeRecord="9-6" awayRecord="7-8"
                    homeImage="/golden-state-warriors.webp" awayImage="/chicago-bulls.webp"
                    place="San Francisco" date={new Date("2026-09-27T20:30:00")}
                />
                <Game finalizado={false}
                    homeTeam="Miami Heat" awayTeam="Denver Nuggets"
                    homeRecord="8-7" awayRecord="11-4"
                    homeImage="/miami-heat.webp" awayImage="/denver-nuggets.webp"
                    place="Miami" date={new Date("2026-09-27T22:00:00")}
                />
            </section>
        </div>
    ) 
}
