import Image from "next/image"
import styles from "./HorizontalPlayerCard.module.css";
import Link from "next/link";
import { SearchedPlayer } from "../backend/entities/playersEntities"
import SingleStat from "./SingleStat";
import { ArrowRight } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { useState } from "react";
import PlayerAvatar from "./PlayerAvatar";


export default function HorizontalPlayerCard({player, onFavoriteChange, disabled}: 
                                {player: SearchedPlayer, onFavoriteChange?: (fav: boolean) => void, disabled?: boolean}) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    return (
        <article className={styles.card}>
            <div className={styles.articleHeader}>     
                <div className={styles.information}>
                    <div className={styles.avatar}>
                        {!player.image || failedSrc === player.image 
                            ? <PlayerAvatar />
                            : <Image src={player.image} onError={() => setFailedSrc(player.image)} alt={player.name} width={80} height={95}/>
                        }
                    </div>
                    <div className={styles.personalInformation}>
                        <span className={styles.name}>{player.name}</span>
                        <div className={styles.badges}>
                            <span className={`${styles.badge} ${styles.teamBadge}`}>{player.team}</span>
                            <span className={`${styles.badge} ${styles.numberBadge}`}>#{player.jerseyNumber} · {player.position}</span>
                        </div>
                    </div>
                </div>
                <Link href={`/jugadores/${player.id}`} className={styles.profileLink}>
                    Ver ficha completa
                    <ArrowRight size={18} />
                </Link>
            </div>
            <div className={styles.favorite}>
                <FavoriteButton type="jugadores" itemId={player.id} isFavorite={player.isFavorite} onFavoriteChange={onFavoriteChange} disabled={disabled}/>
            </div>
            <div className={styles.statsContainer}>
                <SingleStat label="PTS" value={Number(player.points.toFixed(2))} />
                <SingleStat label="REB" value={Number(player.rebounds.toFixed(2))} />
                <SingleStat label="AST" value={Number(player.assists.toFixed(2))} />
                <SingleStat label="STL" value={Number(player.steals.toFixed(2))} />
                <SingleStat label="BLK" value={Number(player.blocks.toFixed(2))} />
            </div>
        </article>
    )
}
