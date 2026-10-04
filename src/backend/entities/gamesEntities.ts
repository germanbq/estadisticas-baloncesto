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
}