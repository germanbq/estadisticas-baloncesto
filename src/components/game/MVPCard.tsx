import { GameMVP } from "@/src/backend/entities/gamesEntities";
import styles from './MVPCard.module.css';
import { CircleStar } from "lucide-react";
import Link from "next/link";

function StatContainer({label, value, color}: {label: string, value: number, color: string}) {
    return (
        <div className={styles.statContainer}>
            <span style={{color: `var(--color-text-primary)`}}>{label}</span>
            <span style={{color}} className={styles.statValue}>{value}</span>
        </div>
    )
}

function BarContainer({label, made, attempted, color}: {label: string, made: number, attempted: number, color: string}) {
    const percentage = attempted > 0 ? (made / attempted) * 100 : 0;
    return (
        <div className={styles.barContainer}>
            <div className={styles.barHeader}>
                <span style={{color: `var(--color-text-primary)`}}>{label} ({percentage.toFixed(1)}%)</span>
                <span className={styles.barValue}>{made}/{attempted}</span>
            </div>
            <div className={styles.barTrack} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, percentage))}>
                <div className={styles.barFill} style={{width: `${Math.max(0, Math.min(100, percentage))}%`, backgroundColor: color}} />
            </div>
        </div>
    )
}

export default function MVPCard({player, home}: {player: GameMVP, home: boolean}) {
    const minutes = Math.floor(player.secondsPlayed / 60);
    const color = home ? `var(--color-blue)` : `var(--color-violet)`;
    return (
        <section className={styles.section}>
            <span className={styles.title}>
                <CircleStar size={25} strokeWidth={2} aria-hidden="true" />
                MVP del partido
            </span>
            <article className={styles.article}>
                <div className={styles.playerData}>
                    <div className={styles.jerseyNumberContainer}>
                        <span className={styles.team} style={{color}}>{player.teamShortName}</span>
                        <span className={styles.jerseyNumber}>#{player.jerseyNumber}</span>
                    </div>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerHeading}>
                            <Link href={`/jugadores/${player.playerId}`} className={styles.playerName}>{player.playerName}</Link>
                            <span className={styles.position} style={{color}}>{player.position}</span>
                        </div>
                        <div className={styles.playerDetails}>
                            <span>{minutes} MIN</span>
                            <span>· Impacto Neto: <span className={styles.impact} style={{color: player.plusMinus < 0 ? 'var(--color-red, #ff7373)' : 'var(--color-green)'}}>{player.plusMinus > 0 ? '+' : ''}{player.plusMinus} +/-</span></span>
                        </div>
                    </div>
                </div>
                <section className={styles.basicStats}>
                    <StatContainer label="Puntos" value={player.points} color={color}/>
                    <StatContainer label="Rebotes" value={player.rebounds} color={color}/>
                    <StatContainer label="Asistencias" value={player.assists} color={color}/>
                    <StatContainer label="Robos" value={player.steals} color={color}/>
                    <StatContainer label="Tapones" value={player.blocks} color={color}/>
                </section>
                <section className={styles.shootingStats}>
                    <BarContainer label="Tiros de Campo" made={player.fgMade} attempted={player.fgAttempted} color={color}/>
                    <BarContainer label="Triples" made={player.threeMade} attempted={player.threeAttempted} color={color}/>
                    <BarContainer label="Tiros Libres" made={player.ftMade} attempted={player.ftAttempted} color={color}/>
                </section>
            </article>
        </section>
    )
}
