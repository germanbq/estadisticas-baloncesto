import MainStats from "@/src/components/players/MainStats"
import PlayerProfileCard from "@/src/components/players/PlayerProfileCard"
import StatsTable from "@/src/components/players/StatsTable"
import LastGames from "@/src/components/players/LastGames"

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
