import { Team, TeamHeader, teamPlayersStats, UpcomingTeamGames } from "../entities/teamsEntities";
import { ITeamsQueries, ITeamsRepository } from "../interfaces/teamsInterfaces";
import { IQueryExecutor } from "../shared/sql.types";

export class TeamsRepository implements ITeamsRepository {
    constructor(private readonly queries: ITeamsQueries, private readonly executor: IQueryExecutor) {}

    async leaderBoard(conf: string, userId: string | null, season: number): Promise<Team[]> {
        const query = this.queries.leaderBoard(conf, userId, season);
        const result = await this.executor.query<Team>(query.text, query.values);

        return result;
    }

    async teamProfile(teamId: number, userId: string | null, season: number): Promise<TeamHeader | undefined> {
        const query = this.queries.teamProfile(teamId, userId, season);
        const result = await this.executor.query<TeamHeader>(query.text, query.values);

        return result[0];
    }

    async playersSeasonStats(teamId: number, season: number): Promise<teamPlayersStats[]> {
        const query = this.queries.playersSeasonStats(teamId, season);
        const result = await this.executor.query<teamPlayersStats>(query.text, query.values);

        return result;
    }

    async upcomingTeamGames(teamId: number, season: number, gamesLimit: number): Promise<UpcomingTeamGames[]> {
        const query = this.queries.upcomingTeamGames(teamId, season, gamesLimit);
        const result = await this.executor.query<UpcomingTeamGames>(query.text, query.values);

        return result;
    }
}
