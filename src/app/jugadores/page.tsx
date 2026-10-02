"use client"

import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import PlayersBySearch from "@/src/components/players/PlayersBySearch";
import PlayerSearcher from "@/src/components/players/PlayerSearcher"
import StatsLeader from "@/src/components/players/StatsLeaders"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlayersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(() => searchParams.get("search") || "");
    const isSearching = search.trim().length > 0;
    const [players, setPlayers] = useState<SearchedPlayer[]>([])
    const [loadedSearch, setLoadedSearch] = useState<string | null>(null);
    const searchKey = searchParams.toString();

    useEffect(() => {
        if((searchParams.get("search") ?? "") === search) return;
        
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if(search.length > 0) {
                params.set("search", search);
            }
            else params.delete("search");

            router.replace(`${pathname}?${params.toString()}`, {scroll: false,});
        }, 300)
        return () => clearTimeout(timeout);
    }, [search, searchParams, pathname, router]);

    useEffect(() => {
        if (!(searchParams.get("search") ?? "").trim()) return;

        const controller = new AbortController();

        async function loadPlayers() {
            const params = new URLSearchParams(searchParams.toString())

            try {
                const response = await fetch(`/api/jugadores/buscador?${params.toString()}`,
                { signal: controller.signal });
                const result = await response.json();

                if(!response.ok) {
                    throw new Error(result.error ??`Error ${response.status}`);
                }   
            
                setPlayers(result.data);
            } catch(error){
                if (controller.signal.aborted) return;
                console.error(error);
            } finally {
                if (!controller.signal.aborted) setLoadedSearch(searchParams.toString());
            }
        }
        
        void loadPlayers();
        return () => controller.abort();
    }, [searchParams])

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
            <PlayerSearcher search={search} setSearch={setSearch}/>
            {!isSearching ? <StatsLeader /> : <PlayersBySearch players={players} loading={search !== (searchParams.get("search") ?? "") || loadedSearch !== searchKey} /> }
        </div>
    )
}
