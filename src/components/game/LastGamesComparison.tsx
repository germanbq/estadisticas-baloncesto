import { LastTeamGame } from "@/src/backend/entities/gamesEntities";
import styles from './LastGamesComparison.module.css';
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import SimulatedStats from "../SimulatedStats";

function Game(props: LastTeamGame) {
    const result = props.home ? `${props.score}-${props.rivalScore}` : `${props.rivalScore}-${props.score}`;
    const victory = props.score > props.rivalScore;
    return (
        <Link href={`/partidos/${props.id}`} className={styles.articleGame}>
            <div className={styles.data}>
                <div className={styles.won} style={{
                    color: victory ? 'var(--color-green)' : 'var(--color-text-primary)',
                    backgroundColor: victory ? 'var(--color-background-green)' : 'var(--color-background-red)',
                }}>{victory ? "W" : "L"}</div>
                <div className={styles.spans}>
                    <span>{props.home ? "vs" : "@"} {props.rivalName}</span>
                    <span className={styles.stadium}>{props.stadium}</span>
                </div>
            </div>
            <div className={styles.resultSpans}>
                <span className={styles.result} style={{color: victory ? 'var(--color-green)' : 'var(--color-text-primary)',}}>{result}</span>
                <span className={styles.final}>Final</span>
            </div>
        </Link>
    )
}

export default function LastGamesComparison({homeGames, awayGames, homeName, awayName}: 
                                    {homeGames: LastTeamGame[], awayGames: LastTeamGame[], homeName: string, awayName: string}) {
    return (
        <div className={styles.comparisonBlock}>
            <span className={styles.title}>
                <CalendarDays size={25} strokeWidth={2} aria-hidden="true" />
                Estado de forma
                <SimulatedStats />
            </span>
            <section className={styles.games}>
                <section className={styles.homeGames}>
                    <span style={{color: `var(--color-blue)`}} className={styles.teamNames}>{homeName}</span>
                    {homeGames.map((game, index) => (
                        <Game key={index} {...game} />
                    ))}
                </section>
                <section className={styles.awayGames}>
                    <span style={{color: `var(--color-violet)`}} className={styles.teamNames}>{awayName}</span>
                    {awayGames.map((game, index) => (
                        <Game key={index} {...game} />
                    ))}
                </section>
            </section>
        </div>
    )
}
