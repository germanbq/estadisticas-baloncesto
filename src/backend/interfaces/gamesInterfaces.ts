import { Game, GamesNum } from "../entities/gamesEntities";
import { SqlQuery } from "../shared/sql.types";

export interface IGamesQueries {
    dayGames(date: string, season: number): SqlQuery;
    gamesNumber(date: string): SqlQuery;
}

export interface IGamesRepository {
    dayGames(date: string, season: number): Promise<Game[]>;
    gamesNumber(date: string): Promise<GamesNum[]>;
}