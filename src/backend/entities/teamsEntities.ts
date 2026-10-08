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