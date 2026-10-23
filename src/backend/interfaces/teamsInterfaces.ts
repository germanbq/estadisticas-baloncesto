import { Team, TeamHeader, teamPlayersStats, UpcomingTeamGames } from "../entities/teamsEntities";
import type { SqlQuery } from "../shared/sql.types";

export interface ITeamsQueries {
    leaderBoard(conf: string, userId: string | null, season: number): SqlQuery;
    teamProfile(teamId: number, userId: string | null, season: number): SqlQuery;
    playersSeasonStats(teamId: number, season: number): SqlQuery;
    upcomingTeamGames(teamId: number, season: number):  SqlQuery;
}

export interface ITeamsRepository {
    leaderBoard(conf: string, userId: string | null, season: number): Promise<Team[]>;
    teamProfile(teamId: number, userId: string | null, season: number): Promise<TeamHeader | undefined>;
    playersSeasonStats(teamId: number, season: number): Promise<teamPlayersStats[]>;
    upcomingTeamGames(teamId: number, season: number):  Promise<UpcomingTeamGames[]>;
}
