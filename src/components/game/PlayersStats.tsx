import StatsDataNotice from "../StatsDataNotice";
import { PlayerStats } from '@/src/backend/entities/gamesEntities';
import styles from './PlayersStats.module.css';
import Link from 'next/link';

export default function PlayersStats({homePlayers, awayPlayers, homeName, awayName}:
                {homePlayers: PlayerStats[], awayPlayers: PlayerStats[], homeName: string, awayName: string}) 
{
    return (
        <>
            {[
                { name: homeName, players: homePlayers, side: 'home' },
                { name: awayName, players: awayPlayers, side: 'away' },
            ].map((team) => (
            <section key={team.side} className={`${styles.section} ${team.side === 'home' ? styles.home : styles.away}`}>
                <div className={styles.heading}>
                    <h2 className={styles.title}>{team.name}</h2>
                    <StatsDataNotice context={`Estadísticas de jugadores de ${team.name}`} />
                    <span className={styles.badge}>{team.side === 'home' ? 'Local' : 'Visitante'}</span>
                </div>
                <div className={styles.tableScroll} role="region" aria-label={`Estadísticas de jugadores de ${team.name}`} tabIndex={0}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Jugador</th>
                            <th>Minutos</th>
                            <th>Puntos</th>
                            <th>Rebotes</th>
                            <th>Rebotes Ofe</th>
                            <th>Rebotes Def</th>
                            <th>Asistencias</th>
                            <th>Robos</th>
                            <th>Tapones</th>
                            <th>Pérdidas</th>
                            <th>FG%</th>
                            <th>3P%</th>
                            <th>+/-</th>
                        </tr>    
                    </thead>
                    <tbody>
                        {team.players.map((player) => (
                            <tr key={player.playerId}>
                                <th scope="row"><Link href={`/jugadores/${player.playerId}`} className={styles.playerName}>{player.name}</Link></th>
                                <td>{Math.floor(player.secondsPlayed / 60)}:{String(player.secondsPlayed % 60).padStart(2, '0')}</td>
                                <td>{player.points}</td>
                                <td>{player.rebounds}</td>
                                <td>{player.ofeRebounds}</td>
                                <td>{player.defRebounds}</td>
                                <td>{player.assists}</td>
                                <td>{player.steals}</td>
                                <td>{player.blocks}</td>
                                <td>{player.turnovers}</td>
                                <td>{player.fgPercentage.toFixed(1)}%</td>
                                <td>{player.threePercentage.toFixed(1)}%</td>
                                <td>{player.plusMinus > 0 ? '+' : ''}{player.plusMinus}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </section>
            ))}
        </>
    )
}
