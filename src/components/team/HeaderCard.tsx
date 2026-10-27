import StatsDataNotice from "../StatsDataNotice";
import Image from 'next/image';
import { Flame } from 'lucide-react';
import styles from './HeaderCard.module.css';
import { TeamHeader } from '@/src/backend/entities/teamsEntities';
import FavoriteButton from '../FavoriteButton';

function RecordStat({label, wins, losses}: {label: string; wins: number; losses: number}) {
    const total = wins + losses;
    return (
        <div className={styles.stat}>
            <span className={styles.label}>{label}</span>
            <strong className={styles.value}>{wins}-{losses}</strong>
            <span className={styles.detail}>
                {(total > 0 ? wins / total : 0).toFixed(3)} VICTORIAS
            </span>
        </div>
    );
}

export default function HeaderCard(team: TeamHeader) {
    const positionClass = team.rank <= 6 ? styles.playoffs : team.rank <= 10 ? styles.playin : styles.out;
    const conference = team.conference === 'East' ? 'Este' : team.conference === 'West' ? 'Oeste' : team.conference;
    return (
        <section className={styles.card} aria-label={`Resumen de ${team.name}`}>
            <div className={styles.badges}>
                <StatsDataNotice context={`Resumen de ${team.name}`} />
                <span className={styles.recordBadge}>
                    <span className={`${styles.dot} ${positionClass}`} aria-hidden="true" />
                    #{team.rank} {conference} ·{' '}
                    {team.victorys}-{team.losses} ({(team.winRate / 100).toFixed(3)})
                </span>
                <span className={`${styles.streakBadge} ${!team.streakVictory ? styles.losing : ''}`}>
                    <Flame size={15} aria-hidden="true" />
                    Racha {team.streakVictory ? 'W' : 'L'}{team.streakNumber}
                </span>
                <div className={styles.favorite}>
                    <FavoriteButton type="equipos" itemId={team.id} isFavorite={team.isFavorite} />
                </div>
            </div>

            <div className={styles.identity}>
                <div className={styles.logoBox}>
                    <Image src={team.logo} alt={`Escudo de ${team.name}`} width={68} height={68} />
                </div>
                <div className={styles.teamInfo}>
                    <h1 data-testid="team-name" className={styles.name}>{team.name}</h1>
                    <p className={styles.description}>
                        División {team.division}
                        {` · ${team.stadium}`}
                        {` · Entrenador: ${team.coach}`}
                    </p>
                </div>
            </div>

            <div className={styles.stats}>
                <RecordStat label="Local" wins={team.homeVictorys} losses={team.homeLosses} />
                <RecordStat label="Visitante" wins={team.awayVictorys} losses={team.awayLosses} />
                <div className={`${styles.stat} ${styles.difference}`}>
                    <span className={styles.label}>Dif. puntos</span>
                    <strong className={styles.value}>{team.difference > 0 ? '+' : ''}{team.difference.toFixed(1)}</strong>
                    <span className={styles.detail}>POR PARTIDO</span>
                </div>
            </div>
        </section>
    );
}
