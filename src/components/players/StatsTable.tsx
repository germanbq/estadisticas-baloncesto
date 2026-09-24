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
                        <th>2025-2026</th>
                        <th>29.8</th>
                        <th>7.8</th>
                        <th>7</th>
                        <th>0.8</th>
                        <th>8.4</th>
                        <th>1.2</th>
                        <th>0.8</th>
                        <th>1.0</th>
                        <th>59.8</th>
                        <th>42.3</th>
                        <th>+7</th>
                    </tr>
                    <tr>
                        <th>2024-2025</th>
                        <th>28.1</th>
                        <th>8.4</th>
                        <th>7</th>
                        <th>1.4</th>
                        <th>9.1</th>
                        <th>1.1</th>
                        <th>1.1</th>
                        <th>0.9</th>
                        <th>60.3</th>
                        <th>40.3</th>
                        <th>+8.9</th>
                    </tr>
                </tbody>
            </table>
        </>    
    )
}