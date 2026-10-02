import MainStats from "@/src/components/player/MainStats"
import PlayerProfileCard from "@/src/components/player/PlayerProfileCard"
import StatsTable from "@/src/components/player/StatsTable"
import LastGames from "@/src/components/player/LastGames"
import { playersController } from "@/src/backend/containers/PlayersContainer";

export default async function PlayerStatsPage({params}: {params: Promise<{id : string}>;}) {
    const {id} = await params;
    const [profileStats, lastGames] = await Promise.all([
        playersController.profileStats(Number(id)),
        playersController.lastGames(Number(id)),
    ]);

    if (!profileStats.ok || !lastGames.ok) {
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
                gap: 1rem;
            }
        `}</style>
        <PlayerProfileCard stats={stats}/>
        <MainStats stats={stats}/>
        <StatsTable stats={stats}/>
        <LastGames games={games}/>
    </div>
    )
}
