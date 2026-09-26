import styles from "./StatsTable.module.css";


export default function StatsTable() {
    return (
        <>
            <span className={styles.title}>Estadísticas completas por temporada</span>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Temporada</th>
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
                    <tr>
                        <td>2025-2026</td>
                        <td>29.8</td>
                        <td>7.8</td>
                        <td>7</td>
                        <td>0.8</td>
                        <td>8.4</td>
                        <td>1.2</td>
                        <td>0.8</td>
                        <td>1.0</td>
                        <td>59.8</td>
                        <td>42.3</td>
                        <td>+7</td>
                    </tr>
                    <tr>
                        <td>2024-2025</td>
                        <td>28.1</td>
                        <td>8.4</td>
                        <td>7</td>
                        <td>1.4</td>
                        <td>9.1</td>
                        <td>1.1</td>
                        <td>1.1</td>
                        <td>0.9</td>
                        <td>60.3</td>
                        <td>40.3</td>
                        <td>+8.9</td>
                    </tr>
                </tbody>
            </table>
        </>    
    )
}