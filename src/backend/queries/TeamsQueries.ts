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
                tss.win_rate AS "winRate",
                tss.difference,
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
            ORDER BY tss.win_rate DESC
            `,
            values: [
                conf,
                userId,
                season,
            ],
        }
    }
}