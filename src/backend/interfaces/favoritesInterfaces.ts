import { FavCounts } from "../entities/favoritesEntities";
import { Game } from "../entities/gamesEntities";
import { SearchedPlayer } from "../entities/playersEntities";
import { Team } from "../entities/teamsEntities";
import { SqlQuery } from "../shared/sql.types";

export interface IFavoritesQueries {
    favoriteCounts(userId: string): SqlQuery;
    favoriteGames(userId: string): SqlQuery;
    favoritePlayers(userId: string, season: number): SqlQuery;
    favoriteTeams(userId: string, season: number): SqlQuery;
}

export interface IFavoriteRepository {
    favoriteCounts(userId: string): Promise<FavCounts>;
    favoriteGames(userId: string): Promise<Game[]>;
    favoritePlayers(userId: string, season: number): Promise<SearchedPlayer[]>;
    favoriteTeams(userId: string, season: number): Promise<Team[]>;
}