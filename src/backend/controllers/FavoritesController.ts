import { auth } from "@clerk/nextjs/server";
import { FavoritesService } from "../services/FavoritesService";

export class FavoritesController {
    constructor(private readonly service: FavoritesService) {}

    async favoriteCounts(): Promise<Response> {
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            const data = await this.service.favoriteCounts(userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los favoritos del usuario"},
                {status: 500}
            );
        }
    }

    async favoriteGames(): Promise<Response> {
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            const data = await this.service.favoriteGames(userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los partidos favoritos del usuario"},
                {status: 500}
            );
        }
    }

    async favoritePlayers(): Promise<Response> {
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            const data = await this.service.favoritePlayers(userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los jugadores favoritos del usuario"},
                {status: 500}
            );
        }
    }

    async favoriteTeams(): Promise<Response> {
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            const data = await this.service.favoriteTeams(userId);
            return Response.json({data});
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al obtener los equipos favoritos del usuario"},
                {status: 500}
            );
        }
    }
}