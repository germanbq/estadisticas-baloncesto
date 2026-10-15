export type Game = {
    id: number;
    homeTeamName: string;
    homeTeamLogo: string;
    homeTeamVictorys: number;
    homeTeamLosses: number;
    homeTeamScore: number | null;
    awayTeamName: string;
    awayTeamLogo: string;
    awayTeamVictorys: number;
    awayTeamLosses: number;
    awayTeamScore: number | null;
    finished: boolean;
    stadium: string;
    date: Date;
    isFavorite: boolean;
}

export type GamesNum = {
    date: string;
    gamesNumber: number;
}

export type GameProfile = Game & {
    homeTeamId: number;
    awayTeamId: number;
    homePeriodScores: number[];
    awayPeriodScores: number[];
    homeShortName: string;
    awayShortName: string;
    homeWinRate: number;
    homeNetRating: number;
    awayWinRate: number;
    awayNetRating: number;
    homePointsPerGame: number;
    homePointsAllowedPerGame: number;
    awayPointsPerGame: number;
    awayPointsAllowedPerGame: number;
    homeStreakNumber: number;
    homeStreakVictory: boolean;
    awayStreakNumber: number;
    awayStreakVictory: boolean;
}

export type LastTeamGame = {
    id: number;
    rivalName: string;
    home: boolean;
    stadium: string;
    score: number;
    rivalScore: number;
}

export type HeadToHeadGame = {
    id: number;
    date: Date,
    homeScore: number;
    awayScore: number;
    stadium: string;
    homeName: string;
    awayName: string;
}

export type StatLeader = {
    metric: string;
    value: number;
    name: string;
    jerseyNumber: string;
}

export type GameTeamStats = {
    fgMade: number;
    fgAttempted: number;
    threeMade: number;
    threeAttempted: number;
    ftMade: number;
    ftAttempted: number;
    paintPoints: number;
    fastbreakPoints: number;
    benchPoints: number;
    secondChancePoints: number;
    effectiveFieldGoal: number;
    trueShooting: number;
    offensiveRating: number;
    defensiveRating: number;
    rebounds: number;
    assists: number;
    steals: number;
    tapones: number;
    turnovers: number;
    personalFouls: number;
}

export type GameMVP = {
    teamId: number,
    playerId: number,
    playerName: string,
    teamShortName: string;
    jerseyNumber: number;
    position: string;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    secondsPlayed: number;
    plusMinus: number;
    fgMade: number;
    fgAttempted: number;
    threeMade: number;
    threeAttempted: number;
    ftMade: number;
    ftAttempted: number;
}

export type PlayerStats = {
    name: string;
    playerId: number;
    secondsPlayed: number;
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
}