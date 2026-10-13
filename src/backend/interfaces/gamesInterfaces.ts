import { Game, GameProfile, GamesNum, HeadToHeadGame, LastTeamGame, StatLeader } from "../entities/gamesEntities";
import { SqlQuery } from "../shared/sql.types";

export interface IGamesQueries {
    dayGames(date: string, userId: string | null, season: number): SqlQuery;
    gamesNumber(date: string): SqlQuery;
    gameById(id: number, userId: string | null): SqlQuery;
    lastTeamGames(id: number): SqlQuery;
    headToHeadGames(homeId: number, awayId: number, season: number): SqlQuery;
    statsLeaders(teamId: number, season: number): SqlQuery;
}

export interface IGamesRepository {
    dayGames(date: string, userId: string | null, season: number): Promise<Game[]>;
    gamesNumber(date: string): Promise<GamesNum[]>;
    gameById(id: number, userId: string | null): Promise<GameProfile | null>;
    lastTeamGames(id: number): Promise<LastTeamGame[]>;
    headToHeadGames(homeId: number, awayId: number, season: number): Promise<HeadToHeadGame[]>;
    statsLeaders(teamId: number, season: number): Promise<StatLeader[]>;
}