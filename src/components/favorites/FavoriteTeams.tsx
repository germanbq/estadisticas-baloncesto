import { Team } from "@/src/backend/entities/teamsEntities";
import styles from "./FavoriteTeams.module.css";
import Image from "next/image";
import FavoriteButton from "../FavoriteButton";
import SingleStat from "../SingleStat";
import { useEffect, useState } from "react";
import { FavoriteTeam } from "@/src/backend/entities/favoritesEntities";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type TeamCardProps = {
    team: FavoriteTeam;
    onFavoriteChange: (fav: boolean) => void;
    disabled: boolean;
}
function TeamCard(props: TeamCardProps) {
    const positionClass = props.team.position <= 6 ? styles.playoffs
                                : props.team.position <= 10 ? styles.playin
                                    : styles.eliminated;

    const matchDate = props.team.nextMatchDate ? new Date(props.team.nextMatchDate).toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", timeZone: "Europe/Madrid",})
                                                : undefined
    return (
        <article className={styles.article}>
            <div className={styles.articleHeader} >
                <div className={styles.information}>
                    <Image src={props.team.logo} alt={`Logo de ${props.team.name}`} width={80} height={80} />
                    <div className={styles.spans}>
                        <span>{props.team.name}</span>
                        <span className={positionClass}>#{props.team.position} {props.team.victorys}-{props.team.losses}</span>
                        <span className={props.team.streakVictory ? styles.positive : styles.negative}>{props.team.streakVictory ? "W" : "L"}{props.team.streakNumber}</span>
                    </div>
                </div>
                <Link href={`/favoritos?selected=Teams`} className={styles.profileLink}>
                    Ver ficha completa(no funciona todavia)
                    <ArrowRight size={18} />
                </Link>
            </div>
            <div className={styles.statsContainer}>
                    <SingleStat label="net rating" value={Number(props.team.netRating.toFixed(2))} color={props.team.netRating > 0 ? "var(--color-green)" : "var(--color-text-primay)"}/>
                    <SingleStat label="ppg" value={Number(props.team.pointsPerGame.toFixed(2))} />
                    <SingleStat label="papg" value={Number(props.team.pointsAllowedPerGame.toFixed(2))} />
                    <SingleStat label="home record" value={`${props.team.homeVictorys}-${props.team.homeLosses}`} />
                    <SingleStat label="away record" value={`${props.team.victorys - props.team.homeVictorys}-${props.team.losses - props.team.homeLosses}`} />
                    <SingleStat label="próximo partido" value={props.team.nextMatch} smallValue={matchDate} color="var(--color-blue)"/>
                </div>
            <div className={styles.favorite}>
                <FavoriteButton type="equipos" itemId={props.team.id} isFavorite={props.team.isFavorite} onFavoriteChange={props.onFavoriteChange} disabled={props.disabled}/>
            </div>
        </article>
    )
}

export default function FavoriteTeams({onFavoriteChange, disabled}: 
                                {onFavoriteChange: (fav: boolean) => void, disabled: boolean}) {

    const [teams, setTeams] = useState<FavoriteTeam[]>([])
        
    useEffect(() => {
        const controller = new AbortController();
                
        async function loadFavoriteTeams() {
            try {
                const response = await fetch(`/api/favoritos/equipos`,
                    { signal: controller.signal });
                const result = await response.json();
                        
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }
        
                setTeams(result.data);
            }
            catch(error) {
                if (controller.signal.aborted) return;
                console.error(error);
            }
        }
        
        void loadFavoriteTeams();
        return () => controller.abort();
    }, []);
    
    return (
        <section className={styles.section}>
            {teams.map((team) => (
                <TeamCard key={team.id} team={team} onFavoriteChange={onFavoriteChange} disabled={disabled} />
            ))}
        </section>
    )
}