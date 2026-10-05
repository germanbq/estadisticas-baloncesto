"use client"

import styles from "./LeaderBoard.module.css";
import FilterButton from "../FilterButton";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Sunrise, Sunset } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Team } from "@/src/backend/entities/teamsEntities";

type StandingLabelProps = {
    text: string;
    className: string;
}

function StandingLabel({text, className}: StandingLabelProps) {
    return (
        <div className={`${styles.label} ${styles[className]}`}>
            <span className={styles.dot}></span>
            {text}
        </div>
    )
}
export default function LeaderBoard() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [conf, setConf] = useState(() => searchParams.get("conf") === "West" ? "West" : "East");
    const [leaderBoard, setLeaderBoard] = useState<Team[]>([]);

    useEffect(() => {
        if(searchParams.get("conf") === conf) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("conf", conf);
        router.replace(`${pathname}?${params.toString()}`, {scroll: false,});
    }, [conf, pathname, router, searchParams])

    useEffect(() => {
        const controller = new AbortController();
        
        async function loadLeaderBoard() {
            try {
                const response = await fetch(`/api/clasificacion?conf=${conf}`,
                    { signal: controller.signal });
                const result = await response.json();
                
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }

                setLeaderBoard(result.data);
            }
            catch(error) {
                if (controller.signal.aborted) return;
                console.error(error);
            }
        }

        void loadLeaderBoard();
        return () => controller.abort();
    }, [conf])

    return (
        <section className={styles.section}>
            <span className={styles.seasonSpan}>Temporada regular 2025-2026</span>
            <div className={styles.buttonsContainer}>
                <FilterButton icon={<Sunrise />} value="CONFERENCIA ESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} selectedValue="East"/>
                <FilterButton icon={<Sunset />} value="CONFERENCIA OESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} selectedValue="West"/>
            </div>
            <div className={styles.table}>
                <div className={styles.labelsContainer}>
                    <StandingLabel text="Playoffs directos (1-6)" className="playoffs" />
                    <StandingLabel text="Play-in (7-10)" className="playin" />
                    <StandingLabel text="Eliminación directa (11-15)" className="eliminated" />
                </div>

                <table className={styles.table} > 
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Equipo</th>
                            <th>División</th>
                            <th>V</th>
                            <th>D</th>
                            <th>%V</th>
                            <th>Dif</th>
                            <th>Última racha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderBoard.map((team, index) => (
                            <tr key={team.id}>
                                <td><span className={styles.positionBadge}>{index+1}</span></td>
                                <td>
                                    <div className={styles.logoAndName}>
                                        <Image src={team.logo} className={styles.teamLogo} alt={`Logo ${team.name}`} width={0} height={0}/>
                                        <span>{team.name}</span>
                                    </div>
                                </td>
                                <td>{team.division}</td>
                                <td>{team.victorys}</td>
                                <td>{team.losses}</td>
                                <td className={styles.percentage}>{team.winRate}</td>
                                <td className={team.difference > 0 ? styles.positive : styles.negative}>{team.difference > 0 ? "+" : ""}{team.difference}</td>
                                <td className={team.streakVictory ? styles.positive : styles.negative}>{team.streakVictory ? "W" : "L"}{team.streakNumber}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
