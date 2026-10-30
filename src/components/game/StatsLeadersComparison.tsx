import { StatLeader } from '@/src/backend/entities/gamesEntities';
import styles from './StatsLeadersComparison.module.css';
import BarsComparison, { calculatePercentagesStatsComparison } from './BarsComparison';
import { CircleStar } from 'lucide-react';
import SimulatedStats from '../SimulatedStats';

function LeaderComparisonCard({homeLeader, awayLeader, homeName, awayName}:
                {homeLeader: StatLeader, awayLeader: StatLeader, homeName: string, awayName: string}) 
{
    const { homePercentage, awayPercentage } = calculatePercentagesStatsComparison({
        label: homeLeader.metric,
        homeValue: homeLeader.value,
        awayValue: awayLeader.value,
    });
    return (
        <article className={styles.card}>
            <span style={{color: `var(--color-text-primary)`}}>{homeLeader.metric} / Partido</span>
            <div className={styles.cardContent}>
                <div className={styles.data}>
                    <div className={styles.teamData}>
                        <div className={styles.jerseyNumberContainer}>
                            <span className={styles.team} style={{color: `var(--color-blue)`}}>{homeName}</span>
                            <span className={styles.jerseyNumber}>#{homeLeader.jerseyNumber}</span>
                        </div>
                        <div className={styles.player}>
                            <span>{homeLeader.name}</span>
                            <span style={{color: `var(--color-blue)`}}>{Number(homeLeader.value.toFixed(2))}</span>
                        </div>
                    </div>
                    <div className={styles.teamData}>
                        <div className={styles.jerseyNumberContainer}>
                            <span className={styles.team} style={{color: `var(--color-violet)`}}>{awayName}</span>
                            <span className={styles.jerseyNumber}>#{awayLeader.jerseyNumber}</span>
                        </div>
                        <div className={styles.player}>
                            <span>{awayLeader.name}</span>
                            <span style={{color: `var(--color-violet)`}}>{Number(awayLeader.value.toFixed(2))}</span>
                        </div>
                    </div>
                </div>
                <BarsComparison homePercentage={homePercentage} awayPercentage={awayPercentage} />
            </div>
        </article>
    )
}

export default function StatsLeadersComparison({homeLeaders, awayLeaders, homeName, awayName}: 
                {homeLeaders: StatLeader[], awayLeaders: StatLeader[], homeName: string, awayName: string}) 
{
    return (
        <section className={styles.cardContainer}>
            <span className={styles.title}>
                <CircleStar size={25} strokeWidth={2} aria-hidden="true" />
                Líderes estadísticos
                <SimulatedStats />
            </span>

            <div className={styles.cards}>
            {homeLeaders.map((homeLeader) => {
                const awayLeader = awayLeaders.find(
                    (leader) => leader.metric === homeLeader.metric
                );
                if (!awayLeader) return null;
                return (
                    <LeaderComparisonCard key={homeLeader.metric} homeLeader={homeLeader} awayLeader={awayLeader} homeName={homeName} awayName={awayName} />
                )
            })}
            </div>
        </section>
    )
}
