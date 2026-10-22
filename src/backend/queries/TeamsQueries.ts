import { ITeamsQueries } from "../interfaces/teamsInterfaces";
import { SqlQuery } from "../shared/sql.types";

export class TeamsQueries implements ITeamsQueries {
    leaderBoard(conf: string, userId: string | null, season: number): SqlQuery {
        return{
            text: `SELECT
                t.id,
                t.logo,
                t.name,
                t.division,
                COALESCE(tss.victorys, 0) AS victorys,
                COALESCE(tss.losses, 0) AS losses,
                COALESCE(
                    100.0 * tss.victorys / NULLIF(tss.victorys + tss.losses, 0), 
                    0
                )::double precision AS "winRate",
                COALESCE(
                    1.0 * (tss.total_points - tss.total_points_allowed)
                        / NULLIF(tss.victorys + tss.losses, 0),
                    0
                )::double precision AS difference,
                COALESCE(tss.streak_number, 0) AS "streakNumber",
                COALESCE(tss.streak_victory, TRUE) AS "streakVictory",
                EXISTS (
                    SELECT 1
                    FROM favorite_teams as ft
                    WHERE ft.team_id = t.id 
                        AND ft.user_id = $2
                ) AS "isFavorite"
            FROM teams AS t
            LEFT JOIN team_season_stats AS tss ON tss.team_id = t.id
                AND tss.season_init_year = $3
            WHERE t.conference = $1
            ORDER BY "winRate" DESC, tss.victorys DESC, t.id ASC
            `,
            values: [
                conf,
                userId,
                season,
            ],
        }
    }

    teamProfile(teamId: number, userId: string | null, season: number): SqlQuery {
        return {
            text: `WITH ranked_teams AS (
                SELECT
                    t.id,
                    t.logo,
                    t.name,
                    t.short_name AS "shortName",
                    t.conference,
                    t.division,
                    t.stadium,
                    t.coach,
                    COALESCE(tss.victorys, 0) AS victorys,
                    COALESCE(tss.losses, 0) AS losses,
                    COALESCE(
                        100.0 * tss.victorys / NULLIF(tss.victorys + tss.losses, 0),
                        0
                    )::double precision AS "winRate",
                    COALESCE(
                        1.0 * (tss.total_points - tss.total_points_allowed)
                            / NULLIF(tss.victorys + tss.losses, 0),
                        0
                    )::double precision AS difference,
                    COALESCE(tss.streak_number, 0) AS "streakNumber",
                    COALESCE(tss.streak_victory, TRUE) AS "streakVictory",
                    COALESCE(tss.home_victory, 0) AS "homeVictorys",
                    COALESCE(tss.home_losses, 0) AS "homeLosses",
                    COALESCE(tss.victorys - tss.home_victory, 0) AS "awayVictorys",
                    COALESCE(tss.losses - tss.home_losses, 0) AS "awayLosses",
                    (RANK() OVER (
                        PARTITION BY t.conference
                        ORDER BY COALESCE(
                            1.0 * tss.victorys / NULLIF(tss.victorys + tss.losses, 0),
                            0
                        ) DESC
                    ))::integer AS rank
                FROM teams AS t
                LEFT JOIN team_season_stats AS tss ON tss.team_id = t.id
                    AND tss.season_init_year = $3
            )
            SELECT
                rt.*,
                EXISTS (
                    SELECT 1
                    FROM favorite_teams AS ft
                    WHERE ft.team_id = rt.id
                        AND ft.user_id = $2
                ) AS "isFavorite"
            FROM ranked_teams AS rt
            WHERE rt.id = $1`,
            values: [
                teamId,
                userId,
                season,
            ],
        };
    }

    playersSeasonStats(teamId: number, season: number): SqlQuery {
        return {
            text:`SELECT
                p.name AS "playerName",
                p.id AS "playerId",
                COALESCE(
                    1.0 * pss.total_points / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "points",
                COALESCE(
                    1.0 * pss.total_rebounds / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "rebounds",
                COALESCE(
                    1.0 * pss.total_ofe_rebounds / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "ofeRebounds",
                COALESCE(
                    1.0 * pss.total_def_rebounds / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "defRebounds",
                COALESCE(
                    1.0 * pss.total_assists / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "assists",
                COALESCE(
                    1.0 * pss.total_steals / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "steals",
                COALESCE(
                    1.0 * pss.total_blocks / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "blocks",
                COALESCE(
                    1.0 * pss.total_turnovers / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "turnovers",
                COALESCE(
                    1.0 * pss.plusminus / NULLIF(pss.games_played, 0),
                    0
                )::double precision AS "plusMinus",
                COALESCE(
                    100.0 * pss.total_fg_made / NULLIF(pss.total_fg_attempted, 0),
                    0
                )::double precision AS "fgPercentage",
                COALESCE(
                    100.0 * pss.total_three_made / NULLIF(pss.total_three_attempted, 0),
                    0
                )::double precision AS "threePercentage",
                pss.games_played AS games
                FROM player_season_stats AS pss
                JOIN players AS p ON p.id = pss.player_id
                WHERE p.team_id = $1 
                    AND pss.season_init_year = $2
                ORDER BY p.name ASC
            `,
            values: [
                teamId,
                season,
            ],
        };
    }
}
