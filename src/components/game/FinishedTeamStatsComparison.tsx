import { GameTeamStats } from '@/src/backend/entities/gamesEntities';
import styles from './FinishedTeamStatsComparison.module.css';
import { ChartBar } from "lucide-react";
import BarsComparison from './BarsComparison';

type StatComparisonRowProps = {
    label: string;
    homeValue: number;
    awayValue: number;
    secondHomeValue?: string;
    secondAwayValue?: string;
    factor?: number;
    isPercentage?: boolean;
};

function StatComparisonRow(props: StatComparisonRowProps) {
    let homePercentage, awayPercentage;
    if(props.label === "Offensive Rating" || props.label === "Defensive Rating") {
        const difference = props.label === "Defensive Rating"
            ? props.awayValue - props.homeValue
            : props.homeValue - props.awayValue;
        const sensitivity = 1.3;

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
        <div>
            <div className={styles.rowSpans}>
                <span className={styles.homeValue}>
                    {Number(props.homeValue.toFixed(2))}{props.isPercentage && "%"}
                    <span className={styles.secondValue}>{props.secondHomeValue && ` (${props.secondHomeValue})`}</span>
                </span>
                <span>{props.label}</span>
                <span className={styles.awayValue}>
                    <span className={styles.secondValue}>{props.secondAwayValue && `(${props.secondAwayValue}) `}</span>
                    {Number(props.awayValue.toFixed(2))}{props.isPercentage && "%"}
                </span>
            </div>
            <BarsComparison homePercentage={homePercentage} awayPercentage={awayPercentage} />
        </div>
    )
}

function StatContainer({label, homeValue, awayValue}: {label: string, homeValue: number, awayValue: number}) {
    return (
        <div className={styles.statContainer}>
            <span className={styles.statContainerLabel}>{label}</span>
            <div className={styles.statContainerValues}> 
                <span style={{color: `var(--color-blue)`}}>{homeValue}</span> 
                /
                <span style={{color: `var(--color-violet)`}}>{awayValue}</span>
            </div>
        </div>
    )
}

export default function FinishedTeamStatsComparison({homeStats, awayStats, homeName, awayName}:
                {homeStats: GameTeamStats, awayStats: GameTeamStats, homeName: string, awayName: string}) 
{
    return (
        <section className={styles.comparisonBlock}>
            <span className={styles.title}>
                <ChartBar size={25} strokeWidth={2} aria-hidden="true" />
                Comparativa de equipos
            </span>
            <article className={styles.statsComparison}>
                <div className={styles.teamNames}>
                    <span className={styles.homeName}>{homeName} (Local)</span>
                    <span className={styles.awayName}>{awayName} (Visitante)</span>
                </div>
                <StatComparisonRow label="Tiros de campo (FG)" homeValue={homeStats.fgAttempted > 0 ? Number((100 * homeStats.fgMade / homeStats.fgAttempted).toFixed(2)) : 0} awayValue={awayStats.fgAttempted > 0 ? Number((100 * awayStats.fgMade / awayStats.fgAttempted).toFixed(2)) : 0} secondHomeValue={`${homeStats.fgMade}/${homeStats.fgAttempted}`} secondAwayValue={`${awayStats.fgMade}/${awayStats.fgAttempted}`} isPercentage />
                <StatComparisonRow label="Triples (3PT)" homeValue={homeStats.threeAttempted > 0 ? Number((100 * homeStats.threeMade / homeStats.threeAttempted).toFixed(2)) : 0} awayValue={awayStats.threeAttempted > 0 ? Number((100 * awayStats.threeMade / awayStats.threeAttempted).toFixed(2)) : 0} secondHomeValue={`${homeStats.threeMade}/${homeStats.threeAttempted}`} secondAwayValue={`${awayStats.threeMade}/${awayStats.threeAttempted}`} isPercentage/>
                <StatComparisonRow label="Tiros libres (FT)" homeValue={homeStats.ftAttempted > 0 ? Number((100 * homeStats.ftMade / homeStats.ftAttempted).toFixed(2)) : 0} awayValue={awayStats.ftAttempted > 0 ? Number((100 * awayStats.ftMade / awayStats.ftAttempted).toFixed(2)) : 0} secondHomeValue={`${homeStats.ftMade}/${homeStats.ftAttempted}`} secondAwayValue={`${awayStats.ftMade}/${awayStats.ftAttempted}`} isPercentage/>
                <StatComparisonRow label="Effective Field Goal (eFG%)" homeValue={homeStats.effectiveFieldGoal} awayValue={awayStats.effectiveFieldGoal} isPercentage/>
                <StatComparisonRow label="True shooting (TS%)" homeValue={homeStats.trueShooting} awayValue={awayStats.trueShooting} isPercentage/>
                <StatComparisonRow label="Offensive Rating" homeValue={homeStats.offensiveRating} awayValue={awayStats.offensiveRating} />
                <StatComparisonRow label="Defensive Rating" homeValue={homeStats.defensiveRating} awayValue={awayStats.defensiveRating} />
                <StatComparisonRow label="Puntos en la pintura" homeValue={homeStats.paintPoints} awayValue={awayStats.paintPoints} />
                <StatComparisonRow label="Puntos al contraataque" homeValue={homeStats.fastbreakPoints} awayValue={awayStats.fastbreakPoints} />
                <StatComparisonRow label="Puntos del banquillo" homeValue={homeStats.benchPoints} awayValue={awayStats.benchPoints} />
                <StatComparisonRow label="Puntos de segunda oportunidad" homeValue={homeStats.secondChancePoints} awayValue={awayStats.secondChancePoints} />
                <section className={styles.statsContainers}>
                    <StatContainer label="Rebotes" homeValue={homeStats.rebounds} awayValue={awayStats.rebounds} />
                    <StatContainer label="Asistencias" homeValue={homeStats.assists} awayValue={awayStats.assists} />
                    <StatContainer label="Robos" homeValue={homeStats.steals} awayValue={awayStats.steals} />
                    <StatContainer label="Tapones" homeValue={homeStats.tapones} awayValue={awayStats.tapones} />
                    <StatContainer label="Pérdidas" homeValue={homeStats.turnovers} awayValue={awayStats.turnovers} />
                    <StatContainer label="Faltas personales" homeValue={homeStats.personalFouls} awayValue={awayStats.personalFouls} />
                </section>
             </article>
        </section>
    )
}
