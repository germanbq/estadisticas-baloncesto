import { Team } from "./teamsEntities";

export type FavCounts = {
    numberGames: number;
    numberPlayers: number;
    numberTeams: number;
}

export type FavoriteTeam = Team & {
    netRating: number;
    position: number;
    nextMatch: string;
    nextMatchDate: Date;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    homeVictorys: number;
    homeLosses: number;
}
 