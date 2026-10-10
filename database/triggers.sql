CREATE OR REPLACE FUNCTION validate_player_game_team()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM games
        WHERE id = NEW.game_id
          AND (
              home_team_id = NEW.team_id
              OR away_team_id = NEW.team_id
          )
    ) THEN
        RAISE EXCEPTION 'El equipo no participa en este partido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_player_game_team ON player_game_stats;

CREATE TRIGGER check_player_game_team
BEFORE INSERT OR UPDATE ON player_game_stats
FOR EACH ROW
EXECUTE FUNCTION validate_player_game_team();

CREATE OR REPLACE FUNCTION update_team_season_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_team RECORD;
BEGIN
    FOR v_team IN
        SELECT *
        FROM (
            VALUES
                (
                    NEW.home_team_id,
                    NEW.home_score,
                    NEW.away_score,
                    NEW.home_possessions,
                    NEW.away_possessions,
                    TRUE,
                    NEW.home_score > NEW.away_score
                ),
                (
                    NEW.away_team_id,
                    NEW.away_score,
                    NEW.home_score,
                    NEW.away_possessions,
                    NEW.home_possessions,
                    FALSE,
                    NEW.away_score > NEW.home_score
                )
        ) AS t(
            team_id, scored, allowed,
            possessions, opponent_possessions,
            is_home, won
        )
        ORDER BY t.team_id
    LOOP
        INSERT INTO team_season_stats AS s (
            team_id, season_init_year,
            victorys, losses, home_victory, home_losses,
            total_points, total_points_allowed,
            total_possessions, total_opponent_possessions,
            streak_number, streak_victory
        )
        VALUES (
            v_team.team_id, NEW.season_init_year,
            v_team.won::INTEGER,
            (NOT v_team.won)::INTEGER,
            (v_team.is_home AND v_team.won)::INTEGER,
            (v_team.is_home AND NOT v_team.won)::INTEGER,
            v_team.scored, v_team.allowed,
            v_team.possessions, v_team.opponent_possessions,
            1, v_team.won
        )
        ON CONFLICT (team_id, season_init_year)
        DO UPDATE SET
            victorys = s.victorys + EXCLUDED.victorys,
            losses = s.losses + EXCLUDED.losses,
            home_victory = s.home_victory + EXCLUDED.home_victory,
            home_losses = s.home_losses + EXCLUDED.home_losses,
            total_points = s.total_points + EXCLUDED.total_points,
            total_points_allowed =
                s.total_points_allowed + EXCLUDED.total_points_allowed,
            total_possessions =
                s.total_possessions + EXCLUDED.total_possessions,
            total_opponent_possessions =
                s.total_opponent_possessions
                + EXCLUDED.total_opponent_possessions,
            streak_number = CASE
                WHEN s.streak_victory = EXCLUDED.streak_victory
                    THEN s.streak_number + 1
                ELSE 1
            END,
            streak_victory = EXCLUDED.streak_victory;
    END LOOP;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_team_season_stats ON games;

CREATE TRIGGER trg_update_team_season_stats
AFTER INSERT ON games
FOR EACH ROW
WHEN (NEW.finished)
EXECUTE FUNCTION update_team_season_stats();



CREATE OR REPLACE FUNCTION update_player_season_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_season_init_year INTEGER;
BEGIN
    SELECT season_init_year
    INTO v_season_init_year
    FROM games
    WHERE id = NEW.game_id;

    INSERT INTO player_season_stats AS p (
        player_id, season_init_year, total_points, total_rebounds, 
        total_ofe_rebounds, total_def_rebounds, total_assists, total_steals, 
        total_blocks, total_turnovers, plusminus, total_fg_made, 
        total_fg_attempted, total_three_made, total_three_attempted, games_played
    )
    VALUES (
        NEW.player_id, v_season_init_year, NEW.points, NEW.rebounds,
        NEW.ofe_rebounds, NEW.def_rebounds, NEW.assists, NEW.steals,
        NEW.blocks, NEW.turnovers, NEW.plusminus, NEW.fg_made,
        NEW.fg_attempted, NEW.three_made, NEW.three_attempted, 1
    )
    ON CONFLICT (player_id, season_init_year)
    DO UPDATE SET
        total_points = p.total_points + EXCLUDED.total_points,
        total_rebounds = p.total_rebounds + EXCLUDED.total_rebounds,
        total_ofe_rebounds = p.total_ofe_rebounds + EXCLUDED.total_ofe_rebounds,
        total_def_rebounds = p.total_def_rebounds + EXCLUDED.total_def_rebounds,
        total_assists = p.total_assists + EXCLUDED.total_assists,
        total_steals = p.total_steals + EXCLUDED.total_steals,
        total_blocks = p.total_blocks + EXCLUDED.total_blocks,
        total_turnovers = p.total_turnovers + EXCLUDED.total_turnovers,
        plusminus = p.plusminus + EXCLUDED.plusminus,
        total_fg_made = p.total_fg_made + EXCLUDED.total_fg_made,
        total_fg_attempted = p.total_fg_attempted + EXCLUDED.total_fg_attempted,
        total_three_made = p.total_three_made + EXCLUDED.total_three_made,
        total_three_attempted = p.total_three_attempted + EXCLUDED.total_three_attempted,
        games_played = p.games_played + 1;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_player_season_stats ON player_game_stats;

CREATE TRIGGER trg_update_player_season_stats
AFTER INSERT ON player_game_stats
FOR EACH ROW
EXECUTE FUNCTION update_player_season_stats();