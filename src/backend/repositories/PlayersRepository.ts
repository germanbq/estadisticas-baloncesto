import { LeaderPlayer, PlayerGames, PlayerProfile, SearchedPlayer } from "../entities/playersEntities";
import { IPlayersRepository, IPlayersQueries } from "../interfaces/playersIntefaces";
import { IQueryExecutor } from "../shared/sql.types";

export class PlayersRepository implements IPlayersRepository {

    constructor(private readonly queries: IPlayersQueries, private readonly executor: IQueryExecutor) {}

    async leadersList(metric: string, minGames: number, playersLimit: number, season: number): Promise<LeaderPlayer[]> {
        const query = this.queries.leadersList(metric, minGames, playersLimit, season);
        const result = await this.executor.query<LeaderPlayer>(query.text, query.values);

        return result;
    }

    async profileStats(id: number, userId: string | null): Promise<PlayerProfile | null> {
        const query = this.queries.profileStats(id, userId);
        const result = await this.executor.query<PlayerProfile>(query.text, query.values);

        return result[0] ?? null;
    }

    async lastGames(id: number, gamesLimit: number): Promise<PlayerGames[]> {
        const query = this.queries.lastGames(id, gamesLimit);
        const result = await this.executor.query<PlayerGames>(query.text, query.values);

        return result;
    }

    async searchPlayers(search: string, pos: string, conf: string, userId: string | null, season: number): Promise<SearchedPlayer[]> {
        const query = this.queries.searchPlayers(search, pos, conf, userId, season);
        const result = await this.executor.query<SearchedPlayer>(query.text, query.values);

        return result;
    }
}