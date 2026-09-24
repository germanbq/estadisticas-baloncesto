import MainStats from "@/src/components/player/MainStats"
import PlayerProfileCard from "@/src/components/player/PlayerProfileCard"
import StatsTable from "@/src/components/player/StatsTable"
import LastGames from "@/src/components/player/LastGames"

export default function PlayerStatsPage() {
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
        <PlayerProfileCard />
        <MainStats />
        <StatsTable />
        <LastGames />
    </div>
    )
}
