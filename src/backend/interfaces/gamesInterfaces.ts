import { Game } from "../entities/gamesEntities";
import { SqlQuery } from "../shared/sql.types";

export interface IGamesQueries {
    dayGames(date: string, season: number): SqlQuery;
}

export interface IGamesRepository {
    dayGames(date: string, season: number): Promise<Game[]>;
}