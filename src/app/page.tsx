import Games from "../components/app/Games"
import { Suspense } from "react";
import GamesSkeleton from "../components/skeletons/GamesSkeleton";

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
                <Suspense fallback={<GamesSkeleton />}>
                    <Games />
                </Suspense>
          </div>
    )
}
