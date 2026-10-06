"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react"
import FavoritesFilters from "@/src/components/favorites/FavoritesFilters"
import FavoriteGames from "@/src/components/favorites/FavoriteGames";
import FavoritePlayers from "@/src/components/favorites/FavoritePlayers";
import FavoriteTeams from "@/src/components/favorites/FavoriteTeams";

export default function FavoritesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selected, setSelected] = useState(searchParams.get("selected") ?? "Players");

    useEffect(() => {
        if(searchParams.get("selected") === selected) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("selected", selected);
        router.replace(`${pathname}?${params.toString()}`);
    }, [selected, router, pathname, searchParams])

    useEffect(() => {
        const controller = new AbortController();
        
    })

    return (
        <div className="playerPage">
            <style>{`
                .playerPage {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1rem;
                }
            `}</style>
            <FavoritesFilters selected={selected} setSelected={setSelected}/>
            {selected === "Players" && <FavoritePlayers />}
            {selected === "Teams" && <FavoriteTeams />}
            {selected === "Games" && <FavoriteGames />}      
        </div>
    )
}