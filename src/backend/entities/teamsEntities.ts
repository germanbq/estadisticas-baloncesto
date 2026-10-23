export type Team = {
    id: number;
    logo: string;
    name: string;
    division: string;
    victorys: number;
    losses: number;
    winRate: number;
    difference: number;
    streakNumber: number;
    streakVictory: boolean;
    isFavorite: boolean;
}

export type TeamHeader = Team & {
    shortName: string;
    conference: string;
    rank: number;
    stadium: string;
    coach: string;
    homeVictorys: number;
    homeLosses: number;
    awayVictorys: number;
    awayLosses: number;
};

export type teamPlayersStats = {
    playerName: string;
    playerId: number;
    points: number;
    rebounds: number;
    ofeRebounds: number;
    defRebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    plusMinus: number;
    fgPercentage: number;
    threePercentage: number;
    games: number;
}

export type UpcomingTeamGames = {
    id: number;
    rivalName: string;
    rivalLogo: string;
    home: boolean;
    stadium: string;
    date: Date;
}