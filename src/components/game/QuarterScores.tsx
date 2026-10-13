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
                    <th>{props.homeName}</th>
                    {props.homeScores.map((score, index) => (
                        <th key={index}>{score}</th>
                    ))}
                    <th className={`${props.homeTotal > props.awayTotal ? styles.green : ''}`}>{props.homeTotal}</th>
                </tr>
                <tr>
                    <th>{props.awayName}</th>
                    {props.awayScores.map((score, index) => (
                        <th key={index}>{score}</th>
                    ))}
                    <th className={`${props.awayTotal > props.homeTotal ? styles.green : ''}`}>{props.awayTotal}</th>
                </tr>
            </tbody>
        </table>
    )
}