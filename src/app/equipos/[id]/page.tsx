import { teamsController } from '@/src/backend/containers/teamsContainer';
import { TeamHeader, teamPlayersStats, UpcomingTeamGames } from '@/src/backend/entities/teamsEntities';
import { LastTeamGame } from '@/src/backend/entities/gamesEntities';
import TeamGames from '@/src/components/team/TeamGames';
import HeaderCard from '@/src/components/team/HeaderCard';
import PlayerStatsTable from '@/src/components/team/PlayerStatsTable';
import NoDataCard from '@/src/components/general/NoDataCard';
import { CalendarDays, TableProperties } from 'lucide-react';
import { notFound } from "next/navigation";
import { gamesController } from '@/src/backend/containers/gamesContainer';

export default async function TeamPage({params}: {params: Promise<{id : string}>;}) {
    const {id} = await params;
    const response = await teamsController.teamProfile(Number(id));

    if (response.status === 404) {
        notFound();
    }
    
    if (!response.ok) {
        throw new Error("Error al obtener los datos del equipo");
    }
    
    const result = await response.json()
    const team: TeamHeader = result.data;

    const playersResponse = await teamsController.playersSeasonStats(Number(id));
    const finisehdGamesResponse = await gamesController.lastTeamGames(Number(id));
    const upComingGamesResponse = await teamsController.upcomingTeamGames(Number(id));

    const playersResult = await playersResponse.json();
    const finisehdGamesResult = await finisehdGamesResponse.json();
    const upComingGamesResult = await upComingGamesResponse.json();
    
    const players: teamPlayersStats[] = playersResponse.ok ? playersResult.data : [];
    const finishedGames: LastTeamGame[] = finisehdGamesResponse.ok ? finisehdGamesResult.data : [];
    const upcomingGames: UpcomingTeamGames[] = upComingGamesResponse.ok ? upComingGamesResult.data : [];
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
            <HeaderCard {...team} />
            {!finisehdGamesResponse.ok || !upComingGamesResponse.ok
                ? <NoDataCard name="Partidos del equipo" icon={CalendarDays} text="No se pudieron cargar los partidos del equipo" />
                : finishedGames.length === 0 && upcomingGames.length === 0
                    ? <NoDataCard name="Partidos del equipo" icon={CalendarDays} text="No hay partidos disponibles para este equipo" />
                    : <TeamGames finishedGames={finishedGames} upcomingGames={upcomingGames} />
            }
            {!playersResponse.ok
                ? <NoDataCard name="Estadísticas de los jugadores" icon={TableProperties} text="No se pudieron cargar las estadísticas de los jugadores" />
                : players.length === 0
                    ? <NoDataCard name="Estadísticas de los jugadores" icon={TableProperties} text="No hay estadísticas de jugadores disponibles esta temporada" />
                    : <PlayerStatsTable players={players} />
            }
        </div>
    )
}
