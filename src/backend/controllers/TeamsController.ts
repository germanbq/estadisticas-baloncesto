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
        const { userId } = await auth(); 
        try {
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
}