DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_season_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS player_season_stats CASCADE;
DROP TABLE IF EXISTS games CASCADE;

CREATE TABLE teams (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo TEXT NOT NULL,
    conference TEXT NOT NULL,
    divison TEXT NOT NULL
);

CREATE TABLE team_season_stats (
    team_id INTEGER REFERENCES teams(id),
    season TEXT NOT NULL,
    victorys INTEGER NOT NULL,
    loses INTEGER NOT NULL,
    win_rate NUMERIC(5,2) NOT NULL,
    difference NUMERIC(4,2) NOT NULL,
    streak_number INTEGER NOT NULL,
    streak_victory BOOLEAN NOT NULL,

    PRIMARY KEY(team_id, season)
);

CREATE TABLE players (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    height NUMERIC(3,2) NOT NULL,
    weight NUMERIC (5,2) NOT NULl,
    age INTEGER NOT NULL,
    draft INTEGER NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    country TEXT NOT NULL,
    jersey_number INTEGER NOT NULL,
    position VARCHAR(2) NOT NULL,
    image TEXT NOT NULL
);

CREATE TABLE player_season_stats (
    player_id INTEGER REFERENCES players(id),
    season TEXT NOT NULL,
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
    fg_made INTEGER NOT NULL,
    fg_attempted INTEGER NOT NULL,
    games_played INTEGER NOT NULL,

    PRIMARY KEY(player_id, season)
);

CREATE TABLE games (
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    date TIMESTAMPTZ NOT NULL,
    finished BOOLEAN NOT NULL,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    place TEXT NOT NULL,

    PRIMARY KEY(home_team_id, away_team_id, date)
);