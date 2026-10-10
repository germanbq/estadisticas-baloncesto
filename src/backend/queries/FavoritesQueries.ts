import { IFavoritesQueries } from "../interfaces/favoritesInterfaces";
import { SqlQuery } from "../shared/sql.types";

export class FavoritesQueries implements IFavoritesQueries {
    favoriteCounts(userId: string): SqlQuery {
        return {
            text:`SELECT
                (
                    SELECT COUNT(*)::integer
                    FROM favorite_games
                    WHERE user_id = $1
                ) AS "numberGames",
                (
                    SELECT COUNT(*)::integer
                    FROM favorite_players
                    WHERE user_id = $1
                ) AS "numberPlayers",
                (
                    SELECT COUNT(*)::integer
                    FROM favorite_teams
                    WHERE user_id = $1
                ) AS "numberTeams"
            `,
            values: [
                userId
            ],
        };
    }

    favoriteGames(userId: string): SqlQuery {
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
                TRUE as "isFavorite"
            FROM favorite_games as fg
            JOIN games AS g ON g.id = fg.game_id
            JOIN teams AS ht ON ht.id = g.home_team_id
            JOIN teams AS at ON at.id = g.away_team_id
            LEFT JOIN team_season_stats AS hts ON hts.team_id = ht.id
                AND hts.season_init_year = g.season_init_year
            LEFT JOIN team_season_stats AS ats ON ats.team_id = at.id
                AND ats.season_init_year = g.season_init_year
            WHERE fg.user_id = $1
            ORDER BY g.date DESC
            `,
            values: [
                userId,
            ],
        };
    }

    favoritePlayers(userId: string, season: number): SqlQuery {
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
                TRUE AS "isFavorite"
            FROM favorite_players AS fp
            JOIN players AS p ON p.id = fp.player_id
            JOIN teams AS t ON t.id = p.team_id
            LEFT JOIN player_season_stats AS pss
                ON pss.player_id = p.id
                AND pss.season_init_year = $2
            WHERE fp.user_id = $1
            ORDER BY COALESCE(
                (pss.total_points + pss.total_assists * 1.8 + pss.total_rebounds * 2)
                    / NULLIF(pss.games_played, 0),
                0
            ) DESC
            `,
            values: [
                userId,
                season
            ],
        };
    }

    favoriteTeams(userId: string, season: number): SqlQuery {
        return {
            text:`SELECT
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
                TRUE as "isFavorite"
            FROM favorite_teams as ft
            JOIN teams AS t ON t.id = ft.team_id
            JOIN team_season_stats as tss ON tss.team_id = t.id
            WHERE ft.user_id = $1
                AND tss.season_init_year = $2
            ORDER BY "winRate" DESC
            `,
            values: [
                userId,
                season,
            ],
        };
    }


    addFavoriteGame(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            INSERT INTO favorite_games (user_id, game_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, game_id) DO nothing
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }

    addFavoritePlayer(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            INSERT INTO favorite_players (user_id, player_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, player_id) DO nothing
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }

    addFavoriteTeam(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            INSERT INTO favorite_teams (user_id, team_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, team_id) DO nothing
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }


    removeFavoriteGame(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            DELETE FROM favorite_games
            WHERE user_id = $1 AND game_id = $2
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }

    removeFavoritePlayer(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            DELETE FROM favorite_players
            WHERE user_id = $1 AND player_id = $2
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }

    removeFavoriteTeam(userId: string, itemId: number): SqlQuery {
        return {
            text: `
            DELETE FROM favorite_teams
            WHERE user_id = $1 AND team_id = $2
            `,
            values: [
                userId,
                itemId,
            ],
        };
    }
}
