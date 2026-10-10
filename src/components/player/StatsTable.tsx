import { PlayerProfile } from "@/src/backend/entities/playersEntities";
import styles from "./StatsTable.module.css";


export default function StatsTable({stats}: {stats: PlayerProfile}) {
    return (
        <>
            <span className={styles.title}>Estadísticas completas por temporada</span>
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
        </>    
    )
}