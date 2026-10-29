"use client"
import { useState } from "react";
import styles from "./Games.module.css";
import { useSearchParams } from "next/navigation";
import { Game } from "@/src/backend/entities/gamesEntities";
import DateButtons from "./DateButtons";
import GameCard from "../GameCard";
import GamesSkeleton from '../skeletons/GamesSkeleton';
import NoDataCard from "../NoDataCard";
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";
import { useFetch } from "@/src/hooks/useFetch";

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
    const dateKey = getDateString(date);

    useSyncQueryParams({date: dateKey});

    const {data, loading, hasError} = useFetch<Game[]>(`/api/partidos/listado?date=${dateKey}`);
    const games = data ?? [];

    return (
        <div>
            <DateButtons date={date} setDate={setDate} getDateString={getDateString}/>
            {loading ? <GamesSkeleton /> : hasError ?
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
