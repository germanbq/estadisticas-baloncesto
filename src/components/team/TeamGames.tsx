import { LastTeamGame } from "@/src/backend/entities/gamesEntities";
import styles from './TeamGames.module.css';
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UpcomingTeamGames } from "@/src/backend/entities/teamsEntities";

function FinishedGame(props: LastTeamGame) {
    const result = props.home ? `${props.score}-${props.rivalScore}` : `${props.rivalScore}-${props.score}`;
    const victory = props.score > props.rivalScore;
    return (
        <Link data-testid="last-games" href={`/partidos/${props.id}`} className={styles.articleGame}>
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

function UpcomingGame(props: UpcomingTeamGames) {
    const date = new Date(props.date);
    const formattedDate = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Madrid',
    });
    const time = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid',
    });

    return (
        <Link data-testid="upcoming-games" href={`/partidos/${props.id}`} className={styles.articleGame}>
            <div className={styles.data}>
                <div className={`${styles.won} ${styles.rivalLogoBox}`}>
                    <Image src={props.rivalLogo} alt={`Escudo de ${props.rivalName}`} width={48} height={48} className={styles.rivalLogo} />
                </div>
                <div className={styles.spans}>
                    <span>{props.home ? "vs" : "@"} {props.rivalName}</span>
                    <span className={styles.stadium}>{props.stadium}</span>
                </div>
            </div>
            <time dateTime={date.toISOString()} className={styles.resultSpans}>
                <span className={styles.result}>{formattedDate}</span>
                <span className={styles.final}>{time}</span>
            </time>
        </Link>
    );
}

export default function TeamGames({finishedGames, upcomingGames}: 
                                    {finishedGames: LastTeamGame[], upcomingGames: UpcomingTeamGames[]}) {
    return (
        <div className={styles.comparisonBlock}>
            <span className={styles.title}>
                <CalendarDays size={25} strokeWidth={2} aria-hidden="true" />
                Partidos del equipo
            </span>
            <section className={styles.games}>
                <section className={styles.finishedGames}>
                    <span className={styles.gamesSpan}>Últimos partidos</span>
                    {finishedGames.map((game, index) => (
                        <FinishedGame key={index} {...game} />
                    ))}
                </section>
                <section className={styles.upcomingGames}>
                    <span className={styles.gamesSpan}>Próximos partidos</span>
                    {upcomingGames.map((game) => (
                        <UpcomingGame key={game.id} {...game} />
                    ))}
                </section>
            </section>
        </div>
    )
}
