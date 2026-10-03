import { ITeamsRepository } from "../interfaces/teamsInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export class TeamsService {
    constructor(private readonly repository: ITeamsRepository) {}

    leaderBoard(conf: string){
        return this.repository.leaderBoard(conf, ACTUAL_SEASON)
    }
}