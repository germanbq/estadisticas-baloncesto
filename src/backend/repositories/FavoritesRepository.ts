import { FavCounts } from "../entities/favoritesEntities";
import { Game } from "../entities/gamesEntities";
import { SearchedPlayer } from "../entities/playersEntities";
import { Team } from "../entities/teamsEntities";
import { IFavoriteRepository, IFavoritesQueries } from "../interfaces/favoritesInterfaces";
import { IQueryExecutor } from "../shared/sql.types";

export class FavoritesRepository implements IFavoriteRepository {
    constructor(private readonly queries: IFavoritesQueries, private readonly executor: IQueryExecutor) {}

    async favoriteCounts(userId: string): Promise<FavCounts> {
        const query = this.queries.favoriteCounts(userId);
        const result = await this.executor.query<FavCounts>(query.text, query.values);

        return result[0];
    }

    async favoriteGames(userId: string): Promise<Game[]> {
        const query = this.queries.favoriteGames(userId);
        const result = await this.executor.query<Game>(query.text, query.values);

        return result;
    }

    async favoritePlayers(userId: string, season: number): Promise<SearchedPlayer[]> {
        const query = this.queries.favoritePlayers(userId, season);
        const result = await this.executor.query<SearchedPlayer>(query.text, query.values);

        return result;
    }

    async favoriteTeams(userId: string, season: number): Promise<Team[]> {
        const query = this.queries.favoriteTeams(userId, season);
        const result = await this.executor.query<Team>(query.text, query.values);

        return result;
    }


    async addFavoriteGame(userId: string, itemId: number): Promise<void> {
        const query = this.queries.addFavoriteGame(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }

    async addFavoritePlayer(userId: string, itemId: number): Promise<void> {
        const query = this.queries.addFavoritePlayer(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }

    async addFavoriteTeam(userId: string, itemId: number): Promise<void> {
        const query = this.queries.addFavoriteTeam(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }
    

    async removeFavoriteGame(userId: string, itemId: number): Promise<void> {
        const query = this.queries.removeFavoriteGame(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }

    async removeFavoritePlayer(userId: string, itemId: number): Promise<void> {
        const query = this.queries.removeFavoritePlayer(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }

    async removeFavoriteTeam(userId: string, itemId: number): Promise<void> {
        const query = this.queries.removeFavoriteTeam(userId, itemId);
        await this.executor.query<void>(query.text, query.values);
    }
}