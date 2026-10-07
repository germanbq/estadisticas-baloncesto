import { LeaderPlayer, PlayerGames, PlayerProfile, SearchedPlayer } from "../entities/playersEntities";
import { IPlayersRepository } from "../interfaces/playersIntefaces";

import { MIN_GAMES_FOR_LEADERS, LIMIT_LEADER_PLAYERS, ACTUAL_SEASON, LIMIT_GAMES_PER_PLAYER } from "../rules/rules";

export class PlayersService {

    constructor(private readonly repository: IPlayersRepository) {}

    leadersList(metric: string): Promise<LeaderPlayer[]> {
        return this.repository.leadersList(metric, MIN_GAMES_FOR_LEADERS, LIMIT_LEADER_PLAYERS, ACTUAL_SEASON);
    }

    profileStats(id: number, userId: string | null): Promise<PlayerProfile | null> {
        return this.repository.profileStats(id, userId);
    }
    
    lastGames(id: number): Promise<PlayerGames[]> {
        return this.repository.lastGames(id, LIMIT_GAMES_PER_PLAYER);
    }

    searchPlayers(search: string, pos: string, conf: string, userId: string | null): Promise<SearchedPlayer[]> {
        return this.repository.searchPlayers(search, pos, conf, userId, ACTUAL_SEASON);
    }
}