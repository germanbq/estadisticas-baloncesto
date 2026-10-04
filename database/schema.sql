DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_season_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS player_season_stats CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS player_game_stats CASCADE;
DROP FUNCTION IF EXISTS validate_player_game_team() CASCADE;

CREATE TABLE teams (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL UNIQUE,
    logo TEXT NOT NULL,
    conference TEXT NOT NULL,
    division TEXT NOT NULL,
    stadium TEXT NOT NULL UNIQUE
);

CREATE TABLE team_season_stats (
    team_id INTEGER REFERENCES teams(id),
    season_init_year INTEGER NOT NULL,
    victorys INTEGER NOT NULL,
    losses INTEGER NOT NULL,
    win_rate NUMERIC(5,2) NOT NULL,
    difference NUMERIC(4,2) NOT NULL,
    streak_number INTEGER NOT NULL,
    streak_victory BOOLEAN NOT NULL,

    PRIMARY KEY(team_id, season_init_year)
);

CREATE TABLE players (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    height NUMERIC(3,2) NOT NULL,
    weight NUMERIC (5,2) NOT NULl,
    age INTEGER NOT NULL,
    draft INTEGER NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    country TEXT NOT NULL,
    jersey_number INTEGER NOT NULL,
    position VARCHAR(2) NOT NULL,
    image TEXT NOT NULL,

    UNIQUE(team_id, jersey_number)
);

CREATE TABLE player_season_stats (
    player_id INTEGER REFERENCES players(id),
    season_init_year INTEGER NOT NULL,
    points NUMERIC(5,2) NOT NULL,
    rebounds NUMERIC(4,2) NOT NULL,
    ofe_rebounds NUMERIC(4,2) NOT NULL,
    def_rebounds NUMERIC(4,2) NOT NULL,
    assists NUMERIC(4,2) NOT NULL,
    steals NUMERIC(3,2) NOT NULL,
    blocks NUMERIC(3,2) NOT NULL,
    turnovers NUMERIC(4,2) NOT NULL,
    plusminus NUMERIC(5,2) NOT NULL,
    fg_percentage NUMERIC(5,2) NOT NULL,
    three_percentage NUMERIC(5,2) NOT NULL,
    games_played INTEGER NOT NULL,

    PRIMARY KEY(player_id, season_init_year)
);

CREATE TABLE games (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id) NOT NULL,
    away_team_id INTEGER REFERENCES teams(id) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    finished BOOLEAN NOT NULL,
    home_score INTEGER,
    away_score INTEGER,

    UNiQUE(home_team_id, away_team_id, date),
    CHECK (home_team_id <> away_team_id)
);

CREATE TABLE player_game_stats (
    player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    team_id INTEGER NOT NULL REFERENCES teams(id), --por si un jugador es traspasado
    seconds_played INTEGER NOT NULL,
    points INTEGER NOT NULL,
    rebounds INTEGER NOT NULL,
    ofe_rebounds INTEGER NOT NULL,
    def_rebounds INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    steals INTEGER NOT NULL,
    blocks INTEGER NOT NULL,
    turnovers INTEGER NOT NULL,
    plusminus INTEGER NOT NULL,
    fg_percentage NUMERIC(5,2) NOT NULL,
    three_percentage NUMERIC(5,2) NOT NULL,
    fg_made INTEGER NOT NULL,
    fg_attempted INTEGER NOT NULL,

    PRIMARY KEY(player_id, game_id)
);

CREATE FUNCTION validate_player_game_team()
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

CREATE TRIGGER check_player_game_team
BEFORE INSERT OR UPDATE ON player_game_stats
FOR EACH ROW
EXECUTE FUNCTION validate_player_game_team();