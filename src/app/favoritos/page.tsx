"use client"

import { useSearchParams } from "next/navigation";
import { useState } from "react"
import FavoritesFilters from "@/src/components/favorites/FavoritesFilters"
import FavoriteGames from "@/src/components/favorites/FavoriteGames";
import FavoritePlayers from "@/src/components/favorites/FavoritePlayers";
import FavoriteTeams from "@/src/components/favorites/FavoriteTeams";
import { FavCounts } from "@/src/backend/entities/favoritesEntities";
import { useSyncQueryParams } from "@/src/hooks/useSyncQueryParam";
import { useFetch } from "@/src/hooks/useFetch";

export default function FavoritesPage() {
    const defaultNumber = {numberGames: 0, numberPlayers: 0, numberTeams: 0};

    const searchParams = useSearchParams();
    const [selected, setSelected] = useState(searchParams.get("selected") ?? "Players");

    function handleGameFavoriteChange(isFavorite: boolean) {
        if(!loading) {
            setCounts(previous => previous === null ? null : ({
            ...previous,
            numberGames: previous.numberGames + (isFavorite ? 1 : -1),
        }));
        }
    }
    function handlePlayerFavoriteChange(isFavorite: boolean) {
        if(!loading) {
            setCounts(previous => previous === null ? null : ({
            ...previous,
            numberPlayers: previous.numberPlayers + (isFavorite ? 1 : -1),
        }));
        }
    }
    function handleTeamFavoriteChange(isFavorite: boolean) {
        if(!loading) {
            setCounts(previous => previous === null ? null : ({
            ...previous,
            numberTeams: previous.numberTeams + (isFavorite ? 1 : -1),
        }));
        }
    }

    useSyncQueryParams({selected: selected});

    const {data, setData: setCounts, loading, hasError} = useFetch<FavCounts>(`/api/favoritos/numero`);
    const counts = data ?? defaultNumber;

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
            {selected === "Players" && <FavoritePlayers onFavoriteChange={handlePlayerFavoriteChange} disabled={loading || hasError}/>}
            {selected === "Teams" && <FavoriteTeams onFavoriteChange={handleTeamFavoriteChange} disabled={loading || hasError}/>}
            {selected === "Games" && <FavoriteGames onFavoriteChange={handleGameFavoriteChange} disabled={loading || hasError}/>}      
        </div>
    )
}