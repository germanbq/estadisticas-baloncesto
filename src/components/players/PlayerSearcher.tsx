"use client";

import styles from "./PlayerSearcher.module.css";
import { useEffect, useState } from "react";
import { UserSearch, X} from "lucide-react";
import FilterButton from "../FilterButton";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";

type Props = {
    search: string;
    setSearch: (search: string) => void
}

export default function PlayerSearcher({search, setSearch}: Props) {
    const searchParams = useSearchParams();

    const [conf, setConf] = useState(() => searchParams.get("conf") ?? "BOTH");
    const [pos, setPos] = useState(() => searchParams.get("pos") ?? "ALL");

    useSyncQueryParams({ pos: pos, conf: conf});
    
    return (
        <>
            <div className={styles.inputContainer}>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} 
                        placeholder="Buscar jugador..." className={styles.input} spellCheck={false}>
                    </input>
                    <UserSearch className={styles.inputIcon} />
                    <button className={styles.deleteButton} type="button" onClick={() => setSearch("")} aria-label="Borrar búsqueda">
                        <X aria-hidden="true" className={styles.inputCross}/>
                    </button>
            </div>
            <section className={styles.filters}>
                <div className={styles.posFilters}>
                    <FilterButton value="TODAS" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="ALL"/>
                    <FilterButton value="BASE"  selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="PG"/>
                    <FilterButton value="ESCOLTA" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="SG"/>
                    <FilterButton value="ALERO"  selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="SF"/>
                    <FilterButton value="ALA-PÍVOT" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="PF"/>
                    <FilterButton value="PÍVOT" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} selectedValue="C"/>                
                </div>
                <div className={styles.confFilters}>
                    <span className={styles.confLabel}>CONFERENCIA: </span>
                    <FilterButton value="AMBAS" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} selectedValue="BOTH"/>
                    <FilterButton value="ESTE" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} selectedValue="East"/>
                    <FilterButton value="OESTE" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} selectedValue="West"/>                    
                </div>
            </section>
        </>
    )
}