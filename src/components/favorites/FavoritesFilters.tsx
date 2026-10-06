import FilterButton from "@/src/components/FilterButton";
import styles from "./FavoritesFilters.module.css";
import { FavCounts } from "@/src/backend/entities/favoritesEntities";

export default function FavoritesFilters({selected, setSelected, counts}: 
                                        {selected: string, setSelected: (selected: string) => void, counts: FavCounts}) {
    return (
        <section className={styles.buttonSection}>
            <FilterButton value={`Jugadores (${counts.numberPlayers})`} selected={selected} setSelected={setSelected} selectedValue="Players" className={styles.button} activeClassName={styles.active} />
            <FilterButton value={`Equipos (${counts.numberTeams})`} selected={selected} setSelected={setSelected} selectedValue="Teams" className={styles.button} activeClassName={styles.active} />
            <FilterButton value={`Partidos (${counts.numberGames})`} selected={selected} setSelected={setSelected} selectedValue="Games" className={styles.button} activeClassName={styles.active} />
        </section>
    )
}