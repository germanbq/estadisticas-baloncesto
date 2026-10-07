import { FavCounts } from "../entities/favoritesEntities";
import { Game } from "../entities/gamesEntities";
import { SearchedPlayer } from "../entities/playersEntities";
import { Team } from "../entities/teamsEntities";
import { IFavoriteRepository } from "../interfaces/favoritesInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export class FavoritesService {
    constructor(private readonly repository: IFavoriteRepository) {}

    async favoriteCounts(userId: string): Promise<FavCounts> {
        return this.repository.favoriteCounts(userId);
    } 

    async favoriteGames(userId: string): Promise<Game[]> {
        return this.repository.favoriteGames(userId);
    } 

    async favoritePlayers(userId: string): Promise<SearchedPlayer[]> {
        return this.repository.favoritePlayers(userId, ACTUAL_SEASON);
    } 

    async favoriteTeams(userId: string): Promise<Team[]> {
        return this.repository.favoriteTeams(userId, ACTUAL_SEASON);
    }
    

    async addFavoriteGame(userId: string, itemId: number): Promise<void> {
        return this.repository.addFavoriteGame(userId, itemId);
    }

    async addFavoritePlayer(userId: string, itemId: number): Promise<void> {
        return this.repository.addFavoritePlayer(userId, itemId);
    }

    async addFavoriteTeam(userId: string, itemId: number): Promise<void> {
        return this.repository.addFavoriteTeam(userId, itemId);
    }
    

    async removeFavoriteGame(userId: string, itemId: number): Promise<void> {
        return this.repository.removeFavoriteGame(userId, itemId);
    }

    async removeFavoritePlayer(userId: string, itemId: number): Promise<void> {
        return this.repository.removeFavoritePlayer(userId, itemId);
    }

    async removeFavoriteTeam(userId: string, itemId: number): Promise<void> {
        return this.repository.removeFavoriteTeam(userId, itemId);
    }
}