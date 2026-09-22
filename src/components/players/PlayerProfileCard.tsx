import Image from "next/image";
import styles from "./PlayerProfileCard.module.css";

export default function PlayerProfileCard() {
    return (
        <article className={styles.card}>
            <Image src="/LeBron_James.jpg" alt="LeBron James" width={120} height={120} className={styles.image}/>
            <div className={styles.labels}>
                <span className={styles.team}>Los Angeles Lakers</span>
                <span className={styles.jersey_number}># 23 A</span>
            </div>
            <div className={styles.nameAndCountry}>
                <h1 className={styles.name}>LeBron James</h1>
                <span className={styles.country}>USA</span>
            </div>
            <dl className={styles.data}>
                <div className={styles.dataContainers}>
                    <dt className={styles.dataNames}>Altura</dt>
                    <dd> 2.06 m</dd>
                </div>
                <div className={styles.dataContainers}> 
                    <dt className={styles.dataNames}>Peso</dt>
                    <dd>113 kg</dd>
                </div>
                <div className={styles.dataContainers}> 
                    <dt className={styles.dataNames}>Edad</dt>
                    <dd>41 años</dd>
                </div>
                <div className={styles.dataContainers}>
                    <dt className={styles.dataNames}>Draft</dt>
                    <dd>2003</dd>
                </div>
            </dl>
        </article>
    );
}