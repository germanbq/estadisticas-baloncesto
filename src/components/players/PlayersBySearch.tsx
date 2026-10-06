import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import styles from "./PlayersBySearch.module.css";
import { UserSearch } from "lucide-react";
import PlayersBySearchSkeleton from "./PlayersBySearchSkeleton";
import HorizontalPlayerCard from "../HorizontalPlayerCard";

export default function PlayersBySearch({players, loading = false}: {players: SearchedPlayer[]; loading?: boolean}) {
    if (loading) return <PlayersBySearchSkeleton />;

    return (
        <section className={styles.section}>
            {players.length > 0 
            ? players.map((player) => (
                <HorizontalPlayerCard key={player.id} player={player} />
            ))
            : (
                <div className={styles.emptyState} role="status">
                    <UserSearch size={40} aria-hidden="true" />
                    <h2 className={styles.emptyTitle}>No se encontraron jugadores</h2>
                    <p className={styles.emptyDescription}>
                        Prueba con otro nombre o cambia los filtros de posición y conferencia.
                    </p>
                </div>
            )}
        </section>
    )
}
