import NoDataCard from "../general/NoDataCard";
import styles from "./FavoriteGames.module.css"
import GameCard from "../GameCard"
import { Game } from "@/src/backend/entities/gamesEntities";
import GamesSkeleton from "../skeletons/GamesSkeleton";
import { useFetch } from "@/src/hooks/useFetch";

export default function FavoriteGames({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {

    const {data, loading, hasError} = useFetch<Game[]>(`/api/favoritos/partidos`);
    const games = data ?? [];
    
    if (loading) return <GamesSkeleton variant="favorites" />;

    if (hasError) return <NoDataCard text="No se pudieron cargar tus partidos favoritos" />;
    if (games.length === 0) return <NoDataCard text="Todavía no tienes partidos favoritos" />;

    return (
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            {games.map((game) => (
                <div key={game.id} className={styles.cardContainer}>
                    <GameCard href={`/partidos/${game.id}`} id={game.id} isFavorite={game.isFavorite} disabled={disabled}
                        onFavoriteChange={onFavoriteChange} finalizado={game.finished}
                        homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                        homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                        homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                        homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                        place={game.stadium} date={new Date(game.date)}
                        />
                </div>
            ))}
        </section>
    )
}
