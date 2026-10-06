"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react"
import FavoritesFilters from "@/src/components/favorites/FavoritesFilters"
import FavoriteGames from "@/src/components/favorites/FavoriteGames";
import FavoritePlayers from "@/src/components/favorites/FavoritePlayers";
import FavoriteTeams from "@/src/components/favorites/FavoriteTeams";
import { FavCounts } from "@/src/backend/entities/favoritesEntities";

export default function FavoritesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selected, setSelected] = useState(searchParams.get("selected") ?? "Players");
    const [counts, setCounts] = useState<FavCounts>({numberGames: 0, numberPlayers: 0, numberTeams: 0});

    useEffect(() => {
        if(searchParams.get("selected") === selected) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("selected", selected);
        router.replace(`${pathname}?${params.toString()}`);
    }, [selected, router, pathname, searchParams])

    useEffect(() => {
        const controller = new AbortController();
        
        async function loadFavoriteCounts() {
            try {
                const response = await fetch(`/api/favoritos/numero`,
                    { signal: controller.signal });
                const result = await response.json();
                
                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }

                setCounts(result.data);
            }
            catch(error) {
                if (controller.signal.aborted) return;
                console.error(error);
            }
        }

        void loadFavoriteCounts();
        return () => controller.abort();
    }, []);

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
            <FavoritesFilters selected={selected} setSelected={setSelected} counts={counts}/>
            {selected === "Players" && <FavoritePlayers />}
            {selected === "Teams" && <FavoriteTeams />}
            {selected === "Games" && <FavoriteGames />}      
        </div>
    )
}