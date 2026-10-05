import { Game, GamesNum } from "../entities/gamesEntities";
import { IGamesRepository } from "../interfaces/gamesInterfaces";
import { ACTUAL_SEASON } from "../rules/rules";

export default class GamesService {
    constructor(private readonly repository: IGamesRepository) {}

    dayGames(date: string): Promise<Game[]> {
        return this.repository.dayGames(date, ACTUAL_SEASON);
    }

    gamesNumber(date: string): Promise<GamesNum[]> {
        return this.repository.gamesNumber(date);
    }
}