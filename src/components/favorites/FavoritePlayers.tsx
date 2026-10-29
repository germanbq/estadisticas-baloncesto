import NoDataCard from "../NoDataCard";
import styles from "../players/PlayersBySearch.module.css";
import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import HorizontalPlayerCard from "../HorizontalPlayerCard";
import PlayersBySearchSkeleton from "../skeletons/PlayersBySearchSkeleton";
import { useFetch } from "@/src/hooks/useFetch";

export default function FavoritePlayers({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {
    
    const {data, loading, hasError} = useFetch<SearchedPlayer[]>(`/api/favoritos/jugadores`);
    const players = data ?? [];
    
    if (loading) return <PlayersBySearchSkeleton />;

    if (hasError) return <NoDataCard text="No se pudieron cargar tus jugadores favoritos" />;
    if (players.length === 0) return <NoDataCard text="Todavía no tienes jugadores favoritos" />;

    return (
        <section className={styles.section}>
            {players.map((player) => (
                <HorizontalPlayerCard key={player.id} player={player} onFavoriteChange={onFavoriteChange} disabled={disabled}/>
            ))}
        </section>
    )
}
