import { auth } from "@clerk/nextjs/server";
import { TeamsService } from "../services/TeamsService";

export class TeamsController {
    constructor(private readonly service: TeamsService) {}

    async leaderBoard(conf: string | null): Promise<Response> {
        const allowedMetrics = ["East", "West"];
        if(conf === null || !allowedMetrics.includes(conf)) {
            return Response.json(
                { error: "Conferencia no válida" },
                { status: 400 }
            );
        }
        try {
            const { userId } = await auth(); 

            const data = await this.service.leaderBoard(conf, userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener la tabla de clasificación"},
                {status: 500}
            );
        }
    }

    async teamProfile(teamId: number): Promise<Response> {
        if(!Number.isSafeInteger(teamId) || teamId <= 0) {
            return Response.json(
                { error: "ID de equipo no válido" },
                { status: 400 }
            );
        }
        try {
            const { userId } = await auth();
            
            const data = await this.service.teamProfile(teamId, userId);
            if (data === undefined) {
                return Response.json(
                    { error: "Equipo no encontrado" },
                    { status: 404 },
                );
            }
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener las estadisticas de perfil del equipo"},
                {status: 500}
            );
        }
    }

    async playersSeasonStats(teamId: number): Promise<Response> {
        if(!Number.isSafeInteger(teamId) || teamId <= 0) {
            return Response.json(
                { error: "ID de equipo no válido" },
                { status: 400 }
            );
        }
        try {
            const data = await this.service.playersSeasonStats(teamId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener las estadisticas de los jugadores del equipo"},
                {status: 500}
            );
        }
    }

    async upcomingTeamGames(teamId: number): Promise<Response> {
        if(!Number.isSafeInteger(teamId) || teamId <= 0) {
            return Response.json(
                { error: "ID de equipo no válido" },
                { status: 400 }
            );
        }
        try {
            const data = await this.service.upcomingTeamGames(teamId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los próximos partidos de equipo"},
                {status: 500}
            );
        }
    }
}
