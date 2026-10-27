"use client"

import StatsDataNotice from "../StatsDataNotice";
import styles from "./LeaderBoard.module.css";
import FilterButton from "../FilterButton";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Sunrise, Sunset } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Team } from "@/src/backend/entities/teamsEntities";
import FavoriteButton from "../FavoriteButton";
import Link from "next/link";
import LeaderBoardSkeleton from "../skeletons/LeaderBoardSkeleton";

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
export default function LeaderBoard({season}: {season: number}) {
    const endingYear = season+1;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [conf, setConf] = useState(() => searchParams.get("conf") === "West" ? "West" : "East");
    const [leaderBoard, setLeaderBoard] = useState<Team[]>([]);
    const [loadedConf, setLoadedConf] = useState<string | null>(null);
    const loading = loadedConf !== conf;

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
                setLeaderBoard([]);
            } finally {
                if (!controller.signal.aborted) setLoadedConf(conf);
            }
        }

        void loadLeaderBoard();
        return () => controller.abort();
    }, [conf])

    return (
        <section className={styles.section}>
            <span className={styles.seasonSpan}>Temporada regular {season}-{endingYear} <StatsDataNotice context="Clasificación por conferencia" /></span>
            <div className={styles.buttonsContainer}>
                <FilterButton icon={<Sunrise />} value="CONFERENCIA ESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} selectedValue="East"/>
                <FilterButton icon={<Sunset />} value="CONFERENCIA OESTE" selected={conf} setSelected={setConf} className={styles.button} activeClassName={styles.active} selectedValue="West"/>
            </div>
            <div className={styles.tablePanel}>
                <div className={styles.labelsContainer}>
                    <StandingLabel text="Playoffs directos (1-6)" className="playoffs" />
                    <StandingLabel text="Play-in (7-10)" className="playin" />
                    <StandingLabel text="Eliminación directa (11-15)" className="eliminated" />
                </div>

                {loading && <div role="status" aria-label="Cargando clasificación" />}
                <div className={styles.tableScroll} role="region" aria-label="Clasificación por conferencia" tabIndex={0}>
                <table className={styles.table} aria-busy={loading}>
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
                    {loading ? <LeaderBoardSkeleton /> : <tbody>
                        {leaderBoard.map((team, index) => (
                            <tr key={team.id}>
                                <td><span className={styles.positionBadge}>{index+1}</span></td>
                                <td>
                                    <div className={styles.logoAndName}>
                                        <Link href={`/equipos/${team.id}`} className={styles.teamLink}>
                                            <Image src={team.logo} className={styles.teamLogo} alt={`Logo ${team.name}`} width={0} height={0}/>
                                            <span>{team.name}</span>
                                        </Link>
                                        <FavoriteButton type="equipos" itemId={team.id} isFavorite={team.isFavorite} />
                                    </div>
                                </td>
                                <td>{team.division}</td>
                                <td>{team.victorys}</td>
                                <td>{team.losses}</td>
                                <td className={styles.percentage}>{Number(team.winRate.toFixed(2))}</td>
                                <td className={team.difference > 0 ? styles.positive : styles.negative}>{team.difference > 0 ? "+" : ""}{Number(team.difference.toFixed(1))}</td>
                                <td className={team.streakVictory ? styles.positive : styles.negative}>{team.streakVictory ? "W" : "L"}{team.streakNumber}</td>
                            </tr>
                        ))}
                    </tbody>}
                </table>
                </div>
            </div>
        </section>
    )
}
