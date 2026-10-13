import { Game, GameProfile, GamesNum, HeadToHeadGame, LastTeamGame, StatLeader } from "../entities/gamesEntities";
import { IGamesQueries, IGamesRepository } from "../interfaces/gamesInterfaces";
import { IQueryExecutor } from "../shared/sql.types";

export default class GamesRepository implements IGamesRepository {
    constructor(private readonly queries: IGamesQueries, private readonly executor: IQueryExecutor) {}

    async dayGames(date: string, userId: string | null, season: number): Promise<Game[]> {
        const query = this.queries.dayGames(date, userId, season);
        const result = await this.executor.query<Game>(query.text, query.values);

        return result;
    }

    async gamesNumber(date: string): Promise<GamesNum[]> {
        const query = this.queries.gamesNumber(date);
        const result = await this.executor.query<GamesNum>(query.text, query.values);

        return result;
    }

    async gameById(id: number, userId: string | null): Promise<GameProfile  | null> {
        const query = this.queries.gameById(id, userId);
        const result = await this.executor.query<GameProfile>(query.text, query.values);

        return result[0] ?? null;
    }

    async lastTeamGames(id: number): Promise<LastTeamGame[]> {
        const query = this.queries.lastTeamGames(id);
        const result = await this.executor.query<LastTeamGame>(query.text, query.values);

        return result;
    }

    async headToHeadGames(homeId: number, awayId: number, season: number): Promise<HeadToHeadGame[]> {
        const query = this.queries.headToHeadGames(homeId, awayId, season);
        const result = await this.executor.query<HeadToHeadGame>(query.text, query.values);

        return result;
    }

    async statsLeaders(teamId: number, season: number): Promise<StatLeader[]> {
        const query = this.queries.statsLeaders(teamId, season);
        const result = await this.executor.query<StatLeader>(query.text, query.values);

        return result;
    }
}