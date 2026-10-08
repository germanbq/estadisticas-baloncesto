import { ITeamsRepository } from "../interfaces/teamsInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export class TeamsService {
    constructor(private readonly repository: ITeamsRepository) {}

    leaderBoard(conf: string, userId: string | null){
        return this.repository.leaderBoard(conf, userId, ACTUAL_SEASON)
    }
}