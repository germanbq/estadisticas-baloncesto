import Games from "../components/app/Games"

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
                <Games />
          </div>
    )
}