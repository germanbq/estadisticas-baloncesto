import Image from "next/image"
import styles from "./HorizontalPlayerCard.module.css";
import Link from "next/link";
import { SearchedPlayer } from "../backend/entities/playersEntities"
import SingleStat from "./SingleStat";
import { ArrowRight } from "lucide-react";


export default function HorizontalPlayerCard({player}: {player: SearchedPlayer}) {
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