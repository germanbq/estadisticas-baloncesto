import type { SqlQuery } from "../shared/sql.types";
import type { PlayerProfile, LeaderPlayer, PlayerGames, SearchedPlayer } from "../entities/playersEntities";

export interface IPlayersQueries {
    leadersList(metric: string, minGames: number, playersLimit: number, season: number): SqlQuery;
    profileStats(id: number, userId: string | null): SqlQuery;
    lastGames(id: number, gamesLimit: number): SqlQuery;
    searchPlayers(search: string, pos: string, conf: string, userId: string | null, season: number): SqlQuery;
}

export interface IPlayersRepository {
    leadersList(metric: string, minGames: number, playersLimit: number, season: number): Promise<LeaderPlayer[]>;
    profileStats(id: number, userId: string | null): Promise<PlayerProfile | null>;
    lastGames(id: number, gamesLimit: number): Promise<PlayerGames[]>;
    searchPlayers(search: string, pos: string, conf: string, userId: string | null, season: number): Promise<SearchedPlayer[]>;
}