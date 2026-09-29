import { SqlQuery } from "../shared/sql.types";
import type { IPlayersQueries } from "../interfaces/playersIntefaces";

const columnas: Record<string, string> = {
  PTS: "points",
  REB: "rebounds",
  AST: "assists",
};

export class PlayersQueries implements IPlayersQueries {
    leaders(metric: string, minGames: number, playersLimit: number, season: string): SqlQuery {
        const columna = columnas[metric];

        return {
            text: `
            SELECT p.name, p.image, t.short_name AS team, p.jersey_number, pss.${columna} AS value
            FROM players as p
            JOIN teams as t ON p.team_id = t.id
            JOIN player_season_stats AS pss ON pss.player_id = p.id
            WHERE pss.season_init_year = $1
            AND pss.games_played >= $2
            ORDER BY value DESC
            LIMIT $3`,
            values: [
            season,
            minGames,
            playersLimit,
            ],
        };
    }

    profile(id: number): SqlQuery {
        return {
            text: `
            SELECT
                p.name,
                p.height,
                p.weight,
                p.position,
                p.jersey_number,
                p.country,
                p.age,
                p.draft,
                t.name AS team,

                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'season', pss.season,
                                'points', pss.points,
                                'rebounds', pss.rebounds,
                                'ofeRebounds', pss.ofe_rebounds,
                                'defRebounds', pss.def_rebounds,
                                'assists', pss.assists,
                                'steals', pss.steals,
                                'blocks', pss.blocks,
                                'turnovers', pss.turnovers,
                                'plusMinus', pss.plusminus,
                                'fgPercentage', pss.fg_percentage,
                                'threePercentage', pss.three_percentage,
                                'fgMade', pss.fg_made,
                                'fgAttempted', pss.fg_attempted,
                                'gamesPlayed', pss.games_played
                            )
                            ORDER BY pss.season_init_year DESC
                        )
                        FROM player_season_stats AS pss
                        WHERE pss.player_id = p.id
                    ),
                    '[]'::jsonb
                ) AS seasons

            FROM players AS p
            JOIN teams AS t ON t.id = p.team_id
            WHERE p.id = $1;`,
            values: [
                id,
            ],
        };
    }
}