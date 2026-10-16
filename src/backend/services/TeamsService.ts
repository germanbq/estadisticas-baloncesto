import { Team, TeamHeader, teamPlayersStats } from "../entities/teamsEntities";
import { ITeamsRepository } from "../interfaces/teamsInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export class TeamsService {
    constructor(private readonly repository: ITeamsRepository) {}

    leaderBoard(conf: string, userId: string | null): Promise<Team[]> {
        return this.repository.leaderBoard(conf, userId, ACTUAL_SEASON)
    }

    teamProfile(teamId: number, userId: string | null): Promise<TeamHeader> {
        return this.repository.teamProfile(teamId, userId, ACTUAL_SEASON);
    }

    playersSeasonStats(team_id: number): Promise<teamPlayersStats[]> {
        return this.repository.playersSeasonStats(team_id, ACTUAL_SEASON);
    }
}