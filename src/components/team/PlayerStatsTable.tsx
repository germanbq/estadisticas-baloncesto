import stylesTable from "../player/StatsTable.module.css";
import styles from "./PlayerStatsTable.module.css";
import { TableProperties } from 'lucide-react';
import { teamPlayersStats } from "@/src/backend/entities/teamsEntities";
import Link from "next/link";

export default function PlayerStatsTable({players}: {players: teamPlayersStats[]}) {
    return (
        <section className={stylesTable.section}>
            <span className={stylesTable.title}>
                <TableProperties size={25} strokeWidth={2} aria-hidden="true" />
                Estadísticas de los jugadores
            </span>
            <div className={stylesTable.tableScroll} role="region" aria-label="Estadísticas completas por temporada" tabIndex={0}>
            <table className={stylesTable.table}>
                <thead>
                    <tr>
                        <th>Temporada</th>
                        <th>Partidos</th>
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
                    {players.map((player) => (
                        <tr key={player.playerId}>
                            <th><Link href={`/jugadores/${player.playerId}`} className={styles.name}>{player.playerName}</Link></th>
                            <th>{player.games}</th>
                            <th>{Number(player.points.toFixed(2))}</th>
                            <th>{Number(player.rebounds.toFixed(2))}</th>
                            <th>{Number(player.ofeRebounds.toFixed(2))}</th>
                            <th>{Number(player.defRebounds.toFixed(2))}</th>
                            <th>{Number(player.assists.toFixed(2))}</th>
                            <th>{Number(player.steals.toFixed(2))}</th>
                            <th>{Number(player.blocks.toFixed(2))}</th>
                            <th>{Number(player.turnovers.toFixed(2))}</th>
                            <th>{Number(player.fgPercentage.toFixed(2))}</th>
                            <th>{Number(player.threePercentage.toFixed(2))}</th>
                            <th>{Number(player.plusMinus.toFixed(2))}</th>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>    
    )
}
