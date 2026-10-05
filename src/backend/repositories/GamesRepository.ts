import { Pool } from "pg";
import { Game, GamesNum } from "../entities/gamesEntities";
import { IGamesQueries, IGamesRepository } from "../interfaces/gamesInterfaces";
import { IQueryExecutor } from "../shared/sql.types";

export default class GamesRepository implements IGamesRepository {
    constructor(private readonly queries: IGamesQueries, private readonly executor: IQueryExecutor) {}

    async dayGames(date: string, season: number): Promise<Game[]> {
        const query = this.queries.dayGames(date, season);
        const result = await this.executor.query<Game>(query.text, query.values);

        return result;
    }

    async gamesNumber(date: string): Promise<GamesNum[]> {
        const query = this.queries.gamesNumber(date);
        const result = await this.executor.query<GamesNum>(query.text, query.values);

        return result;
    }
}