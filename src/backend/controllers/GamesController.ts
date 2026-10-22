import { auth } from "@clerk/nextjs/server";
import GamesService from "../services/GamesService";

export default class GamesController {
    constructor(private readonly service: GamesService) {}

    async dayGames(date: string | null): Promise<Response> {
        if(date === null) {
            return Response.json(
                { error: "Fecha no válida" },
                { status: 400 }
            );
        }
            
        try {
            const { userId } = await auth();
            
            const data = await this.service.dayGames(date, userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los partidos de la fecha seleccionada"},
                {status: 500}
            );
        }
    }

    async gamesNumber(date: string | null): Promise<Response> {
        if(date === null) {
            return Response.json(
                { error: "Fecha no válida" },
                { status: 400 }
            );
        }
        try {
            const data = await this.service.gamesNumber(date);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener el número de partidos de la fecha seleccionada"},
                {status: 500}
            );
        }
    }

    async gameById(id: number): Promise<Response> {
        if(!Number.isSafeInteger(id) || id <= 0) {
            return Response.json(
                { error: "ID no válido para conseguir los datos del partido" },
                { status: 400 }
            );
        }

        try{
            const { userId } = await auth();

            const data = await this.service.gameById(id, userId);
            if(data === null) {
                return Response.json(
                    { error: "Partido no encontrado" },
                    { status: 404 }
                );
            }
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir los datos del partido" },
            { status: 500 }
            );
        }
    }

    async lastTeamGames(id: number): Promise<Response> {
        if(!Number.isSafeInteger(id) || id <= 0) {
            return Response.json(
                { error: "ID no válido para conseguir los últimos partidos del equipo" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.lastTeamGames(id);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir los ultimos partidos de los equipos" },
            { status: 500 }
            );
        }
    }

    async headToHeadGames(homeId: number, awayId: number) {
        if(!Number.isSafeInteger(homeId) || homeId <= 0 || !Number.isSafeInteger(awayId) || awayId <= 0) {
            return Response.json(
                { error: "ID no válido de los equipos para conseguir sus enfrentamientos" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.headToHeadGames(homeId, awayId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir los ultimos partidos entre los equipos" },
            { status: 500 }
            );
        }
    }

    async statsLeaders(teamId: number) {
        if(!Number.isSafeInteger(teamId) || teamId <= 0) {
            return Response.json(
                { error: "ID de equipo no válido para conseguir los líderes estadísticos" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.statsLeaders(teamId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir los líderes estadísticos del equipo" },
            { status: 500 }
            );
        }
    }

    async gameTeamStats(teamId: number, gameId: number) {
        if(!Number.isSafeInteger(teamId) || !Number.isSafeInteger(gameId)) {
            return Response.json(
                { error: "ID de equipo o partido no válido para conseguir las estadísticas del equipo" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.gameTeamStats(teamId, gameId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                { error: "Error al conseguir las estadisticas del equipo en el partido" },
                { status: 500 }
            );
        }
    }

    async gameMVP(gameId: number) {
        if(!Number.isSafeInteger(gameId)) {
            return Response.json(
                { error: "ID de partido no válido para conseguir el MVP" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.gameMVP(gameId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir el MVP del partido" },
            { status: 500 }
            );
        }
    }

    async playersStats(gameId: number, teamId: number) {
        if(!Number.isSafeInteger(gameId) || !Number.isSafeInteger(teamId)) {
            return Response.json(
                { error: "ID de equipo o partido no válido para conseguir las estadísticas de los jugadores" },
                { status: 400 }
            );
        }
        try{
            const data = await this.service.playersStats(gameId, teamId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                { error: "Error al conseguir las estadisticas de los jugadores" },
                { status: 500 }
            );
        }
    }
}