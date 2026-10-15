"use client"
import { useEffect, useState } from "react";
import styles from "./Games.module.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Game } from "@/src/backend/entities/gamesEntities";
import DateButtons from "./DateButtons";
import GameCard from "../GameCard";
import GamesSkeleton from './GamesSkeleton';
import Link from "next/link";

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
    const [loadedDate, setLoadedDate] = useState<string | null>(null);
    const dateKey = getDateString(date);

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
            } finally {
                if (!controller.signal.aborted) setLoadedDate(getDateString(date));
            }
        }

        void loadDayGames();
        return () => controller.abort();
    }, [date])

    return (
        <div>
            <DateButtons date={date} setDate={setDate} getDateString={getDateString}/>
            {loadedDate !== dateKey ? <GamesSkeleton /> : <section className={styles.container}>
                {games.map((game) => (
                    <Link href={`/partidos/${game.id}`} key={game.id} className={styles.gameLink}>
                        <GameCard id={game.id} isFavorite={game.isFavorite} finalizado={game.finished}
                            homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                            homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                            homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                            homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                            place={game.stadium} date={new Date(game.date)}
                        />
                    </Link>
                ))}
            </section>}
        </div>
    ) 
}
