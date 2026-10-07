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


    async addFavoriteGame(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.addFavoriteGame(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al añadir partido favorito"},
                {status: 500}
            );
        }
    }

    async addFavoritePlayer(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.addFavoritePlayer(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al añadir jugador favorito"},
                {status: 500}
            );
        }
    }

    async addFavoriteTeam(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.addFavoriteTeam(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al añadir equipo favorito"},
                {status: 500}
            );
        }
    }


    async removeFavoriteGame(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.removeFavoriteGame(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al eliminar partido favorito"},
                {status: 500}
            );
        }
    }

    async removeFavoritePlayer(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.removeFavoritePlayer(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al eliminar jugador favorito"},
                {status: 500}
            );
        }
    }

    async removeFavoriteTeam(itemId: number): Promise<Response> {
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return Response.json({ error: "itemId inválido" }, { status: 400 });
        }
        
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
            { error: "Debes iniciar sesión" },
            { status: 401 }
            );
        }
        try {
            await this.service.removeFavoriteTeam(userId, itemId);
            return new Response(null, { status: 204 });
        } catch(error) {
            console.error(error);
            return Response.json(
                {error: "Error al eliminar equipo favorito"},
                {status: 500}
            );
        }
    }
}