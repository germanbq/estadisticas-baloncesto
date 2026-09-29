export type Player = {
    name: string;
    image: string;
    team: string;
    jersey_number: string;
}

export type LeaderPlayer = Player & {
    value: number;
}

export type PlayerSeasonStats = {
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
    fgFraction: number;
}

export type PlayerProfile = Player & {
    position: string;
    country: string;
    height: number;
    weight: number;
    age: number;
    draft: number;
    seasons: PlayerSeasonStats[];
}
