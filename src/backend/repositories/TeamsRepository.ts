import { Team } from "../entities/teamsEntities";
import { ITeamsQueries, ITeamsRepository } from "../interfaces/teamsInterfaces";
import { IQueryExecutor } from "../shared/sql.types";

export class TeamsRepository implements ITeamsRepository {
    constructor(private readonly queries: ITeamsQueries, private readonly executor: IQueryExecutor) {}

    async leaderBoard(conf: string, season: number): Promise<Team[]> {
        const query = this.queries.leaderBoard(conf, season);
        const result = await this.executor.query<Team>(query.text, query.values);

        return result;
    }
}