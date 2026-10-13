import { notFound } from "next/navigation";
import type { GameProfile } from "@/src/backend/entities/gamesEntities";
import { gamesController } from "@/src/backend/containers/gamesContainer";
import QuarterScores from "@/src/components/game/QuarterScores";
import StatsComparison from "@/src/components/game/StatsComparison";
import GameCard from "@/src/components/GameCard";
import LastGamesComparison from "@/src/components/game/LastGamesComparison";
import HeadToHeadGames from "@/src/components/game/HeadToHeadGames";
import StatsLeadersComparison from "@/src/components/game/StatsLeadersComparison";


export default async function GamePage({params}: {params: Promise<{id : string}>;}) {
    const { id } = await params;
    const response = await gamesController.gameById(Number(id))
    
    if (response.status === 404) {
        notFound();
    }

    if (!response.ok) {
        throw new Error("Error al obtener los datos del partido");
    }

    const result = await response.json()
    const game: GameProfile = result.data;
    let content: React.ReactNode = null;
    if(!game.finished) {
        const [homeGamesResponse, awayGamesResponse, hthGamesResponse, homeLeadersResponse, awayLeadersResponse] = await Promise.all([
            gamesController.lastTeamGames(game.homeTeamId),
            gamesController.lastTeamGames(game.awayTeamId),
            gamesController.headToHeadGames(game.homeTeamId, game.awayTeamId),
            gamesController.statsLeaders(game.homeTeamId),
            gamesController.statsLeaders(game.awayTeamId),
        ]);
        const [homeGamesResult, awayGamesResult, hthGamesResult, homeLeadersResult, awayLeadersResult] = await Promise.all([
            homeGamesResponse.json(),
            awayGamesResponse.json(),
            hthGamesResponse.json(),
            homeLeadersResponse.json(),
            awayLeadersResponse.json(),
        ]);

        if (!homeGamesResponse.ok) {
            throw new Error(homeGamesResult.error);
        }
        if (!awayGamesResponse.ok) {
            throw new Error(awayGamesResult.error);
        }
        if(!hthGamesResponse.ok){
            throw new Error(hthGamesResult.error);
        }
        if (!homeLeadersResponse.ok) {
            throw new Error(homeLeadersResult.error);
        }
        if(!awayLeadersResponse.ok){
            throw new Error(awayLeadersResult.error);
        }
       
        const homeGames = homeGamesResult.data;
        const awayGames = awayGamesResult.data;
        const hthGames = hthGamesResult.data;
        const homeLeaders = homeLeadersResult.data;
        const awayLeaders = awayLeadersResult.data;
        content = (
            <>
                <StatsComparison homeName={game.homeTeamName} awayName={game.awayTeamName} 
                homeVictorys={game.homeTeamVictorys} homeLosses={game.homeTeamLosses} homeWinRate={game.homeWinRate} homePointsPerGame={game.homePointsPerGame} 
                homePointsAllowedPerGame={game.homePointsAllowedPerGame} homeNetRating={game.homeNetRating} homeStreakNumber={game.homeStreakNumber} homeStreakVictory={game.homeStreakVictory}
                awayVictorys={game.awayTeamVictorys} awayLosses={game.awayTeamLosses} awayWinRate={game.awayWinRate} awayPointsPerGame={game.awayPointsPerGame} 
                awayPointsAllowedPerGame={game.awayPointsAllowedPerGame} awayNetRating={game.awayNetRating} awayStreakNumber={game.awayStreakNumber} awayStreakVictory={game.awayStreakVictory}
                /> 
                <HeadToHeadGames games={hthGames} referenceTeamName={game.homeTeamName}/>
                <LastGamesComparison homeGames={homeGames} awayGames={awayGames} homeName={game.homeTeamName} awayName={game.awayTeamName}/>
                <StatsLeadersComparison homeLeaders={homeLeaders} awayLeaders={awayLeaders} homeName={game.homeShortName} awayName={game.awayShortName} />
            </>
        )
    }
    return (
        <div className="playerPage">
                <style>{`
                    .playerPage {
                        padding: 1rem;
                        display: flex;
                        flex-direction: column;
                        gap: 2rem;
                        margin-top: 1rem;
                        align-items: center;
                    }
                `}</style>
            <GameCard key={game.id} id={game.id} isFavorite={game.isFavorite} finalizado={game.finished}
                homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                place={game.stadium} date={new Date(game.date)}
            >
                {game.finished && game.homeTeamScore !== null && game.awayTeamScore !== null && <QuarterScores homeScores={game.homePeriodScores} awayScores={game.awayPeriodScores} homeName={game.homeShortName} awayName={game.awayShortName} homeTotal={game.homeTeamScore} awayTotal={game.awayTeamScore} />}
            </GameCard>
            {content}
        </div>
    )
}