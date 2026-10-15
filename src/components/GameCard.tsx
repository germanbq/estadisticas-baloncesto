import styles from "./GameCard.module.css";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";
import { ReactNode } from "react";
import Link from "next/link";

type LinkProps =
    | {
        teamLinks: true;
        homeId: number;
        awayId: number;
    }
    | {
        teamLinks?: false;
        homeId?: never;
        awayId?: never;
    };

type GameProps = {
    id: number;
    isFavorite: boolean;
    onFavoriteChange?: (fav: boolean) => void;
    disabled?: boolean;
    finalizado: boolean;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    homeRecord: string;
    awayRecord: string;
    homeLogo: string;
    awayLogo: string;
    place: string;
    date: Date;
    children?: ReactNode;
    featured?: boolean;
} & LinkProps;

export default function GameCard(props: GameProps) {
    return (
        <article className={`${styles.game} ${props.featured ? styles.featured : ''}`}>
            <div className={styles.gameLabels}>
                {props.finalizado ? <span>Finalizado</span> 
                    : <span>{props.date.toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid",})}</span>}
                <span>{props.place}</span>
                <FavoriteButton type="partidos" itemId={props.id} isFavorite={props.isFavorite} onFavoriteChange={props.onFavoriteChange} disabled={props.disabled}/>
            </div>
            <div className={styles.gameTeams}>
                <div className={styles.teamColumn}>
                    <Image src={props.homeLogo} alt="Logo del local" width={64} height={64}/>
                    {props.teamLinks ? <Link href={`/equipos/${props.homeId}`} className={styles.teamName}>{props.homeTeam}</Link>
                                : <span className={styles.teamName}>{props.homeTeam}</span>}
                    <span>({props.homeRecord})</span>
                    <span className={`${styles.teamScore} ${(props.homeScore && props.awayScore) && props.homeScore > props.awayScore ? styles.green : ''}`}>{props.homeScore}</span>
                </div>
                {!props.finalizado ? <span className={styles.hour}>{props.date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"})} </span>
                : <div className={styles.versus}>
                    <span>VS</span>
                    <span>FINAL</span>
                </div>}
                <div className={styles.teamColumn}>
                    <Image src={props.awayLogo} alt="Logo del visitante" width={64} height={64}/>
                    {props.teamLinks ? <Link href={`/equipos/${props.awayId}`} className={styles.teamName}>{props.awayTeam}</Link>
                                : <span className={styles.teamName}>{props.awayTeam}</span>}
                    <span>({props.awayRecord})</span>
                    <span className={`${styles.teamScore} ${(props.homeScore && props.awayScore) && props.homeScore < props.awayScore ? styles.green : ''}`}>{props.awayScore}</span>
                </div>
            </div>
            {props.children}
        </article>
    )
}
