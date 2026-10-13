import BarsComparison from './BarsComparison';
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

type StatsComparisonRowProps = {
    label: string;
    homeValue: number;
    awayValue: number;
    secondHomeValue?: number;
    secondAwayValue?: number;
    factor?: number;
};

function StatsComparisonRow(props: StatsComparisonRowProps) {
    let homePercentage, awayPercentage;
    if (props.secondHomeValue !== undefined && props.secondAwayValue !== undefined) {
        const totalHomeValue = props.homeValue + props.secondHomeValue;
        const totalAwayValue = props.awayValue + props.secondAwayValue;

        const homeRate = totalHomeValue > 0 ? props.homeValue / totalHomeValue : 0;
        const awayRate = totalAwayValue > 0 ? props.awayValue / totalAwayValue : 0;
        const totalRate = homeRate + awayRate;

        homePercentage = totalRate > 0 ? (homeRate / totalRate) * 100 : 50;
        awayPercentage = 100 - homePercentage;
    } else if(props.label === "Net Rating") {
        const difference = props.homeValue - props.awayValue;
        const sensitivity = 2;

        homePercentage = Math.max(
            0,
            Math.min(100, 50 + difference * sensitivity)
        );

        awayPercentage = 100 - homePercentage;
    }else {
        const total = props.homeValue + props.awayValue;
        const proportion = total > 0
            ? (props.homeValue / total) * 100
            : 50;

        const factor = props.factor ?? 1;
        homePercentage = Math.max( 0, Math.min(100, 50 + (proportion - 50) * factor));
        awayPercentage = 100 - homePercentage;
    }
    return (
        <div className={styles.statsComparisonRow}>
            <div className={styles.rowSpans}>
                <span className={styles.homeValue}>{Number(props.homeValue.toFixed(2))}{props.secondHomeValue && `-${props.secondHomeValue}`}</span>
                <span>{props.label}</span>
                <span className={styles.awayValue}>{Number(props.awayValue.toFixed(2))}{props.secondAwayValue && `-${props.secondAwayValue}`}</span>
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