import { PlayerProfile } from "@/src/backend/entities/playersEntities";
import styles from "./StatsTable.module.css";
import { TableProperties } from 'lucide-react';

export default function StatsTable({stats}: {stats: PlayerProfile}) {
    return (
        <section className={styles.section}>
            <span className={styles.title}>
                <TableProperties size={25} strokeWidth={2} aria-hidden="true" />
                Estadísticas completas por temporada
            </span>
            <div className={styles.tableScroll} role="region" aria-label="Estadísticas completas por temporada" tabIndex={0}>
            <table className={styles.table}>
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
                    {stats.seasons.map((season) => (
                        <tr key={season.season}>
                            <th>{`${String(season.season).slice(-2)}/${String(Number(season.season)+1).slice(2)}`}</th>
                            <th>{season.games}</th>
                            <th>{Number(season.points.toFixed(2))}</th>
                            <th>{Number(season.rebounds.toFixed(2))}</th>
                            <th>{Number(season.ofeRebounds.toFixed(2))}</th>
                            <th>{Number(season.defRebounds.toFixed(2))}</th>
                            <th>{Number(season.assists.toFixed(2))}</th>
                            <th>{Number(season.steals.toFixed(2))}</th>
                            <th>{Number(season.blocks.toFixed(2))}</th>
                            <th>{Number(season.turnovers.toFixed(2))}</th>
                            <th>{Number(season.fgPercentage.toFixed(2))}</th>
                            <th>{Number(season.threePercentage.toFixed(2))}</th>
                            <th>{Number(season.plusMinus.toFixed(2))}</th>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>    
    )
}
