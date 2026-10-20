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
            LEFT JOIN team_season_stats AS hts ON hts.team_id = ht.id
                AND hts.season_init_year = $2
            LEFT JOIN team_season_stats AS ats ON ats.team_id = at.id
                AND ats.season_init_year = $2
            WHERE g.date >= (
                ($1::date + TIME '10:00') AT TIME ZONE 'Europe/Madrid'
            )
            AND g.date < (
                (($1::date + 1) + TIME '10:00') AT TIME ZONE 'Europe/Madrid'
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
                    (d.day + TIME '10:00') AT TIME ZONE 'Europe/Madrid'
                )
                AND g.date < (
                    ((d.day + 1) + TIME '10:00') AT TIME ZONE 'Europe/Madrid'
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
                g.id,
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
                g.id,
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

    gameTeamStats(teamId: number, gameId: number): SqlQuery {
        return {
            text: `SELECT
                fg_made AS "fgMade",
                fg_attempted AS "fgAttempted",
                three_made AS "threeMade",
                three_attempted AS "threeAttempted",
                ft_made AS "ftMade",
                ft_attempted AS "ftAttempted",
                paint_points AS "paintPoints",
                fastbreak_points AS "fastbreakPoints",
                bench_points AS "benchPoints",
                second_chance_points AS "secondChancePoints",
                effective_field_goal_percentage::double precision AS "effectiveFieldGoal",
                true_shooting_percentage::double precision AS "trueShooting",
                offensive_rating AS "offensiveRating",
                defensive_rating AS "defensiveRating",
                rebounds,
                assists,
                steals,
                tapones,
                turnovers,
                personal_fouls AS "personalFouls"
            FROM team_game_stats
            WHERE team_id = $1 AND game_id = $2
            `,
            values: [
                teamId, 
                gameId
            ],
        };
    }

    gameMVP(gameId: number): SqlQuery {
        return {
            text: `WITH scored_players AS (
                    SELECT
                        s.*,
                        (
                            s.points
                            + 0.4 * s.fg_made
                            - 0.7 * s.fg_attempted
                            + 0.4 * s.three_made
                            - 0.6 * s.three_attempted
                            + 0.7 * s.ofe_rebounds
                            + 0.3 * s.def_rebounds
                            + s.assists
                            + 0.7 * s.steals
                            + 0.7 * s.blocks
                            - s.turnovers
                            + 0.2 * s.plusminus
                        ) AS mvp_score
                    FROM player_game_stats AS s
                    JOIN games AS g ON g.id = s.game_id
                    WHERE s.game_id = $1
                    AND g.finished
                    AND s.seconds_played > 0
                    )
                SELECT
                    sp.team_id AS "teamId",
                    sp.player_id AS "playerId",
                    p.name AS "playerName",
                    t.short_name AS "teamShortName",
                    p.jersey_number AS "jerseyNumber",
                    p.position,
                    sp.points,
                    sp.rebounds,
                    sp.assists,
                    sp.steals,
                    sp.blocks,
                    sp.seconds_played AS "secondsPlayed",
                    sp.plusminus AS "plusMinus",
                    sp.fg_made AS "fgMade",
                    sp.fg_attempted AS "fgAttempted",
                    sp.three_made AS "threeMade",
                    sp.three_attempted AS "threeAttempted",
                    sp.ft_made AS "ftMade",
                    sp.ft_attempted AS "ftAttempted"
                FROM scored_players AS sp
                JOIN players AS p ON p.id = sp.player_id
                JOIN teams AS t ON t.id = sp.team_id
                ORDER BY
                    mvp_score DESC,
                    points DESC,
                    player_id ASC
                LIMIT 1;
                `,
                values: [
                    gameId
                ],
        };
    }

   playersStats(gameId: number, teamId: number): SqlQuery {
        return {
            text: `SELECT
                p.name,
                pgs.player_id AS "playerId",
                pgs.seconds_played AS "secondsPlayed",
                pgs.points,
                pgs.rebounds,
                pgs.ofe_rebounds AS "ofeRebounds",
                pgs.def_rebounds AS "defRebounds",
                pgs.assists,
                pgs.steals,
                pgs.blocks,
                pgs.turnovers,
                pgs.plusminus AS "plusMinus",
                COALESCE(
                    100.0 * pgs.fg_made / NULLIF(pgs.fg_attempted, 0),
                    0
                )::double precision AS "fgPercentage",
                COALESCE(
                    100.0 * pgs.three_made / NULLIF(pgs.three_attempted, 0),
                    0
                )::double precision AS "threePercentage"
            FROM player_game_stats AS pgs
            JOIN players AS p ON p.id = pgs.player_id
            WHERE pgs.game_id = $1
                AND pgs.team_id = $2
            ORDER BY p.name DESC
            `,
            values: [
                gameId,
                teamId,
            ],
        };
    }
}
