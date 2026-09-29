import { SqlQuery } from "../shared/sql.types";
import type { IPlayersQueries } from "../interfaces/playersIntefaces";

const columnas: Record<string, string> = {
  PTS: "s.points_per_game",
  REB: "s.rebounds_per_game",
  AST: "s.assists_per_game",
};

export class PlayersQueries implements IPlayersQueries {
    leaders(metric: string, minGames: number, playersLimit: number, season: string): SqlQuery {
        const columna = columnas[metric];

        return {
            text: ``,
            values: [
            season,
            minGames,
            playersLimit,
            ],
        };
    }

    profile(id: number): SqlQuery {
        return {
            text: ``,
            values: [
            ],
        };
    }
}