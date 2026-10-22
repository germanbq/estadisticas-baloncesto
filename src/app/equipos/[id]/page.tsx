import { teamsController } from '@/src/backend/containers/teamsContainer';
import { TeamHeader, teamPlayersStats } from '@/src/backend/entities/teamsEntities';
import HeaderCard from '@/src/components/team/HeaderCard';
import PlayerStatsTable from '@/src/components/team/PlayerStatsTable';
import NoDataCard from '@/src/components/general/NoDataCard';
import { TableProperties } from 'lucide-react';
import { notFound } from "next/navigation";

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
    const playersResult = await playersResponse.json()
    const players: teamPlayersStats[] = playersResponse.ok ? playersResult.data : [];
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
            {!playersResponse.ok
                ? <NoDataCard name="Estadísticas de los jugadores" icon={TableProperties} text="No se pudieron cargar las estadísticas de los jugadores" />
                : players.length === 0
                    ? <NoDataCard name="Estadísticas de los jugadores" icon={TableProperties} text="No hay estadísticas de jugadores disponibles esta temporada" />
                    : <PlayerStatsTable players={players} />
            }
        </div>
    )
}
