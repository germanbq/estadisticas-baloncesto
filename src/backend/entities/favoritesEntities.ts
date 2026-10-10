export type FavCounts = {
    numberGames: number;
    numberPlayers: number;
    numberTeams: number;
}

export type FavoriteTeam = {
    id: number;
    logo: string;
    name: string;
    division: string;
    victorys: number;
    losses: number;
    streakNumber: number;
    streakVictory: boolean;
    isFavorite: boolean;
    netRating: number;
    position: number;
    nextMatch: string | null;
    nextMatchDate: Date | null;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    homeVictorys: number;
    homeLosses: number;
}
 