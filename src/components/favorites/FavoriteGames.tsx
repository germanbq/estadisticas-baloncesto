import styles from "../app/Games.module.css"
import GameCard from "../GameCard"
import { useEffect, useState } from "react";
import { Game } from "@/src/backend/entities/gamesEntities";

export default function FavoriteGames({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {
    const [games, setGames] = useState<Game[]>([])
    
    useEffect(() => {
        const controller = new AbortController();
            
        async function loadFavoriteCounts() {
            try {
                const response = await fetch(`/api/favoritos/partidos`,
                    { signal: controller.signal });
                const result = await response.json();
                    
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }
    
                setGames(result.data);
            }
            catch(error) {
                if (controller.signal.aborted) return;
                console.error(error);
            }
        }
    
        void loadFavoriteCounts();
        return () => controller.abort();
    }, []);
    
    return (
        <section className={styles.container}>
            {games.map((game) => (
                <GameCard key={game.id} id={game.id} isFavorite={game.isFavorite} disabled={disabled}
                    onFavoriteChange={onFavoriteChange} finalizado={game.finished}
                    homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                    homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                    homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                    homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                    place={game.stadium} date={new Date(game.date)}
                    />
                ))}
        </section>
    )
}