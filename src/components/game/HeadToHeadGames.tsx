import { HeadToHeadGame } from "@/src/backend/entities/gamesEntities";
import { Swords, CircleCheck, CalendarX } from "lucide-react";
import styles from './HeadToHeadGames.module.css';

function HTHGameCard({game, referenceTeamName}: {game: HeadToHeadGame, referenceTeamName: string}) {
    const winner = game.homeScore > game.awayScore ? game.homeName : game.awayName;
    const winnerColor = winner === referenceTeamName ? 'var(--color-blue)' : 'var(--color-violet)';

    const date = new Date(game.date);
    const month = date.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase();
    return (
        <article className={styles.game}>
            <div className={styles.date}>
                <span className={styles.month}>{month}</span>
                <span className={styles.day}>{date.getDate()}</span>
            </div>
            <div className={styles.data}>
                <div>
                    <span style={{ color: winner ===  game.homeName ? winnerColor : 'white',}}>{game.homeName} {game.homeScore} </span>
                    -
                    <span style={{ color: winner ===  game.awayName ? winnerColor : 'white',}}> {game.awayName} {game.awayScore}</span>
                </div>
                <span className={styles.stadium}>{game.stadium}</span>
            </div>
            <div className={winner === referenceTeamName ? styles.local : styles.away}>
                <CircleCheck size={22} strokeWidth={2} aria-hidden="true" />
                <span>Victoria {winner}</span>
            </div>  
        </article>
    )
}

export default function HeadToHeadGames({games, referenceTeamName}:{games: HeadToHeadGame[], referenceTeamName: string}) {
    return (
        <section className={styles.gamesSection}>
            <span className={styles.title}>
                <Swords size={25} strokeWidth={2} aria-hidden="true" />
                Enfrentamientos esta temporada
            </span>
            {games.length === 0 
            ?
                <div className={styles.emptyMatchups}>
                    <CalendarX className={styles.emptyMatchups_icon} size={32} strokeWidth={1.5} aria-hidden="true"/>
                    <p>
                        No hay enfrentamientos registrados entre estos equipos
                        esta temporada.
                    </p>
                </div>
            : 
                <>
                    {games.map((game, index) => (
                        <HTHGameCard key={index} game={game} referenceTeamName={referenceTeamName}/>
                    ))}        
                </>
            }
        </section>
    )
}