import LeaderBoard from "@/src/components/classification/LeaderBoard"
import { ACTUAL_SEASON } from "@/src/backend/rules/rules";

export default function ClassificationPage() {
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
            <LeaderBoard season={ACTUAL_SEASON}/>
        </div>
    )
}