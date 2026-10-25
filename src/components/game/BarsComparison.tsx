import styles from './BarsComparison.module.css';
import { StatsComparisonRowProps } from './StatsComparison';

export function calculatePercentagesStatsComparison(props: StatsComparisonRowProps) {
    let homePercentage, awayPercentage;
    if (props.secondHomeValue !== undefined && props.secondAwayValue !== undefined) {
        const totalHomeValue = props.homeValue + props.secondHomeValue;
        const totalAwayValue = props.awayValue + props.secondAwayValue;

        const homeRate = totalHomeValue > 0 ? props.homeValue / totalHomeValue : 0;
        const awayRate = totalAwayValue > 0 ? props.awayValue / totalAwayValue : 0;
        const totalRate = homeRate + awayRate;

        homePercentage = totalRate > 0 ? (homeRate / totalRate) * 100 : 50;
        awayPercentage = 100 - homePercentage;
    } else if(props.label === "Net Rating" || props.label === "Offensive Rating" || props.label === "Defensive Rating") {
            const difference = props.label === "Defensive Rating"
                ? props.awayValue - props.homeValue
                : props.homeValue - props.awayValue;        const sensitivity = 1.3;

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
    return {homePercentage, awayPercentage};
}

export default function BarsComparison({homePercentage, awayPercentage}: {homePercentage: number, awayPercentage: number}) {
    return (
        <div className={styles.barContainer}>
            <div className={styles.homeBar} style={{ width: `${homePercentage}%` }}></div>
            <div className={styles.awayBar} style={{ width: `${awayPercentage}%` }}></div>
        </div>
    )
}