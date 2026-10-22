INSERT INTO teams (name, short_name, logo, conference, division, stadium, coach)
OVERRIDING SYSTEM VALUE
VALUES
    ('Boston Celtics', 'BOS', '/logos/boston-celtics.webp', 'East', 'Atlantic', 'TD Garden', 'Joe Mazzulla'),
    ('Denver Nuggets', 'DEN', '/logos/denver-nuggets.webp', 'West', 'Northwest', 'Ball Arena', 'David Adelman'),
    ('Philadelphia 76ers', 'PHI', '/logos/philadelphia-76ers.webp', 'East', 'Atlantic', 'Xfinity Mobile Arena', 'Nick Nurse');

INSERT INTO games (home_team_id, away_team_id, date, season_init_year, finished, home_score, away_score, home_period_scores, away_period_scores)
VALUES
    (1, 2, '2026-10-18 07:59:59.999+00', 2026, TRUE, 104, 107, ARRAY[23, 28, 25, 28]::SMALLINT[], ARRAY[23, 28, 25, 31]::SMALLINT[]),
    (1, 2, '2026-10-18 08:00:00+00', 2026, TRUE, 112, 100, ARRAY[28, 27, 30, 27]::SMALLINT[], ARRAY[25, 24, 26, 25]::SMALLINT[]),
    (1, 2, '2026-10-19 07:59:59.999+00', 2026, FALSE, NULL, NULL, NULL, NULL),
    (1, 2, '2026-10-19 08:00:00+00', 2026, FALSE, NULL, NULL, NULL, NULL),
    (1, 2, '2026-10-14 20:00:00+00', 2026, TRUE, 108, 102, ARRAY[27, 26, 28, 27]::SMALLINT[], ARRAY[25, 26, 24, 27]::SMALLINT[]),
    (1, 2, '2026-10-11 20:00:00+00', 2026, TRUE, 99, 105, ARRAY[24, 25, 26, 24]::SMALLINT[], ARRAY[26, 27, 25, 27]::SMALLINT[]),
    (1, 2, '2026-10-15 20:00:00+00', 2026, TRUE, 116, 110, ARRAY[29, 28, 30, 29]::SMALLINT[], ARRAY[27, 28, 26, 29]::SMALLINT[]),
    (1, 2, '2026-10-13 20:00:00+00', 2026, TRUE, 101, 109, ARRAY[25, 24, 27, 25]::SMALLINT[], ARRAY[27, 28, 26, 28]::SMALLINT[]),
    (1, 2, '2025-10-18 20:00:00+00', 2025, TRUE, 110, 106, ARRAY[28, 27, 26, 29]::SMALLINT[], ARRAY[26, 25, 28, 27]::SMALLINT[]);

INSERT INTO players (name, height, weight, age, draft, team_id, country, jersey_number, position, image)
VALUES
    ('Jayson Tatum', 2.03, 95.00, 28, 2017, 1, 'USA', 0, 'SF', '/players/Jayson_Tatum.webp'),
    ('Nikola Jokic', 2.11, 129.00, 31, 2014, 2, 'Serbia', 15, 'C', '/players/Nikola_Jokic.webp'),
    ('Jamal Murray', 1.93, 98.00, 29, 2016, 2, 'Canada', 27, 'PG', '/players/Jamal_Murray.webp');

INSERT INTO player_game_stats (player_id, game_id, team_id, seconds_played, points, rebounds, ofe_rebounds, def_rebounds, assists, steals, blocks, turnovers, plusminus, fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted)
VALUES
    (1, 1, 1, 2160, 30, 8, 2, 6, 5, 2, 1, 3, -3, 10, 20, 4, 9, 6, 7),
    (2, 1, 2, 2280, 28, 12, 3, 9, 10, 1, 2, 4, 3, 11, 18, 2, 4, 4, 5),
    (2, 2, 2, 2100, 21, 9, 2, 7, 7, 2, 1, 3, -12, 8, 16, 1, 3, 4, 4),
    (3, 1, 2, 2160, 32, 4, 1, 3, 6, 2, 0, 2, 3, 12, 22, 4, 8, 4, 5),
    (3, 2, 2, 2040, 25, 5, 1, 4, 7, 1, 1, 2, -12, 9, 19, 3, 7, 4, 4),
    (2, 9, 2, 2400, 50, 20, 5, 15, 15, 5, 4, 2, -4, 20, 30, 4, 8, 6, 7);
