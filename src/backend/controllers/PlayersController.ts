import { PlayersService } from "../services/PlayersService";
export class PlayersController {
     
    constructor(private readonly service: PlayersService) {}

    async leadersList(metric: string | null): Promise<Response> {
        const allowedMetrics = ["points", "rebounds", "assists", "steals", "blocks", "fg_percentage", "three_percentage"];
        if(metric === null || !allowedMetrics.includes(metric)) {
            return Response.json(
                { error: "Metrica no válida" },
                { status: 400 }
            );
        }

        try {
            const data = await this.service.leadersList(metric);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener líderes"},
                {status: 500}
            );
        }
    }

    async profileStats(id: number): Promise<Response> {
        const idPlayer = Number(id)
        if(!Number.isSafeInteger(idPlayer)) {
            return Response.json(
                { error: "ID no válido" },
                { status: 400 }
            );
        }

        try{
            const data = await this.service.profileStats(id);
            if(data === null) {
                return Response.json(
                    { error: "Jugador no encontrado" },
                    { status: 404 }
                );
            }

            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al conseguir los datos del perfil" },
            { status: 500 }
            );
        }
    }

    async lastGames(id: number): Promise<Response> {
        const idPlayer = Number(id)
        if(!Number.isSafeInteger(idPlayer)) {
            return Response.json(
                { error: "ID no válido" },
                { status: 400 }
            );
        }

        try{
            const data = await this.service.lastGames(id);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                { error: "Error al conseguir los últimos partidos" },
                { status: 500 }
            );
        }
    }

    async searchPlayers(search: string | null, pos: string | null, conf: string | null): Promise<Response> {
        const allowedPositions = ["ALL", "PG", "SG", "SF", "PF", "C"];
        const allowedConferences = ["BOTH", "East", "West"];
        if(search === null || pos === null || conf === null || !allowedPositions.includes(pos) || !allowedConferences.includes(conf)) {
            return Response.json(
                { error: "Parámetros no válidos para búsqueda" },
                { status: 400 }
            );
        }
        try {
            const data = await this.service.searchPlayers(search, pos, conf);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                { error: "Error al conseguir los jugadores buscados" },
                { status: 500 }
);
        }
    }
}