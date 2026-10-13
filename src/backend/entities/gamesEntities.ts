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
    rivalName: string;
    home: boolean;
    stadium: string;
    score: number;
    rivalScore: number;
}

export type HeadToHeadGame = {
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