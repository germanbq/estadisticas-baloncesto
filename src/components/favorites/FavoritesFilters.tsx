import FilterButton from "@/src/components/FilterButton";
import styles from "./FavoritesFilters.module.css";

export default function FavoritesFilters({selected, setSelected}: 
                                        {selected: string, setSelected: (selected: string) => void}) {
    return (
        <section className={styles.buttonSection}>
            <FilterButton value="Jugadores" selected={selected} setSelected={setSelected} selectedValue="Players" className={styles.button} activeClassName={styles.active} />
            <FilterButton value="Equipos" selected={selected} setSelected={setSelected} selectedValue="Teams" className={styles.button} activeClassName={styles.active} />
            <FilterButton value="Partidos" selected={selected} setSelected={setSelected} selectedValue="Games" className={styles.button} activeClassName={styles.active} />
        </section>
    )
}