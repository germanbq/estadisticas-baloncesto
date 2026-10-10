DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_season_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS player_season_stats CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS player_game_stats CASCADE;
DROP TABLE IF EXISTS favorite_games CASCADE;
DROP TABLE IF EXISTS favorite_players CASCADE;
DROP TABLE IF EXISTS favorite_teams CASCADE;
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
    season_init_year INTEGER NOT NULL CHECK (season_init_year > 0),
    victorys INTEGER NOT NULL DEFAULT 0 CHECK (victorys >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    home_victory INTEGER NOT NULL DEFAULT 0 CHECK (home_victory >= 0),
    home_losses INTEGER NOT NULL DEFAULT 0 CHECK (home_losses >= 0),
    streak_number INTEGER NOT NULL DEFAULT 0 CHECK (streak_number >= 0),
    streak_victory BOOLEAN NOT NULL DEFAULT TRUE,
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    total_points_allowed INTEGER NOT NULL DEFAULT 0 CHECK (total_points_allowed >= 0),
    total_possessions INTEGER NOT NULL DEFAULT 0 CHECK (total_possessions >= 0),
    total_opponent_possessions INTEGER NOT NULL DEFAULT 0 CHECK (total_opponent_possessions >= 0),

    PRIMARY KEY(team_id, season_init_year)
);

CREATE TABLE players (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    height NUMERIC(3,2) NOT NULL CHECK (height > 0),
    weight NUMERIC (5,2) NOT NULL CHECK (weight > 0),
    age INTEGER NOT NULL CHECK (age > 0),
    draft INTEGER NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    country TEXT NOT NULL,
    jersey_number INTEGER NOT NULL CHECK (jersey_number >= 0),
    position VARCHAR(2) NOT NULL,
    image TEXT NOT NULL,

    UNIQUE(team_id, jersey_number)
);

CREATE TABLE player_season_stats (
    player_id INTEGER REFERENCES players(id),
    season_init_year INTEGER NOT NULL CHECK (season_init_year > 0),
    total_points INTEGER NOT NULL CHECK (total_points >= 0),
    total_rebounds INTEGER NOT NULL CHECK (total_rebounds >= 0),
    total_ofe_rebounds INTEGER NOT NULL CHECK (total_ofe_rebounds >= 0),
    total_def_rebounds INTEGER NOT NULL CHECK (total_def_rebounds >= 0),
    total_assists INTEGER NOT NULL CHECK (total_assists >= 0),
    total_steals INTEGER NOT NULL CHECK (total_steals >= 0),
    total_blocks INTEGER NOT NULL CHECK (total_blocks >= 0),
    total_turnovers INTEGER NOT NULL CHECK (total_turnovers >= 0),
    plusminus INTEGER NOT NULL,
    total_fg_made INTEGER NOT NULL CHECK (total_fg_made >= 0),
    total_fg_attempted INTEGER NOT NULL CHECK (total_fg_attempted >= 0),
    total_three_made INTEGER NOT NULL CHECK (total_three_made >= 0),
    total_three_attempted INTEGER NOT NUll CHECK (total_three_attempted >= 0),
    games_played INTEGER NOT NULL CHECK (games_played >= 0),

    PRIMARY KEY(player_id, season_init_year),

    CHECK (total_rebounds = total_ofe_rebounds + total_def_rebounds),
    CHECK (total_fg_attempted >= total_fg_made),
    CHECK (total_three_attempted >= total_three_made AND total_three_attempted <= total_fg_attempted),
    CHECK (total_three_made <= total_fg_made)
);

CREATE TABLE games (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id) NOT NULL,
    away_team_id INTEGER REFERENCES teams(id) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    season_init_year INTEGER NOT NULL CHECK (season_init_year > 0),
    finished BOOLEAN NOT NULL,
    home_score INTEGER CHECK (home_score >= 0),
    away_score INTEGER CHECK (away_score >= 0),
    home_possessions INTEGER CHECK (home_possessions >= 0),
    away_possessions INTEGER CHECK (away_possessions >= 0),

    UNiQUE(home_team_id, away_team_id, date),
    CONSTRAINT games_different_teams_id CHECK 
        (home_team_id <> away_team_id),
    CONSTRAINT games_finished_stats_check CHECK (
        NOT finished OR (
            home_score IS NOT NULL
            AND away_score IS NOT NULL
            AND home_score >= 0
            AND away_score >= 0
            AND home_score <> away_score
            AND home_possessions IS NOT NULL
            AND away_possessions IS NOT NULL
            AND home_possessions > 0
            AND away_possessions > 0
        )
    )
);

CREATE TABLE player_game_stats (
    player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    team_id INTEGER NOT NULL REFERENCES teams(id), --por si un jugador es traspasado
    seconds_played INTEGER NOT NULL CHECK (seconds_played >= 0),
    points INTEGER NOT NULL CHECK (points >= 0),
    rebounds INTEGER NOT NULL CHECK (rebounds >= 0),
    ofe_rebounds INTEGER NOT NULL CHECK (ofe_rebounds >= 0),
    def_rebounds INTEGER NOT NULL CHECK (def_rebounds >= 0),
    assists INTEGER NOT NULL CHECK (assists >= 0),
    steals INTEGER NOT NULL CHECK (steals >= 0),
    blocks INTEGER NOT NULL CHECK (blocks >= 0),
    turnovers INTEGER NOT NULL CHECK (turnovers >= 0),
    plusminus INTEGER NOT NULL,
    fg_made INTEGER NOT NULL CHECK (fg_made >= 0),
    fg_attempted INTEGER NOT NULL CHECK (fg_attempted >= 0),
    three_made INTEGER NOT NULL CHECK (three_made >= 0),
    three_attempted INTEGER NOT NULL CHECK (three_attempted >= 0),

    PRIMARY KEY(player_id, game_id),

    CHECK (rebounds = ofe_rebounds + def_rebounds),
    CHECK (fg_attempted >= fg_made),
    CHECK (three_attempted >= three_made AND three_attempted <= fg_attempted),
    CHECK (three_made <= fg_made)

);

CREATE TABLE favorite_players (
    user_id TEXT,
    player_id INTEGER REFERENCES players(id),

    PRIMARY KEY(user_id, player_id)
);

CREATE TABLE favorite_teams (
    user_id TEXT,
    team_id INTEGER REFERENCES teams(id),

    PRIMARY KEY(user_id, team_id)
);

CREATE TABLE favorite_games (
    user_id TEXT,
    game_id INTEGER REFERENCES games(id),

    PRIMARY KEY(user_id, game_id)
);
