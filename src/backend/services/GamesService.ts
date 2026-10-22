import { Game, GameMVP, GameProfile, GamesNum, GameTeamStats, HeadToHeadGame, LastTeamGame, PlayerStats, StatLeader } from "../entities/gamesEntities";
import { IGamesRepository } from "../interfaces/gamesInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export default class GamesService {
    constructor(private readonly repository: IGamesRepository) {}

    dayGames(date: string, userId: string | null): Promise<Game[]> {
        return this.repository.dayGames(date, userId, ACTUAL_SEASON);
    }

    gamesNumber(date: string): Promise<GamesNum[]> {
        return this.repository.gamesNumber(date);
    }

    gameById(id: number, userId: string | null): Promise<GameProfile | undefined> {
        return this.repository.gameById(id, userId);
    }

    lastTeamGames(id: number): Promise<LastTeamGame[]> {
        return this.repository.lastTeamGames(id, ACTUAL_SEASON);
    }

    headToHeadGames(homeId: number, awayId: number): Promise<HeadToHeadGame[]> {
        return this.repository.headToHeadGames(homeId, awayId, ACTUAL_SEASON);
    }

    statsLeaders(teamId: number): Promise<StatLeader[]> {
        return this.repository.statsLeaders(teamId, ACTUAL_SEASON);
    }

    gameTeamStats(teamId: number, gameId: number): Promise<GameTeamStats | undefined> {
        return this.repository.gameTeamStats(teamId, gameId);
    }

    gameMVP(teamId: number): Promise<GameMVP> {
        return this.repository.gameMVP(teamId);
    }

    playersStats(gameId: number, teamId: number): Promise<PlayerStats[]> {
        return this.repository.playersStats(gameId, teamId);
    }
}