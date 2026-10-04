"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Games.module.css";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Game } from "@/src/backend/entities/gamesEntities";


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
    homeScore: number | null;
    awayScore: number | null;
    homeRecord: string;
    awayRecord: string;
    homeLogo: string;
    awayLogo: string;
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

function GameCard(props: GameProps) {
    return (
        <article className={styles.game}>
            <div className={styles.gameLabels}>
                {props.finalizado ? <span>Finalizado</span> : <span>{props.date.toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid",})
}</span>}
                <span>{props.place}</span>
            </div>
            <div className={styles.gameTeams}>
                <div className={styles.teamColumn}>
                    <Image src={props.homeLogo} alt="Logo del local" width={64} height={64}/>
                    <span className={styles.teamName}>{props.homeTeam}</span>
                    <span>({props.homeRecord})</span>
                    <span className={styles.teamScore}>{props.homeScore}</span>
                </div>
                <span className={styles.hour}>
                    {props.date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                <div className={styles.teamColumn}>
                    <Image src={props.awayLogo} alt="Logo del visitante" width={64} height={64}/>
                    <span className={styles.teamName}>{props.awayTeam}</span>
                    <span>({props.awayRecord})</span>
                    <span className={styles.teamScore}>{props.awayScore}</span>
                </div>
            </div>
        </article>
    )
}

export default function Games() {
    function addDays(date: Date, amount: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + amount);
        return result;
    }

    function getDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return`${year}-${month}-${day}`
    }

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [date, setDate] = useState(() => { const dateParam = searchParams.get("date");
        return dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();});
    const [games, setGames] = useState<Game[]>([])
    const defaultDate = new Date();

    useEffect(() => {
        if(searchParams.get("date") === getDateString(date)) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("date", getDateString(date));
        router.replace(`${pathname}?${params.toString()}`, {scroll: false,})
    }, [date, pathname, router, searchParams])

    useEffect(() => {
        const controller = new AbortController();

        async function dayGames() {
            try{
                const response = await fetch(`/api/partidos?${searchParams.toString()}`, 
                { signal: controller.signal })
                const result = await response.json();

                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                } 

                setGames(result.data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
            }
        }

        void dayGames();
        return () => controller.abort();
    }, [searchParams])

    return (
        <div>
            <section className={styles.buttonsContainer}>
                <ChevronLeft className={styles.chevron}/>
                <DateButton date={addDays(defaultDate, -2)} gamesNumber={5} day={date} setDay={setDate}/>
                <DateButton date={addDays(defaultDate, -1)} gamesNumber={5} day={date} setDay={setDate}/>
                <DateButton date={defaultDate} gamesNumber={5} day={date} setDay={setDate}/>
                <DateButton date={addDays(defaultDate, 1)} gamesNumber={5} day={date} setDay={setDate}/>
                <DateButton date={addDays(defaultDate, 2)} gamesNumber={5} day={date} setDay={setDate}/>
                <ChevronRight className={styles.chevron}/>
            </section>
            <section className={styles.gamesContainer}>
                {games.map((game) => (
                    <GameCard key={game.homeTeamName} finalizado={game.finished}
                        homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                        homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                        homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                        homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                        place={game.stadium} date={new Date(game.date)}
                    />
                ))}
            </section>
        </div>
    ) 
}
