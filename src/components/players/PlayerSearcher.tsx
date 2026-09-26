"use client";

import styles from "./PlayerSearcher.module.css";
import { useState } from "react";
import { UserSearch } from "lucide-react";
import FilterButton from "./FilterButton";

export default function PlayerSearcher() {
    const [search, setSearch] = useState("");
    const [conf, setConf] = useState("AMBAS");
    const [pos, setPos] = useState("TODAS");

    return (
        <>
            <div className={styles.inputContainer}>
                    <input value={search} placeholder="Buscar jugador..." className={styles.input}></input>
                    <UserSearch className={styles.inputIcon} />
            </div>
            <section className={styles.filters}>
                <div className={styles.posFilters}>
                    <FilterButton value="TODAS" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="BASE"  selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="ESCOLTA" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="ALERO"  selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="ALA-PÍVOT" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="PÍVOT" selected={pos} setSelected= {setPos} className={styles.button} activeClassName={styles.active} />                
                </div>
                <div className={styles.confFilters}>
                    <span className={styles.confLabel}>CONFERENCIA: </span>
                    <FilterButton value="AMBAS" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="ESTE" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} />
                    <FilterButton value="OESTE" selected={conf} setSelected= {setConf} className={styles.button} activeClassName={styles.active} />                    
                </div>
            </section>
        </>
    )
}