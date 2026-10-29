"use client"

import { SearchedPlayer } from "@/src/backend/entities/playersEntities";
import PlayersBySearch from "@/src/components/players/PlayersBySearch";
import PlayerSearcher from "@/src/components/players/PlayerSearcher"
import StatsLeader from "@/src/components/players/StatsLeaders"
import { useFetch } from "@/src/hooks/useFetch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import NoDataCard from "@/src/components/general/NoDataCard";

export default function PlayersPage() {
    return (
        <Suspense fallback={<NoDataCard text="Cargando jugadores…" />}>
            <PlayersContent />
        </Suspense>
    );
}

function PlayersContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(() => searchParams.get("search") || "");
    const isSearching = search.trim().length > 0;

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

    

    const hasSearch = !!searchParams.get("search")?.trim();
    const {data, loading} = useFetch<SearchedPlayer[]>(
        hasSearch ? `/api/jugadores/buscador?${searchParams.toString()}` : null
    );
    const players = data ?? [];

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
            {!isSearching ? <StatsLeader /> : <PlayersBySearch players={players} loading={search !== (searchParams.get("search") ?? "") || loading} /> }
        </div>
    )
}
