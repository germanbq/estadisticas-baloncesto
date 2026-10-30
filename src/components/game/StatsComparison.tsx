import SimulatedStats from '../SimulatedStats';
import BarsComparison, { calculatePercentagesStatsComparison } from './BarsComparison';
import styles from './StatsComparison.module.css';
import { ChartBar } from "lucide-react";

type StatsComparisonProps = {
    homeName: string;
    homeVictorys: number;
    homeLosses: number;
    homeWinRate: number;
    homePointsPerGame: number;
    homePointsAllowedPerGame: number;
    homeNetRating: number;
    homeStreakNumber: number;
    homeStreakVictory: boolean;
    awayName: string;
    awayVictorys: number;
    awayLosses: number;
    awayWinRate: number;
    awayPointsPerGame: number;
    awayPointsAllowedPerGame: number;
    awayNetRating: number;
    awayStreakNumber: number;
    awayStreakVictory: boolean;
};

export type StatsComparisonRowProps = {
    label: string;
    homeValue: number;
    awayValue: number;
    secondHomeValue?: number;
    secondAwayValue?: number;
    factor?: number;
};

function StatsComparisonRow(props: StatsComparisonRowProps) {
    const {homePercentage, awayPercentage} = calculatePercentagesStatsComparison(props);
    return (
        <div className={styles.statsComparisonRow}>
            <div className={styles.rowSpans}>
                <span className={styles.homeValue}>{Number(props.homeValue.toFixed(2))}{props.secondHomeValue !== undefined && `-${props.secondHomeValue}`}</span>
                <span>{props.label}</span>
                <span className={styles.awayValue}>{Number(props.awayValue.toFixed(2))}{props.secondAwayValue !== undefined && `-${props.secondAwayValue}`}</span>
            </div>
            <BarsComparison homePercentage={homePercentage} awayPercentage={awayPercentage} />
        </div>
    )
}
export default function StatsComparison(props: StatsComparisonProps) {
    return (
        <div className={styles.comparisonBlock}>
            <span className={styles.title}>
                <ChartBar size={25} strokeWidth={2} aria-hidden="true" />
                Métricas Comparativas
                <SimulatedStats />
            </span>
            <section className={styles.statsComparison}>
                <div className={styles.teamNames}>
                    <span className={styles.homeName}>{props.homeName} (Local)</span>
                    <span className={styles.awayName}>{props.awayName} (Visitante)</span>
                </div>
                <StatsComparisonRow label="Balance" homeValue={props.homeVictorys} awayValue={props.awayVictorys} secondHomeValue={props.homeLosses} secondAwayValue={props.awayLosses}/>
                <StatsComparisonRow label="% Victorias" homeValue={props.homeWinRate} awayValue={props.awayWinRate} />
                <StatsComparisonRow label="Puntos / Partido (PPG)" homeValue={props.homePointsPerGame} awayValue={props.awayPointsPerGame} factor={3}/>
                <StatsComparisonRow label="Puntos recibidos / Partido (PAPG)" homeValue={props.homePointsAllowedPerGame} awayValue={props.awayPointsAllowedPerGame} factor={3}/>
                <StatsComparisonRow label="Net Rating" homeValue={props.homeNetRating} awayValue={props.awayNetRating} />
                <div className={styles.rowSpans}>
                    <div className={styles.homeStreak}>{props.homeStreakVictory ? "W" : "L"}{props.homeStreakNumber}</div>
                    <span>Racha actual</span>
                    <div className={styles.awayStreak}>{props.awayStreakVictory ? "W" : "L"}{props.awayStreakNumber}</div>
                </div>
            </section>
        </div>
    )
}