import { Game, GameMVP, GameProfile, GamesNum, GameTeamStats, HeadToHeadGame, LastTeamGame, PlayerStats, StatLeader } from "../entities/gamesEntities";
import { SqlQuery } from "../shared/sql.types";

export interface IGamesQueries {
    dayGames(date: string, userId: string | null, season: number): SqlQuery;
    gamesNumber(date: string): SqlQuery;
    gameById(id: number, userId: string | null): SqlQuery;
    lastTeamGames(id: number, season: number): SqlQuery;
    headToHeadGames(homeId: number, awayId: number, season: number): SqlQuery;
    statsLeaders(teamId: number, season: number): SqlQuery;
    gameTeamStats(teamId: number, gameId: number): SqlQuery;
    gameMVP(gameId: number): SqlQuery;
    playersStats(gameId: number, teamId: number): SqlQuery;
}

export interface IGamesRepository {
    dayGames(date: string, userId: string | null, season: number): Promise<Game[]>;
    gamesNumber(date: string): Promise<GamesNum[]>;
    gameById(id: number, userId: string | null): Promise<GameProfile | null>;
    lastTeamGames(id: number, season: number): Promise<LastTeamGame[]>;
    headToHeadGames(homeId: number, awayId: number, season: number): Promise<HeadToHeadGame[]>;
    statsLeaders(teamId: number, season: number): Promise<StatLeader[]>;
    gameTeamStats(teamId: number, gameId: number): Promise<GameTeamStats | undefined>;
    gameMVP(gameId: number): Promise<GameMVP>;
    playersStats(gameId: number, teamId: number): Promise<PlayerStats[]>;
}