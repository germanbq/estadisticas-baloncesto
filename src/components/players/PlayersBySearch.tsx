import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import SingleStat from "../SingleStat";
import Image from "next/image";
import styles from "./PlayersBySearch.module.css";
import Link from "next/link";
import { ArrowRight, UserSearch } from "lucide-react";
import PlayersBySearchSkeleton from "./PlayersBySearchSkeleton";

function SearchedPlayerCard({player}: {player: SearchedPlayer}) {
    return (
        <article className={styles.card}>
            <div className={styles.articleHeader}>     
                <div className={styles.information}>
                    <Image src={player.image} alt={player.name} width={80} height={80} className={styles.image}/>
                    <div className={styles.personalInformation}>
                        <span className={styles.name}>{player.name}</span>
                        <span className={styles.teams}>{player.team} · #{player.jerseyNumber} · {player.position}</span>
                    </div>
                </div>
                <Link href={`/jugadores/${player.id}`} className={styles.profileLink}>
                    Ver ficha completa
                    <ArrowRight size={18} />
                </Link>
            </div>
            <div className={styles.statsContainer}>
                <SingleStat label="PTS" value={player.points} />
                <SingleStat label="REB" value={player.rebounds} />
                <SingleStat label="AST" value={player.assists} />
                <SingleStat label="STL" value={player.steals} />
                <SingleStat label="BLK" value={player.blocks} />
            </div>
        </article>
    )
}

export default function PlayersBySearch({players, loading = false}: {players: SearchedPlayer[]; loading?: boolean}) {
    if (loading) return <PlayersBySearchSkeleton />;

    return (
        <section className={styles.section}>
            {players.length > 0 
            ? players.map((player) => (
                <SearchedPlayerCard key={player.id} player={player} />
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
