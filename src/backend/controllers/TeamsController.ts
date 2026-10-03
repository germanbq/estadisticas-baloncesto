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
            const data = await this.service.leaderBoard(conf);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener la tabla de clasificación"},
                {status: 500}
            );
        }
    }
}