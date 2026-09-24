import Image from "next/image";
import styles from "./PlayerProfileCard.module.css";

type DataContainerProps = {
    label: string;
    value: string;
}

function DataContainer({label, value}: DataContainerProps) {
    return (
        <div className={styles.data}>
            <dt className={styles.dataName}>{label}</dt>
            <dd>{value}</dd>
        </div>
    )
}

export default function PlayerProfileCard() {
    return (
        <article className={styles.card}>
            <Image src="/LeBron_James.jpg" alt="LeBron James" width={120} height={120} className={styles.image}/>
            <div className={styles.labels}>
                <span className={styles.team}>Philadelphia 76ers</span>
                <span className={styles.jerseyNumber}># 23 A</span>
            </div>
            <div className={styles.nameAndCountry}>
                <h1 className={styles.name}>LeBron James</h1>
                <span className={styles.country}>USA</span>
            </div>
            <dl className={styles.dataContainer}>
                <DataContainer label="Altura" value="2,06 m"/>
                <DataContainer label="Peso" value="113 kg"/>
                <DataContainer label="Edad" value="41 años"/>
                <DataContainer label="Draft" value="2003" />
            </dl>
        </article>
    );
}