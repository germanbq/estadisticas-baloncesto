import { IGamesQueries } from "../interfaces/gamesInterfaces";
import { SqlQuery } from "../shared/sql.types";

export default class GamesQueries implements IGamesQueries {
    dayGames(date: string, season: number): SqlQuery {
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
                g.date
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
            ],
        };
    }
}