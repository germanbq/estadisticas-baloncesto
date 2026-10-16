import styles from "../players/PlayersBySearch.module.css";
import { useEffect, useState } from "react";
import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import HorizontalPlayerCard from "../HorizontalPlayerCard";
import PlayersBySearchSkeleton from "../skeletons/PlayersBySearchSkeleton";

export default function FavoritePlayers({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {
    
    const [players, setPlayers] = useState<SearchedPlayer[]>([])
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const controller = new AbortController();
            
        async function loadFavoriteCounts() {
            try {
                const response = await fetch(`/api/favoritos/jugadores`,
                    { signal: controller.signal });
                const result = await response.json();
                    
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }
    
                setPlayers(result.data);
            }
            catch(error) {
                if (controller.signal.aborted) return;
                console.error(error);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
    
        void loadFavoriteCounts();
        return () => controller.abort();
    }, []);
    
    if (loading) return <PlayersBySearchSkeleton />;

    return (
        <section className={styles.section}>
            {players.map((player) => (
                <HorizontalPlayerCard key={player.id} player={player} onFavoriteChange={onFavoriteChange} disabled={disabled}/>
            ))}
        </section>
    )
}
