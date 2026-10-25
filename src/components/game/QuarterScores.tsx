import styles from "./QuarterScores.module.css";

type QuarterScoresProps = {
    homeName: string;
    awayName: string;
    homeScores: number[],
    awayScores: number[],
    homeTotal: number,
    awayTotal: number,
}

export default function QuarterScores(props: QuarterScoresProps) {
    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Equipo</th>
                    <th>Q1</th>
                    <th>Q2</th>
                    <th>Q3</th>
                    <th>Q4</th>
                    {props.homeScores.map((_,index) => (
                        (index > 3) ? <th key={index}>P{index-3}</th> : ""
                    ))}
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td scope="row">{props.homeName}</td>
                    {props.homeScores.map((score, index) => (
                        <td key={index}>{score}</td>
                    ))}
                    <td className={`${props.homeTotal > props.awayTotal ? styles.green : ''}`}>{props.homeTotal}</td>
                </tr>
                <tr>
                    <td scope="row">{props.awayName}</td>
                    {props.awayScores.map((score, index) => (
                        <td key={index}>{score}</td>
                    ))}
                    <td className={`${props.awayTotal > props.homeTotal ? styles.green : ''}`}>{props.awayTotal}</td>
                </tr>
            </tbody>
        </table>
    )
}