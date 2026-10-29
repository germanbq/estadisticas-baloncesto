import { notFound } from "next/navigation";
import type { GameProfile } from "@/src/backend/entities/gamesEntities";
import { gamesController } from "@/src/backend/containers/gamesContainer";
import QuarterScores from "@/src/components/game/QuarterScores";
import StatsComparison from "@/src/components/game/StatsComparison";
import GameCard from "@/src/components/GameCard";
import LastGamesComparison from "@/src/components/game/LastGamesComparison";
import HeadToHeadGames from "@/src/components/game/HeadToHeadGames";
import StatsLeadersComparison from "@/src/components/game/StatsLeadersComparison";
import FinishedTeamStatsComparison from "@/src/components/game/FinishedTeamStatsComparison";
import MVPCard from "@/src/components/game/MVPCard";
import PlayersStats from "@/src/components/game/PlayersStats";
import NoDataCard from "@/src/components/NoDataCard";
import { CalendarDays, ChartBar, CircleStar, Swords } from "lucide-react";


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
                {!hthGamesResponse.ok ? <NoDataCard name="Enfrentamientos esta temporada" icon={Swords} text="No se pudieron cargar los enfrentamientos"/>                                   
                                    : hthGames.length === 0 
                                        ? <NoDataCard name="Enfrentamientos esta temporada" icon={Swords} text="No hay enfrentamientos finalizados esta temporada"/>                                   
                                        : <HeadToHeadGames games={hthGames} referenceTeamName={game.homeTeamName}/>
                }
                
                {!homeGamesResponse.ok || !awayGamesResponse.ok
                    ? <NoDataCard name="Estado de forma" icon={CalendarDays} text="No se pudieron cargar los últimos partidos" />
                    : homeGames.length === 0 && awayGames.length === 0
                        ? <NoDataCard name="Estado de forma" icon={CalendarDays} text="No hay partidos finalizados disponibles esta temporada" />
                        : <LastGamesComparison homeGames={homeGames} awayGames={awayGames} homeName={game.homeTeamName} awayName={game.awayTeamName}/>
                }
                {!homeLeadersResponse.ok || !awayLeadersResponse.ok
                    ? <NoDataCard name="Líderes estadísticos" icon={CircleStar} text="No se pudieron cargar los líderes estadísticos" />
                    : homeLeaders.length === 0 || awayLeaders.length === 0
                        ? <NoDataCard name="Líderes estadísticos" icon={CircleStar} text="No hay estadísticas disponibles para comparar los líderes de ambos equipos" />
                        : <StatsLeadersComparison homeLeaders={homeLeaders} awayLeaders={awayLeaders} homeName={game.homeShortName} awayName={game.awayShortName} />
                }
            </>
        )
    } else {
        const [homeStatsResponse, awayStatsResponse, MVPResponse, homePlayersResponse, awayPlayersResponse] = await Promise.all([
            gamesController.gameTeamStats(game.homeTeamId, Number(id)),
            gamesController.gameTeamStats(game.awayTeamId, Number(id)),
            gamesController.gameMVP(Number(id)),
            gamesController.playersStats(Number(id), game.homeTeamId),
            gamesController.playersStats(Number(id), game.awayTeamId),
        ]);

        const [homeStatsResult, awayStatsResult, MVPResult, homePlayersResult, awayPlayersResult] = await Promise.all([
            homeStatsResponse.json(),
            awayStatsResponse.json(),
            MVPResponse.json(),
            homePlayersResponse.json(),
            awayPlayersResponse.json(),
        ]);

        

        const homeStats = homeStatsResult.data;
        const awayStats = awayStatsResult.data;
        const gameMVP = MVPResult.data;
        const homePlayers = homePlayersResult.data;
        const awayPlayers = awayPlayersResult.data;

        content = (
            <>
                {!MVPResponse.ok
                         ? <NoDataCard name="MVP del partido" icon={CircleStar} text="No se pudo cargar el MVP del partido"/>
                         : gameMVP ? <MVPCard player={gameMVP} home={gameMVP.teamId === game.homeTeamId}/>
                         : <NoDataCard name="MVP del partido" icon={CircleStar} text="No hay estadísticas disponibles para decidir el MVP del partido"/>
                }
                {!homeStatsResponse.ok || !awayStatsResponse.ok
                        ? <NoDataCard name="Comparativa de equipos" icon={ChartBar} text="No se pudieron cargar las estadísticas de los equipos"/>
                        : homeStats || awayStats
                        ? <FinishedTeamStatsComparison homeStats={homeStats} awayStats={awayStats} homeName={game.homeTeamName} awayName={game.awayTeamName}/>
                        : <NoDataCard name="Comparativa de equipos" icon={ChartBar} text="No hay estadísticas disponibles de los equipos"/>                                   
                }
                {!homePlayersResponse.ok || !awayPlayersResponse.ok
                        ? <NoDataCard name="Estadísticas de jugadores" icon={ChartBar} text="No se pudieron cargar las estadísticas de los jugadores"/>
                        : homePlayers.length > 0 || awayPlayers.length > 0
                        ? <PlayersStats homePlayers={homePlayers} awayPlayers={awayPlayers} homeName={game.homeTeamName} awayName={game.awayTeamName}/>
                         : <NoDataCard name="Estadísticas de jugadores" icon={ChartBar} text="No hay estadísticas disponibles sobre los jugadores"/>
                }
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
                        gap: 1rem;
                        margin-top: 1rem;
                        align-items: center;
                    }
                `}</style>
            <GameCard featured key={game.id} id={game.id} isFavorite={game.isFavorite} finalizado={game.finished}
                homeTeam={game.homeTeamName} awayTeam={game.awayTeamName}
                homeScore={game.homeTeamScore} awayScore={game.awayTeamScore}
                homeRecord={`${game.homeTeamVictorys}-${game.homeTeamLosses}`} awayRecord={`${game.awayTeamVictorys}-${game.awayTeamLosses}`}
                homeLogo={game.homeTeamLogo} awayLogo={game.awayTeamLogo}
                place={game.stadium} date={new Date(game.date)}
                teamLinks homeId={game.homeTeamId} awayId={game.awayTeamId}
            >
                {game.finished && game.homeTeamScore !== null && game.awayTeamScore !== null && <QuarterScores homeScores={game.homePeriodScores} awayScores={game.awayPeriodScores} homeName={game.homeShortName} awayName={game.awayShortName} homeTotal={game.homeTeamScore} awayTotal={game.awayTeamScore} />}
            </GameCard>
            {content}
        </div>
    )
}
