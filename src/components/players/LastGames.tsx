import styles from "./LastGames.module.css";

type SingleStatProps = {
    label: string;
    value: string;
}

type GameProps = {
    pts: string;
    reb: string;
    ast: string;
    mins: string;
    fg: string;
    home: boolean;
    rival: string;
    result: string;
    win: boolean;
    date: string;
}

function SingleStat({label, value}: SingleStatProps) {
    return (
        <div className={styles.stat}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={styles.value}>{value}</dd>
        </div>
    )
}

function Game(gameProps: GameProps) {
    return (
        <article className={styles.article}>
            <div className={styles.articleHeader}>
                <span className={styles.dot} style={{ backgroundColor: gameProps.win ? "#22c55e" : "#ef4444" }}/>
                {gameProps.home ? <span>{`VS ${gameProps.rival}`}</span> : <span>{`@ ${gameProps.rival}`}</span>}
                {gameProps.win ? <span>{`(W ${gameProps.result})`}</span> : <span>{`(L ${gameProps.result})`}</span>}
                <span className={styles.date}>{`${gameProps.date} · ${gameProps.mins} MIN`}</span>
            </div>
            <div className={styles.statsContainer}>
                <SingleStat label="PTS" value={gameProps.pts} />
                <SingleStat label="REB" value={gameProps.reb} />
                <SingleStat label="AST" value={gameProps.ast} />
                <SingleStat label="FG" value={`${gameProps.fg}`} />
            </div>
        </article>
    )
}
export default function LastGames()  {
    return (
        <>
            <span className={styles.title}>Últimos 5 partidos</span>
            <Game pts="12" reb="2" ast="12" mins="37" fg="13/24" home={true} rival="LAL" result="113-104" win={true} date="02 MAR"/>
        </>
    )
}