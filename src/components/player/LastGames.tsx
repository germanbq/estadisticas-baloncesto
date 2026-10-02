import { PlayerGames } from "@/src/backend/entities/playersEntities";
import SingleStat from "../SingleStat";
import styles from "./LastGames.module.css";

type Props = {
    games: PlayerGames[];
}

function Game({game}: {game: PlayerGames}) {
    const minutes = Math.floor(game.secondsPlayed / 60);
    const seconds = game.secondsPlayed%60;

    const date = new Date(game.date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    })
    .replaceAll("/", "-");
    return (
        <article className={styles.article}>
            <div className={styles.articleHeader}>
                <span className={styles.dot} style={{ backgroundColor: game.victory ? "#22c55e" : "#ef4444" }}/>
                {game.home ? <span>{`VS ${game.rival}`}</span> : <span>{`@ ${game.rival}`}</span>}
                {game.victory ? <span>{`(W ${game.homeScore}-${game.awayScore})`}</span> : <span>{`(L ${game.homeScore}-${game.awayScore}))`}</span>}
                <span className={styles.date}>{`${date} · ${minutes}:${String(seconds).padStart(2, "0")} MINS`}</span>
                <span className={styles.stadium}>{game.stadium}</span>
            </div>
            <div className={styles.statsContainer}>
                <SingleStat label="PTS" value={String(game.points)} />
                <SingleStat label="REB" value={String(game.rebounds)} />
                <SingleStat label="AST" value={String(game.assists)} />
                <SingleStat label="FG" value={`${game.fgMade}/${game.fgAttempted}`} />
            </div>
        </article>
    )
}
export default function LastGames({games}: Props)  {
    return (
        <>
            <span className={styles.title}>Últimos 5 partidos</span>
            {games.map((game) => (
                <Game key={game.gameId} game={game}/>
            ))}
        </>
    )
}