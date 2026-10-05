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
            const data = await this.service.dayGames(date);
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
}