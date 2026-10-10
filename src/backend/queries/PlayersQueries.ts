import { SqlQuery } from "../shared/sql.types";
import type { IPlayersQueries } from "../interfaces/playersIntefaces";

export class PlayersQueries implements IPlayersQueries {
    leadersList(metric: string, minGames: number, playersLimit: number, season: number): SqlQuery {
        let valueExpression: string;
        if(metric === "fg_percentage") {
            valueExpression = `COALESCE(
                100.0 * pss.total_fg_made / NULLIF(pss.total_fg_attempted, 0),
                0
            )::double precision`;
        } else if(metric === "three_percentage") {
            valueExpression = `COALESCE(
                100.0 * pss.total_three_made / NULLIF(pss.total_three_attempted, 0),
                0
            )::double precision`;
        } else {
            valueExpression = `COALESCE (
                    1.0 * pss.total_${metric} / NULLIF(pss.games_played, 0),
                    0
                )::double precision`;
        }
        return {
            text: `SELECT
                p.id,
                p.name,
                p.image,
                p.position,
                t.short_name AS team,
                p.jersey_number AS "jerseyNumber",
                ${valueExpression} AS value
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

    profileStats(id: number, userId: string | null): SqlQuery {
        return {
            text: `SELECT
                p.id,
                p.name,
                p.image,
                p.height,
                p.weight,
                p.position,
                p.jersey_number AS "jerseyNumber",
                p.country,
                p.age,
                p.draft,
                t.name AS team,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'season', pss.season_init_year,
                                'points', COALESCE(
                                    1.0 * pss.total_points / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'rebounds', COALESCE(
                                    1.0 * pss.total_rebounds / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'ofeRebounds', COALESCE(
                                    1.0 * pss.total_ofe_rebounds / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'defRebounds', COALESCE(
                                    1.0 * pss.total_def_rebounds / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'assists', COALESCE(
                                    1.0 * pss.total_assists / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'steals', COALESCE(
                                    1.0 * pss.total_steals / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'blocks', COALESCE(
                                    1.0 * pss.total_blocks / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'turnovers', COALESCE(
                                    1.0 * pss.total_turnovers / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'plusMinus', COALESCE(
                                    1.0 * pss.plusminus / NULLIF(pss.games_played, 0),
                                    0
                                )::double precision,
                                'fgPercentage', COALESCE(
                                    100.0 * pss.total_fg_made / NULLIF(pss.total_fg_attempted, 0),
                                    0
                                )::double precision,
                                'threePercentage', COALESCE(
                                    100.0 * pss.total_three_made / NULLIF(pss.total_three_attempted, 0),
                                    0
                                )::double precision,
                                'games', pss.games_played
                            )
                            ORDER BY pss.season_init_year DESC
                        )
                        FROM player_season_stats AS pss
                        WHERE pss.player_id = p.id
                    ),
                    '[]'::jsonb
                ) AS seasons,
                EXISTS (
                    SELECT 1
                    FROM favorite_players AS fp
                    WHERE fp.player_id = p.id
                        AND fp.user_id = $2
                ) AS "isFavorite"
            FROM players AS p
            JOIN teams AS t ON t.id = p.team_id
            WHERE p.id = $1;`,
            values: [
                id,
                userId,
            ],
        };
    }

    lastGames(id: number, gamesLimit: number): SqlQuery {
        return{
            text: `SELECT
                pgs.game_id AS "gameId",
                riv.short_name as rival,
                g.home_score AS "homeScore",
                g.away_score AS "awayScore",
                g.date,
                pgs.seconds_played AS "secondsPlayed",
                ht.stadium,
                pgs.points,
                pgs.rebounds,
                pgs.assists,
                pgs.fg_made AS "fgMade",
                pgs.fg_attempted AS "fgAttempted",
                CASE
                    WHEN pgs.team_id = g.home_team_id
                        THEN g.home_score > g.away_score
                    WHEN pgs.team_id = g.away_team_id
                        THEN g.away_score > g.home_score
                END AS victory,
                (pgs.team_id = g.home_team_id) AS home
            FROM player_game_stats AS pgs
            JOIN games AS g ON pgs.game_id = g.id
            JOIN teams AS riv
                ON riv.id = CASE
                    WHEN pgs.team_id = g.home_team_id
                        THEN g.away_team_id
                    ELSE g.home_team_id
                END
            JOIN teams AS ht ON g.home_team_id = ht.id
            WHERE pgs.player_id = $1 AND g.finished = TRUE
            ORDER BY g.date DESC
            LIMIT $2
            `,
            values: [
                id,
                gamesLimit,
            ],
        }
    }

    searchPlayers(search: string, pos: string, conf: string, userId: string | null, season: number): SqlQuery {
        return {
            text: `SELECT
                p.id,
                p.name,
                p.image,
                t.name AS team,
                p.jersey_number as "jerseyNumber",
                p.position,
                p.age,
                COALESCE(
                    1.0 * pss.total_points / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS points,
                COALESCE(
                    1.0 * pss.total_rebounds / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS rebounds,
                COALESCE(
                    1.0 * pss.total_assists / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS assists,
                COALESCE(
                    1.0 * pss.total_steals / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS steals,
                COALESCE(
                    1.0 * pss.total_blocks / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS blocks,
                EXISTS (
                    SELECT 1
                    FROM favorite_players AS fp
                    WHERE fp.player_id = p.id
                        AND fp.user_id = $5
                ) AS "isFavorite"
            FROM players AS p
            JOIN teams AS t ON t.id = p.team_id
            JOIN player_season_stats AS pss ON pss.player_id = p.id
            WHERE p.name ILIKE '%' || $1 || '%'
                AND ($2 = 'ALL' OR p.position = $2)
                AND ($3 = 'BOTH' OR t.conference = $3)
                AND pss.season_init_year = $4
            ORDER BY COALESCE(
                (pss.total_points + pss.total_assists * 1.8 + pss.total_rebounds * 2)
                    / NULLIF(pss.games_played, 0),
                0
            ) DESC
            `,
            values: [
                search,
                pos,
                conf,
                season,
                userId,
            ],
        }
    }
}
