import LeaderBoard from "@/src/components/classification/LeaderBoard"

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
            <LeaderBoard />
        </div>
    )
}