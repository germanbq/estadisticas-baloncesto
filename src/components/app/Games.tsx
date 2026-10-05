"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Games.module.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Game } from "@/src/backend/entities/gamesEntities";
import DateButtons from "./DateButtons";

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

    useEffect(() => {
        if(searchParams.get("date") === getDateString(date)) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("date", getDateString(date));
        router.replace(`${pathname}?${params.toString()}`, {scroll: false,})
    }, [date, pathname, router, searchParams])

    useEffect(() => {
        const controller = new AbortController();

        async function loadDayGames() {
            try{
                const response = await fetch(`/api/partidos/listado?date=${getDateString(date)}`, 
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

        void loadDayGames();
        return () => controller.abort();
    }, [date])

    return (
        <div>
            <DateButtons date={date} setDate={setDate} getDateString={getDateString}/>
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
