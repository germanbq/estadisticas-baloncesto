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
                tss.victorys,
                tss.losses,
                COALESCE(
                    100.0 * tss.victorys / NULLIF(tss.victorys + tss.losses, 0), 
                    0
                )::double precision AS "winRate",
                COALESCE(
                    1.0 * (tss.total_points - tss.total_points_allowed)
                        / NULLIF(tss.victorys + tss.losses, 0),
                    0
                )::double precision AS difference,
                tss.streak_number AS "streakNumber",
                tss.streak_victory AS "streakVictory",
                EXISTS (
                    SELECT 1
                    FROM favorite_teams as ft
                    WHERE ft.team_id = t.id 
                        AND ft.user_id = $2
                ) AS "isFavorite"
            FROM teams AS t
            JOIN team_season_stats as tss ON tss.team_id = t.id
            WHERE t.conference = $1
                AND tss.season_init_year = $3
            ORDER BY "winRate" DESC
            `,
            values: [
                conf,
                userId,
                season,
            ],
        }
    }
}