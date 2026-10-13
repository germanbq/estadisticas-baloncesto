import { IGamesQueries } from "../interfaces/gamesInterfaces";
import { SqlQuery } from "../shared/sql.types";

export default class GamesQueries implements IGamesQueries {
    dayGames(date: string, userId: string | null, season: number): SqlQuery {
        return {
            text: `SELECT
                g.id,
                ht.name AS "homeTeamName",
                ht.logo AS "homeTeamLogo",
                hts.victorys AS "homeTeamVictorys",
                hts.losses AS "homeTeamLosses",
                g.home_score AS "homeTeamScore",
                at.name AS "awayTeamName",
                at.logo AS "awayTeamLogo",
                ats.victorys AS "awayTeamVictorys",
                ats.losses AS "awayTeamLosses",
                g.away_score AS "awayTeamScore",
                g.finished,
                ht.stadium,
                g.date,
                EXISTS (
                    SELECT 1
                    FROM favorite_games AS fg
                    WHERE fg.game_id = g.id 
                        AND fg.user_id = $3
                ) AS "isFavorite"
            FROM games AS g
            JOIN teams AS ht ON ht.id = g.home_team_id
            JOIN teams AS at ON at.id = g.away_team_id
            JOIN team_season_stats AS hts ON hts.team_id = ht.id
                AND hts.season_init_year = $2
            JOIN team_season_stats AS ats ON ats.team_id = at.id
                AND ats.season_init_year = $2
            WHERE g.date >= (
                $1::date::timestamp AT TIME ZONE 'Europe/Madrid'
            )
            AND g.date < (
                ($1::date + 1)::timestamp AT TIME ZONE 'Europe/Madrid'
            )
            ORDER BY g.date ASC
            `,
            values: [
                date,
                season,
                userId,
            ],
        };
    }

    gamesNumber(date: string): SqlQuery {
        return {
            text: `
            WITH days AS (
                SELECT $1::date + offset_day AS day
                FROM generate_series(-2, 2) AS offsets(offset_day)
            )
            SELECT
                to_char(d.day, 'YYYY-MM-DD') AS date,
                COUNT(g.id)::integer AS "gamesNumber"
            FROM days AS d
            LEFT JOIN games AS g
                ON g.date >= (
                    d.day::timestamp AT TIME ZONE 'Europe/Madrid'
                )
                AND g.date < (
                    (d.day + 1)::timestamp AT TIME ZONE 'Europe/Madrid'
                )
            GROUP BY d.day
            ORDER BY d.day;
            `,
            values: [
                date,
            ],
        };
    }

    gameById(id: number, userId: string | null): SqlQuery {
        return {
            text: `SELECT
                g.id,
                ht.name AS "homeTeamName",
                ht.logo AS "homeTeamLogo",
                hts.victorys AS "homeTeamVictorys",
                hts.losses AS "homeTeamLosses",
                g.home_score AS "homeTeamScore",
                at.name AS "awayTeamName",
                at.logo AS "awayTeamLogo",
                ats.victorys AS "awayTeamVictorys",
                ats.losses AS "awayTeamLosses",
                g.away_score AS "awayTeamScore",
                g.finished,
                ht.stadium,
                g.date,
                EXISTS (
                    SELECT 1
                    FROM favorite_games AS fg
                    WHERE fg.game_id = g.id 
                        AND fg.user_id = $2
                ) AS "isFavorite",
                g.home_team_id AS "homeTeamId",
                g.away_team_id AS "awayTeamId",
                g.home_period_scores AS "homePeriodScores",
                g.away_period_scores AS "awayPeriodScores",
                ht.short_name AS "homeShortName",
                at.short_name AS "awayShortName",
                COALESCE(
                    100.0 * hts.victorys / NULLIF(hts.victorys + hts.losses, 0), 
                    0
                )::double precision AS "homeWinRate",
               (
                    COALESCE(
                        100.0 * hts.total_points / NULLIF(hts.total_possessions, 0),
                        0
                    ) - COALESCE(
                        100.0 * hts.total_points_allowed
                            / NULLIF(hts.total_opponent_possessions, 0),
                        0
                    )
                )::double precision AS "homeNetRating",
                COALESCE(
                    100.0 * ats.victorys / NULLIF(ats.victorys + ats.losses, 0), 
                    0
                )::double precision AS "awayWinRate",
                (
                    COALESCE(
                        100.0 * ats.total_points / NULLIF(ats.total_possessions, 0),
                        0
                    ) - COALESCE(
                        100.0 * ats.total_points_allowed
                            / NULLIF(ats.total_opponent_possessions, 0),
                        0
                    )
                )::double precision AS "awayNetRating",
                COALESCE(
                    1.0 * hts.total_points / NULLIF(hts.victorys + hts.losses, 0),
                    0
                )::double precision AS "homePointsPerGame",
                COALESCE(
                    1.0 * hts.total_points_allowed / NULLIF(hts.victorys + hts.losses, 0),
                    0
                )::double precision AS "homePointsAllowedPerGame",
                COALESCE(
                    1.0 * ats.total_points / NULLIF(ats.victorys + ats.losses, 0),
                    0
                )::double precision AS "awayPointsPerGame",
                COALESCE(
                    1.0 * ats.total_points_allowed / NULLIF(ats.victorys + ats.losses, 0),
                    0
                )::double precision AS "awayPointsAllowedPerGame",
                hts.streak_number AS "homeStreakNumber",
                hts.streak_victory AS "homeStreakVictory",
                ats.streak_number AS "awayStreakNumber",
                ats.streak_victory AS "awayStreakVictory"
            FROM games AS g
            JOIN teams AS ht ON ht.id = g.home_team_id
            JOIN teams AS at ON at.id = g.away_team_id
            JOIN team_season_stats AS hts ON hts.team_id = ht.id
                AND hts.season_init_year = g.season_init_year
            JOIN team_season_stats AS ats ON ats.team_id = at.id
                AND ats.season_init_year = g.season_init_year
            WHERE g.id = $1
            `,
            values: [
                id,
                userId,
            ],
        };
    }

    lastTeamGames(id: number): SqlQuery {
        return {
            text: `SELECT
            CASE WHEN g.home_team_id = $1
                THEN at.name
                ELSE ht.name
            END AS "rivalName",
            (g.home_team_id = $1) AS home,
            ht.stadium,
            CASE WHEN g.home_team_id = $1
                THEN g.home_score
                ELSE g.away_score
            END AS score,
            CASE WHEN g.home_team_id = $1
                THEN g.away_score
                ELSE g.home_score
            END AS "rivalScore"
            FROM games AS g
            JOIN teams AS ht ON ht.id = g.home_team_id
            JOIN teams AS at ON at.id = g.away_team_id
            WHERE (g.home_team_id = $1 OR g.away_team_id = $1)
                AND g.finished = TRUE
            ORDER BY g.date DESC
            LIMIT 5
            `,
            values: [
                id
            ],
        };
    }

    headToHeadGames(homeId: number, awayId: number, season: number): SqlQuery {
        return {
            text:`SELECT
                g.date,
                g.home_score AS "homeScore",
                g.away_score AS "awayScore",
                ht.stadium,
                ht.name AS "homeName",
                at.name AS "awayName"
            FROM games AS g
            JOIN teams AS ht ON ht.id = g.home_team_id
            JOIN teams AS at ON at.id = g.away_team_id
            WHERE (g.home_team_id = $1 OR g.away_team_id = $1)
                AND (g.away_team_id = $2 OR g.home_team_id = $2)
                AND g.season_init_year = $3
                AND g.finished = TRUE
            ORDER BY g.date DESC
            `,
            values: [
                homeId,
                awayId,
                season,
            ],
        };
    }

    statsLeaders(teamId: number, season: number): SqlQuery {
        return {
            text: `
                SELECT
                    CASE leaders.metric
                        WHEN 'points' THEN 'Puntos'
                        WHEN 'rebounds' THEN 'Rebotes'
                        WHEN 'assists' THEN 'Asistencias'
                        WHEN 'steals' THEN 'Robos'
                        WHEN 'blocks' THEN 'Tapones'
                        ELSE leaders.metric
                    END AS metric,
                    leaders.name,
                    leaders."jerseyNumber",
                    leaders.value
                FROM (
                    SELECT DISTINCT ON (stats.metric)
                        stats.metric,
                        p.name,
                        p.jersey_number AS "jerseyNumber",
                        stats.value::double precision AS value
                    FROM players AS p
                    JOIN player_season_stats AS pss
                        ON pss.player_id = p.id
                    CROSS JOIN LATERAL (
                        VALUES
                            ('points',   1.0 * pss.total_points   / NULLIF(pss.games_played, 0)),
                            ('rebounds', 1.0 * pss.total_rebounds / NULLIF(pss.games_played, 0)),
                            ('assists',  1.0 * pss.total_assists  / NULLIF(pss.games_played, 0)),
                            ('steals',   1.0 * pss.total_steals   / NULLIF(pss.games_played, 0)),
                            ('blocks',   1.0 * pss.total_blocks   / NULLIF(pss.games_played, 0))
                    ) AS stats(metric, value)
                    WHERE p.team_id = $1
                        AND pss.season_init_year = $2
                        AND pss.games_played > 0
                        AND stats.value IS NOT NULL
                    ORDER BY stats.metric, stats.value DESC, p.id ASC
                ) AS leaders
                ORDER BY CASE leaders.metric
                    WHEN 'points' THEN 1
                    WHEN 'rebounds' THEN 2
                    WHEN 'assists' THEN 3
                    WHEN 'steals' THEN 4
                    WHEN 'blocks' THEN 5
                    ELSE 6
                END
            `,
            values: [teamId, season],
        };
    }
}
