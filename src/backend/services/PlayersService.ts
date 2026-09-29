import { LeaderPlayer, PlayerProfile } from "../entities/playersEntities";
import { IPlayersRepository } from "../interfaces/playersIntefaces";

import { MIN_GAMES_FOR_LEADERS, LIMIT_LEADER_PLAYERS, ACTUAL_SEASON } from "../rules/playersRules";

export class PlayersService {

    constructor(private readonly repository: IPlayersRepository) {}

    leadersList(metric: string): Promise<LeaderPlayer[]> {
        return this.repository.leadersList(metric, MIN_GAMES_FOR_LEADERS, LIMIT_LEADER_PLAYERS, ACTUAL_SEASON);
    }
    profileStats(id: number): Promise<PlayerProfile | null> {
        return this.repository.profileStats(id);
    }
    
}