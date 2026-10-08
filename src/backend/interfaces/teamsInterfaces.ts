import { Team } from "../entities/teamsEntities";
import type { SqlQuery } from "../shared/sql.types";

export interface ITeamsQueries {
    leaderBoard(conf: string, userId: string | null, season: number): SqlQuery;
}

export interface ITeamsRepository {
    leaderBoard(conf: string, userId: string | null, season: number): Promise<Team[]>;
}