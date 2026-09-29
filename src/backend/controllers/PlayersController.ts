import { PlayersService } from "../services/PlayersService";
export class PlayersController {
     
    constructor(private readonly service: PlayersService) {}

    async leadersList(metric: string | null): Promise<Response> {
        if(metric === null) {
            return Response.json(
                { error: "Metrica no encontrada" },
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
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
            { error: "Error al los datos del perfil" },
            { status: 500 }
            );
        }
    }
}