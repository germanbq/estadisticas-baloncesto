import { notFound } from "next/navigation";
import MainStats from "@/src/components/player/MainStats"
import PlayerProfileCard from "@/src/components/player/PlayerProfileCard"
import StatsTable from "@/src/components/player/StatsTable"
import LastGames from "@/src/components/player/LastGames"
import { playersController } from "@/src/backend/containers/playersContainer";
import NoDataCard from "@/src/components/general/NoDataCard";
import { ChartNoAxesCombined, History, TableProperties } from "lucide-react";

export default async function PlayerStatsPage({params}: {params: Promise<{id : string}>;}) {
    const {id} = await params;
    const [profileStats, lastGames] = await Promise.all([
        playersController.profileStats(Number(id)),
        playersController.lastGames(Number(id)),
    ]);

    if (profileStats.status === 404) {
        notFound();
    }

    if (!profileStats.ok) {
        throw new Error("Error al obtener los datos del jugador");
    }

    const[statsResult, gamesResult] = await Promise.all([
        profileStats.json(),
        lastGames.json(),
    ]); 
    const stats = statsResult.data;
    const games = gamesResult.data;
    return (
    <div className="playerPage">
        <style>{`
            .playerPage {
                padding: 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
        `}</style>
        <PlayerProfileCard stats={stats}/>
        {stats.seasons.length === 0 ? (
            <NoDataCard name="Promedios de temporada 2025-2026" icon={ChartNoAxesCombined} text="No hay estadísticas disponibles para mostrar los promedios de este jugador" />
        ) : (
            <MainStats stats={stats}/>
        )}
        {stats.seasons.length === 0 ? (
            <NoDataCard name="Estadísticas completas por temporada" icon={TableProperties} text="No hay estadísticas de temporada disponibles para este jugador" />
        ) : (
            <StatsTable stats={stats}/>
        )}
        {!lastGames.ok ? (
            <NoDataCard name="Últimos 5 partidos" icon={History} text="No se pudieron cargar los últimos partidos del jugador" />
        ) : games.length === 0 ? (
            <NoDataCard name="Últimos 5 partidos" icon={History} text="No hay partidos finalizados disponibles para este jugador" />
        ) : (
            <LastGames games={games}/>
        )}
    </div>
    )
}
