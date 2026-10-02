import type { SqlQuery } from "../shared/sql.types";
import type { PlayerProfile, LeaderPlayer, PlayerGames, SearchedPlayer } from "../entities/playersEntities";

export interface IPlayersQueries {
    leaders(metric: string, minGames: number, playersLimit: number, season: number): SqlQuery;
    profile(id: number): SqlQuery;
    lastGames(id: number, gamesLimit: number): SqlQuery;
    searchPlayers(search: string, pos: string, conf: string, season: number): SqlQuery;
}

export interface IPlayersRepository {
    leadersList(metric: string, minGames: number, playersLimit: number, season: number): Promise<LeaderPlayer[]>;
    profileStats(id: number): Promise<PlayerProfile | null>;
    lastGames(id: number, gamesLimit: number): Promise<PlayerGames[]>;
    searchPlayers(search: string, pos: string, conf: string, season: number): Promise<SearchedPlayer[]>;
}