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
                            <th>{season.points}</th>
                            <th>{season.rebounds}</th>
                            <th>{season.ofeRebounds}</th>
                            <th>{season.defRebounds}</th>
                            <th>{season.assists}</th>
                            <th>{season.steals}</th>
                            <th>{season.blocks}</th>
                            <th>{season.turnovers}</th>
                            <th>{season.fgPercentage}</th>
                            <th>{season.threePercentage}</th>
                            <th>{season.plusMinus}</th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>    
    )
}