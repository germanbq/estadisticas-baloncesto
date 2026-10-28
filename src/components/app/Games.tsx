"use client"
import { useEffect, useState } from "react";
import styles from "./Games.module.css";
import { useSearchParams } from "next/navigation";
import { Game } from "@/src/backend/entities/gamesEntities";
import DateButtons from "./DateButtons";
import GameCard from "../GameCard";
import GamesSkeleton from '../skeletons/GamesSkeleton';
import NoDataCard from "../general/NoDataCard";
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";

export default function Games() {
    function getDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return`${year}-${month}-${day}`
    }

    const searchParams = useSearchParams();

    const [date, setDate] = useState(() => { const dateParam = searchParams.get("date");
        return dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();});
    const [games, setGames] = useState<Game[]>([])
    const [loadedDate, setLoadedDate] = useState<string | null>(null);
    const dateKey = getDateString(date);
    const [error, setError] = useState(false);

    useSyncQueryParams({date: dateKey});

    useEffect(() => {
        const controller = new AbortController();

        async function loadDayGames() {
            try{
                const response = await fetch(`/api/partidos/listado?date=${getDateString(date)}`, 
                { signal: controller.signal })
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error ?? `Error ${response.status}`);
                }

                setError(false);
                setGames(result.data);
            } catch (error) {
                if (controller.signal.aborted) return;
                setError(true);
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
            {loadedDate !== dateKey ? <GamesSkeleton /> : error ?
                <div className={styles.noDataContainer}>
                    <NoDataCard text="No se pudieron cargar los partidos. Inténtalo de nuevo." />
                </div>
                : games.length === 0 ?
                    <div className={styles.noDataContainer}>
                        <NoDataCard text="No hay partidos programados para esta fecha." />
                    </div>
                    : <section className={styles.container}>
                        {games.map((game) => (
                            <div key={game.id} className={styles.cardContainer}>
                                <GameCard href={`/partidos/${game.id}`} id={game.id} isFavorite={game.isFavorite} finalizado={game.finished}
                                    homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                                    homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                                    homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                                    homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                                    place={game.stadium} date={new Date(game.date)}
                                />
                            </div>
                        ))}
                    </section>
                
            }
        </div>
    ) 
}
