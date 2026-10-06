import styles from "./GameCard.module.css";
import Image
 from "next/image";
type GameProps = {
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
}

export default function GameCard(props: GameProps) {
    return (
        <article className={styles.game}>
            <div className={styles.gameLabels}>
                {props.finalizado ? <span>Finalizado</span> : <span>{props.date.toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid",})
}</span>}
                <span>{props.place}</span>
            </div>
            <div className={styles.gameTeams}>
                <div className={styles.teamColumn}>
                    <Image src={props.homeLogo} alt="Logo del local" width={64} height={64}/>
                    <span className={styles.teamName}>{props.homeTeam}</span>
                    <span>({props.homeRecord})</span>
                    <span className={styles.teamScore}>{props.homeScore}</span>
                </div>
                <span className={styles.hour}>
                    {props.date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                <div className={styles.teamColumn}>
                    <Image src={props.awayLogo} alt="Logo del visitante" width={64} height={64}/>
                    <span className={styles.teamName}>{props.awayTeam}</span>
                    <span>({props.awayRecord})</span>
                    <span className={styles.teamScore}>{props.awayScore}</span>
                </div>
            </div>
        </article>
    )
}