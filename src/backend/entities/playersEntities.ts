export type Player = {
    name: string;
    image: string;
    team: string;
    jerseyNumber: number;
    position: string;
}

export type LeaderPlayer = Player & {
    id: number;
    value: number;
}

export type PlayerSeasonStats = {
    season: string;
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

export type PlayerProfile = Player & {
    country: string;
    height: number;
    weight: number;
    age: number;
    draft: number;
    seasons: PlayerSeasonStats[];
}

export type PlayerGames = {
    gameId: number;
    victory: boolean;
    home: boolean;
    rival: string;
    homeScore: number;
    awayScore: number;
    date: Date;
    secondsPlayed: number;
    stadium: string;
    points: number;
    rebounds: number;
    assists: number;
    fgMade: number;
    fgAttempted: number;
}

export type SearchedPlayer = Player & {
    id: number;
    age: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
}
