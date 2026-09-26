import PlayerSearcher from "@/src/components/players/PlayerSearcher"
import StatsLeader from "@/src/components/players/StatsLeaders"

export default function PlayersPage() {
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
                <PlayerSearcher />
                <StatsLeader />
            </div>
    )
}