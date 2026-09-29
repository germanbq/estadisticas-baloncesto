import type { SqlQuery } from "../shared/sql.types";
import type { PlayerProfile, LeaderPlayer } from "../entities/playersEntities";

export interface IPlayersQueries {
    leaders(metric: string, minGames: number, playersLimit: number, season: string): SqlQuery;
    profile(id: number): SqlQuery;
}

export interface IPlayersRepository {
    leadersList(metric: string, minGames: number, playersLimit: number, season: string): Promise<LeaderPlayer[]>;
    profileStats(id: number): Promise<PlayerProfile | null>;
}