import styles from "./FavoritePlayers.module.css";
import { useEffect, useState } from "react";
import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import HorizontalPlayerCard from "../HorizontalPlayerCard";

export default function FavoritePlayers({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {
    
    const [players, setPlayers] = useState<SearchedPlayer[]>([])
    
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
            }
        }
    
        void loadFavoriteCounts();
        return () => controller.abort();
    }, []);
    
    return (
        <section className={styles.container}>
            {players.map((player) => (
                <HorizontalPlayerCard key={player.id} player={player} />
            ))}
        </section>
    )
}