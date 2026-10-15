BEGIN;

INSERT INTO teams (
    name, short_name, logo, conference, division, stadium
)
VALUES
('Boston Celtics', 'BOS', '/logos/boston-celtics.webp', 'East', 'Atlantic', 'TD Garden'),
('Brooklyn Nets', 'BKN', '/logos/brooklyn-nets.webp', 'East', 'Atlantic', 'Barclays Center'),
('New York Knicks', 'NYK', '/logos/new-york-knicks.webp', 'East', 'Atlantic', 'Madison Square Garden'),
('Philadelphia 76ers', 'PHI', '/logos/philadelphia-76ers.webp', 'East', 'Atlantic', 'Xfinity Mobile Arena'),
('Toronto Raptors', 'TOR', '/logos/toronto-raptors.webp', 'East', 'Atlantic', 'Scotiabank Arena'),
('Chicago Bulls', 'CHI', '/logos/chicago-bulls.webp', 'East', 'Central', 'United Center'),
('Cleveland Cavaliers', 'CLE', '/logos/cleveland-cavaliers.webp', 'East', 'Central', 'Rocket Arena'),
('Detroit Pistons', 'DET', '/logos/detroit-pistons.webp', 'East', 'Central', 'Little Caesars Arena'),
('Indiana Pacers', 'IND', '/logos/indiana-pacers.webp', 'East', 'Central', 'Gainbridge Fieldhouse'),
('Milwaukee Bucks', 'MIL', '/logos/milwaukee-bucks.webp', 'East', 'Central', 'Fiserv Forum'),
('Atlanta Hawks', 'ATL', '/logos/atlanta-hawks.webp', 'East', 'Southeast', 'State Farm Arena'),
('Charlotte Hornets', 'CHA', '/logos/charlotte-hornets.webp', 'East', 'Southeast', 'Spectrum Center'),
('Miami Heat', 'MIA', '/logos/miami-heat.webp', 'East', 'Southeast', 'Kaseya Center'),
('Orlando Magic', 'ORL', '/logos/orlando-magic.webp', 'East', 'Southeast', 'Kia Center'),
('Washington Wizards', 'WAS', '/logos/washington-wizards.webp', 'East', 'Southeast', 'Capital One Arena'),
('Denver Nuggets', 'DEN', '/logos/denver-nuggets.webp', 'West', 'Northwest', 'Ball Arena'),
('Minnesota Timberwolves', 'MIN', '/logos/minnesota-timberwolves.webp', 'West', 'Northwest', 'Target Center'),
('Oklahoma City Thunder', 'OKC', '/logos/oklahoma-city-thunder.webp', 'West', 'Northwest', 'Paycom Center'),
('Portland Trail Blazers', 'POR', '/logos/portland-trail-blazers.webp', 'West', 'Northwest', 'Moda Center'),
('Utah Jazz', 'UTA', '/logos/utah-jazz.webp', 'West', 'Northwest', 'Delta Center'),
('Golden State Warriors', 'GSW', '/logos/golden-state-warriors.webp', 'West', 'Pacific', 'Chase Center'),
('Los Angeles Clippers', 'LAC', '/logos/los-angeles-clippers.webp', 'West', 'Pacific', 'Intuit Dome'),
('Los Angeles Lakers', 'LAL', '/logos/los-angeles-lakers.webp', 'West', 'Pacific', 'Crypto.com Arena'),
('Phoenix Suns', 'PHX', '/logos/phoenix-suns.webp', 'West', 'Pacific', 'Mortgage Matchup Center'),
('Sacramento Kings', 'SAC', '/logos/sacramento-kings.webp', 'West', 'Pacific', 'Golden 1 Center'),
('Dallas Mavericks', 'DAL', '/logos/dallas-mavericks.webp', 'West', 'Southwest', 'American Airlines Center'),
('Houston Rockets', 'HOU', '/logos/houston-rockets.webp', 'West', 'Southwest', 'Toyota Center'),
('Memphis Grizzlies', 'MEM', '/logos/memphis-grizzlies.webp', 'West', 'Southwest', 'FedExForum'),
('New Orleans Pelicans', 'NOP', '/logos/new-orleans-pelicans.webp', 'West', 'Southwest', 'Smoothie King Center'),
('San Antonio Spurs', 'SAS', '/logos/san-antonio-spurs.webp', 'West', 'Southwest', 'Frost Bank Center');

-- Los triggers acumulan las estadisticas al insertar los partidos.
INSERT INTO team_season_stats (
    team_id, season_init_year, victorys, losses, home_victory, home_losses,
    streak_number, streak_victory, total_points, total_points_allowed,
    total_possessions, total_opponent_possessions
)
SELECT t.id, season.season_init_year, 0, 0, 0, 0, 0, TRUE, 0, 0, 0, 0
FROM teams AS t
CROSS JOIN (VALUES (2025), (2026)) AS season(season_init_year);

INSERT INTO players (
    name, height, weight, age, draft, team_id,
    country, jersey_number, position, image
)
VALUES
('LeBron James', 2.06, 113.00, 41, 2003, 23,
 'USA', 23, 'SF', '/players/LeBron_James.webp'),
('Kawhi Leonard', 1.98, 102.00, 34, 2011, 22,
 'USA', 2, 'SF', '/players/Kawhi_Leonard.webp'),
('Jayson Tatum', 2.03, 95.00, 28, 2017, 1,
 'USA', 0, 'SF', '/players/Jayson_Tatum.webp'),
('Nikola Jokic', 2.11, 129.00, 31, 2014, 16,
 'Serbia', 15, 'C', '/players/Nikola_Jokic.webp'),
('Stephen Curry', 1.88, 91.00, 38, 2009, 21,
 'USA', 30, 'PG', '/players/Stephen_Curry.webp'),
('Victor Wembanyama', 2.24, 107.00, 22, 2023, 30,
 'France', 1, 'C', '/players/Victor_Wembanyama.webp'),
('Jalen Brunson', 1.88, 86.00, 29, 2018, 3,
 'USA', 11, 'PG', '/players/Jalen_Brunson.webp'),
('Giannis Antetokounmpo', 2.11, 110.00, 31, 2013, 10,
 'Greece', 34, 'PF', '/players/Giannis_Antetokounmpo.webp'),
('Anthony Edwards', 1.93, 102.00, 24, 2020, 17,
 'USA', 5, 'SG', '/players/Anthony_Edwards.webp'),
('Kevin Durant', 2.11, 109.00, 37, 2007, 27,
 'USA', 7, 'SF', '/players/Kevin_Durant.webp');


INSERT INTO player_season_stats (
    player_id, season_init_year, total_points, total_rebounds,
    total_ofe_rebounds, total_def_rebounds, total_assists, total_steals,
    total_blocks, total_turnovers, plusminus, total_fg_made,
    total_fg_attempted, total_three_made, total_three_attempted, games_played
)
SELECT p.id, season.season_init_year, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players AS p
CROSS JOIN (VALUES (2025), (2026)) AS season(season_init_year);

-- Posesiones ficticias de ejemplo: entre 93 y 109 por equipo, con ritmos variados
-- y una diferencia maxima de una posesion entre rivales en cada partido.
-- Puntos por cuarto ficticios; cada array suma el marcador final de su equipo.
INSERT INTO games (
    home_team_id, away_team_id, date,
    season_init_year, finished, home_score, away_score,
    home_period_scores, away_period_scores
)
VALUES
(23, 27, '2026-10-04 20:00:00+00', 2026, TRUE, 111, 103, ARRAY[24, 29, 26, 32]::SMALLINT[], ARRAY[22, 27, 24, 30]::SMALLINT[]),
(22, 17, '2026-10-05 20:00:00+00', 2026, TRUE, 127, 114, ARRAY[28, 33, 30, 36]::SMALLINT[], ARRAY[25, 30, 27, 32]::SMALLINT[]),
(1, 10, '2026-10-06 20:00:00+00', 2026, TRUE, 122, 118, ARRAY[27, 32, 29, 34]::SMALLINT[], ARRAY[26, 31, 28, 33]::SMALLINT[]),
(16, 3, '2026-10-07 20:00:00+00', 2026, TRUE, 103, 127, ARRAY[22, 27, 24, 30]::SMALLINT[], ARRAY[28, 33, 30, 36]::SMALLINT[]),
(21, 30, '2026-10-08 20:00:00+00', 2026, TRUE, 109, 112, ARRAY[24, 29, 26, 30]::SMALLINT[], ARRAY[25, 30, 27, 30]::SMALLINT[]),
(17, 23, '2026-10-09 20:00:00+00', 2026, TRUE, 107, 121, ARRAY[23, 28, 25, 31]::SMALLINT[], ARRAY[27, 32, 29, 33]::SMALLINT[]),
(10, 27, '2026-10-10 20:00:00+00', 2026, TRUE, 121, 126, ARRAY[27, 32, 29, 33]::SMALLINT[], ARRAY[28, 33, 30, 35]::SMALLINT[]),
(3, 22, '2026-10-11 20:00:00+00', 2026, TRUE, 105, 122, ARRAY[23, 28, 25, 29]::SMALLINT[], ARRAY[27, 32, 29, 34]::SMALLINT[]),
(30, 1, '2026-10-12 20:00:00+00', 2026, TRUE, 130, 119, ARRAY[29, 34, 31, 36]::SMALLINT[], ARRAY[26, 31, 28, 34]::SMALLINT[]),
(21, 16, '2026-10-13 20:00:00+00', 2026, TRUE, 118, 120, ARRAY[26, 31, 28, 33]::SMALLINT[], ARRAY[27, 32, 29, 32]::SMALLINT[]),
(23, 10, '2026-10-14 20:00:00+00', 2026, TRUE, 107, 126, ARRAY[23, 28, 25, 31]::SMALLINT[], ARRAY[28, 33, 30, 35]::SMALLINT[]),
(17, 3, '2026-10-15 20:00:00+00', 2026, TRUE, 128, 108, ARRAY[29, 34, 31, 34]::SMALLINT[], ARRAY[24, 29, 26, 29]::SMALLINT[]),
(27, 30, '2026-10-16 20:00:00+00', 2026, TRUE, 124, 120, ARRAY[28, 33, 30, 33]::SMALLINT[], ARRAY[27, 32, 29, 32]::SMALLINT[]),
(22, 21, '2026-10-17 20:00:00+00', 2026, TRUE, 129, 116, ARRAY[29, 34, 31, 35]::SMALLINT[], ARRAY[26, 31, 28, 31]::SMALLINT[]),
(1, 16, '2026-10-18 20:00:00+00', 2026, TRUE, 104, 107, ARRAY[23, 28, 25, 28]::SMALLINT[], ARRAY[23, 28, 25, 31]::SMALLINT[]),
(3, 23, '2026-10-19 20:00:00+00', 2026, TRUE, 109, 110, ARRAY[24, 29, 26, 30]::SMALLINT[], ARRAY[24, 29, 26, 31]::SMALLINT[]),
(30, 10, '2026-10-20 20:00:00+00', 2026, TRUE, 111, 108, ARRAY[24, 29, 26, 32]::SMALLINT[], ARRAY[24, 29, 26, 29]::SMALLINT[]),
(21, 17, '2026-10-21 20:00:00+00', 2026, TRUE, 112, 125, ARRAY[25, 30, 27, 30]::SMALLINT[], ARRAY[28, 33, 30, 34]::SMALLINT[]),
(16, 27, '2026-10-22 20:00:00+00', 2026, TRUE, 107, 113, ARRAY[23, 28, 25, 31]::SMALLINT[], ARRAY[25, 30, 27, 31]::SMALLINT[]),
(1, 22, '2026-10-23 20:00:00+00', 2026, TRUE, 131, 102, ARRAY[29, 34, 31, 37]::SMALLINT[], ARRAY[22, 27, 24, 29]::SMALLINT[]),
(23, 30, '2026-10-24 20:00:00+00', 2026, TRUE, 100, 127, ARRAY[22, 27, 24, 27]::SMALLINT[], ARRAY[28, 33, 30, 36]::SMALLINT[]),
(3, 21, '2026-10-25 20:00:00+00', 2026, TRUE, 121, 112, ARRAY[27, 32, 29, 33]::SMALLINT[], ARRAY[25, 30, 27, 30]::SMALLINT[]),
(10, 16, '2026-10-26 20:00:00+00', 2026, TRUE, 129, 124, ARRAY[29, 34, 31, 35]::SMALLINT[], ARRAY[28, 33, 30, 33]::SMALLINT[]),
(17, 1, '2026-10-27 20:00:00+00', 2026, TRUE, 125, 126, ARRAY[28, 33, 30, 34]::SMALLINT[], ARRAY[28, 33, 30, 35]::SMALLINT[]),
(27, 22, '2026-10-28 20:00:00+00', 2026, TRUE, 130, 126, ARRAY[29, 34, 31, 36]::SMALLINT[], ARRAY[28, 33, 30, 35]::SMALLINT[]),
(21, 23, '2026-10-29 20:00:00+00', 2026, TRUE, 106, 108, ARRAY[23, 28, 25, 30]::SMALLINT[], ARRAY[24, 29, 26, 29]::SMALLINT[]),
(16, 30, '2026-10-30 20:00:00+00', 2026, TRUE, 124, 109, ARRAY[28, 33, 30, 33]::SMALLINT[], ARRAY[24, 29, 26, 30]::SMALLINT[]),
(1, 3, '2026-10-31 20:00:00+00', 2026, TRUE, 114, 113, ARRAY[25, 30, 27, 32]::SMALLINT[], ARRAY[25, 30, 27, 31]::SMALLINT[]),
(22, 10, '2026-11-01 20:00:00+00', 2026, TRUE, 104, 120, ARRAY[23, 28, 25, 28]::SMALLINT[], ARRAY[27, 32, 29, 32]::SMALLINT[]),
(27, 17, '2026-11-02 20:00:00+00', 2026, TRUE, 102, 110, ARRAY[22, 27, 24, 29]::SMALLINT[], ARRAY[24, 29, 26, 31]::SMALLINT[]),
(23, 16, '2026-11-03 20:00:00+00', 2026, TRUE, 104, 105, ARRAY[23, 28, 25, 28]::SMALLINT[], ARRAY[23, 28, 25, 29]::SMALLINT[]),
(21, 1, '2026-11-04 20:00:00+00', 2026, TRUE, 105, 100, ARRAY[23, 28, 25, 29]::SMALLINT[], ARRAY[22, 27, 24, 27]::SMALLINT[]);

-- Estadisticas ficticias para ambos equipos de todos los partidos (IDs 1-32).
-- Los tiros anotados reproducen el marcador: puntos = 2 * fg_made + three_made + ft_made.
-- TS% y eFG% en escala 0-100, redondeados a dos decimales.
-- Ratings por 100 posesiones, redondeados a enteros.
INSERT INTO team_game_stats (
    team_id, game_id, possessions,
    fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted,
    paint_points, fastbreak_points, bench_points, second_chance_points,
    effective_field_goal_percentage, true_shooting_percentage,
    offensive_rating, defensive_rating,
    rebounds, assists, steals, tapones, turnovers, personal_fouls
)
VALUES
(23, 1, 97, 42, 84, 11, 29, 16, 20, 40, 10, 25, 10, 56.55, 59.81, 114, 106, 41, 23, 7, 4, 11, 18),
(27, 1, 97, 35, 86, 14, 33, 19, 24, 42, 12, 26, 12, 48.84, 53.33, 106, 114, 42, 24, 8, 5, 12, 19),
(22, 2, 98, 49, 85, 12, 31, 17, 22, 42, 12, 26, 12, 64.71, 67.07, 130, 116, 42, 24, 8, 5, 12, 19),
(17, 2, 98, 40, 87, 15, 35, 19, 25, 44, 14, 27, 14, 54.60, 58.16, 116, 130, 43, 25, 9, 6, 13, 20),
(1, 3, 99, 45, 86, 13, 33, 19, 25, 44, 14, 27, 14, 59.88, 62.89, 123, 119, 43, 25, 9, 6, 13, 20),
(10, 3, 99, 41, 88, 16, 37, 20, 27, 46, 16, 28, 16, 55.68, 59.07, 119, 123, 44, 26, 10, 7, 14, 21),
(16, 4, 100, 35, 87, 14, 35, 19, 26, 46, 16, 28, 16, 48.28, 52.32, 103, 127, 44, 26, 10, 7, 14, 21),
(3, 4, 100, 44, 89, 17, 39, 22, 25, 48, 18, 29, 8, 58.99, 63.50, 127, 103, 45, 27, 6, 3, 15, 22),
(21, 5, 101, 37, 88, 15, 37, 20, 23, 48, 18, 29, 8, 50.57, 55.54, 108, 111, 45, 27, 6, 3, 15, 22),
(30, 5, 101, 43, 90, 10, 33, 16, 20, 50, 20, 30, 10, 53.33, 56.68, 111, 108, 46, 28, 7, 4, 16, 23),
(17, 6, 102, 35, 89, 16, 39, 21, 25, 50, 20, 30, 10, 48.31, 53.50, 105, 119, 46, 28, 7, 4, 16, 23),
(23, 6, 102, 47, 91, 11, 28, 16, 21, 52, 8, 31, 12, 57.69, 60.36, 119, 105, 47, 29, 8, 5, 10, 17),
(10, 7, 103, 44, 90, 17, 34, 16, 21, 52, 8, 31, 12, 58.33, 60.96, 117, 122, 47, 29, 8, 5, 10, 17),
(27, 7, 103, 48, 92, 12, 30, 18, 24, 38, 10, 32, 14, 58.70, 61.43, 122, 117, 48, 30, 9, 6, 11, 18),
(3, 8, 104, 39, 91, 10, 28, 17, 23, 38, 10, 32, 14, 48.35, 51.92, 101, 117, 48, 30, 9, 6, 11, 18),
(22, 8, 104, 45, 93, 13, 32, 19, 26, 40, 12, 33, 16, 55.38, 58.41, 117, 101, 49, 31, 10, 7, 12, 19),
(30, 9, 105, 51, 92, 11, 30, 17, 24, 40, 12, 33, 16, 61.41, 63.38, 124, 113, 49, 31, 10, 7, 12, 19),
(1, 9, 105, 43, 83, 14, 34, 19, 22, 42, 14, 34, 8, 60.24, 64.20, 113, 124, 50, 22, 6, 3, 13, 20),
(21, 10, 106, 44, 93, 12, 32, 18, 21, 42, 14, 34, 8, 53.76, 57.71, 111, 113, 50, 22, 6, 3, 13, 20),
(16, 10, 106, 42, 84, 15, 36, 21, 25, 44, 16, 35, 10, 58.93, 63.16, 113, 111, 51, 23, 7, 4, 14, 21),
(23, 11, 107, 37, 83, 13, 34, 20, 24, 44, 16, 35, 10, 52.41, 57.18, 100, 118, 51, 23, 7, 4, 14, 21),
(10, 11, 107, 44, 85, 16, 38, 22, 27, 46, 18, 36, 12, 61.18, 65.03, 118, 100, 40, 24, 8, 5, 15, 22),
(17, 12, 96, 47, 84, 14, 36, 20, 25, 46, 18, 36, 12, 64.29, 67.37, 133, 113, 40, 24, 8, 5, 15, 22),
(3, 12, 96, 38, 86, 17, 40, 15, 21, 48, 20, 37, 14, 54.07, 56.70, 113, 133, 41, 25, 9, 6, 16, 23),
(27, 13, 97, 44, 85, 15, 38, 21, 27, 48, 20, 37, 14, 60.59, 64.00, 128, 124, 41, 25, 9, 6, 16, 23),
(30, 13, 97, 47, 87, 10, 27, 16, 23, 50, 8, 38, 16, 59.77, 61.78, 124, 128, 42, 26, 10, 7, 10, 17),
(22, 14, 98, 49, 86, 16, 33, 15, 22, 50, 8, 38, 16, 66.28, 67.41, 132, 118, 42, 26, 10, 7, 10, 17),
(21, 14, 98, 44, 88, 11, 29, 17, 20, 52, 10, 24, 8, 56.25, 59.92, 118, 132, 43, 27, 6, 3, 11, 18),
(1, 15, 99, 35, 87, 17, 35, 17, 20, 52, 10, 24, 8, 50.00, 54.28, 105, 108, 43, 27, 6, 3, 11, 18),
(16, 15, 99, 38, 89, 12, 31, 19, 23, 38, 12, 25, 10, 49.44, 53.97, 108, 105, 44, 28, 7, 4, 12, 19),
(3, 16, 100, 41, 90, 10, 27, 17, 21, 38, 12, 27, 10, 51.11, 54.92, 109, 110, 44, 28, 7, 4, 12, 19),
(23, 16, 100, 40, 91, 11, 28, 19, 23, 38, 12, 27, 10, 50.00, 54.39, 110, 109, 45, 29, 8, 5, 13, 20),
(30, 17, 101, 41, 91, 11, 29, 18, 22, 40, 14, 28, 12, 51.10, 55.13, 110, 107, 45, 29, 8, 5, 13, 20),
(10, 17, 101, 38, 92, 12, 30, 20, 24, 40, 14, 28, 12, 47.83, 52.65, 107, 110, 46, 30, 9, 6, 14, 21),
(21, 18, 102, 40, 92, 12, 31, 20, 24, 42, 16, 29, 14, 50.00, 54.60, 110, 123, 46, 30, 9, 6, 14, 21),
(17, 18, 102, 46, 93, 13, 32, 20, 24, 42, 16, 29, 14, 56.45, 60.35, 123, 110, 47, 31, 10, 7, 15, 22),
(16, 19, 103, 37, 93, 13, 33, 20, 24, 44, 18, 30, 16, 46.77, 51.66, 104, 110, 47, 31, 10, 7, 15, 22),
(27, 19, 103, 41, 84, 14, 34, 17, 21, 44, 18, 30, 16, 57.14, 60.60, 110, 104, 48, 22, 6, 3, 16, 23),
(1, 20, 104, 50, 84, 14, 30, 17, 21, 46, 20, 31, 8, 67.86, 70.25, 126, 98, 48, 22, 6, 3, 16, 23),
(22, 20, 104, 35, 85, 15, 31, 17, 21, 46, 20, 31, 8, 50.00, 54.12, 98, 126, 49, 23, 7, 4, 10, 17),
(23, 21, 105, 34, 85, 15, 32, 17, 21, 48, 8, 32, 10, 48.82, 53.06, 95, 121, 49, 23, 7, 4, 10, 17),
(30, 21, 105, 46, 86, 16, 33, 19, 23, 48, 8, 32, 10, 62.79, 66.06, 121, 95, 50, 24, 8, 5, 11, 18),
(3, 22, 106, 43, 86, 16, 34, 19, 23, 50, 10, 33, 12, 59.30, 62.94, 114, 106, 50, 24, 8, 5, 11, 18),
(21, 22, 106, 38, 87, 17, 35, 19, 23, 50, 10, 33, 12, 53.45, 57.66, 106, 114, 51, 25, 9, 6, 12, 19),
(10, 23, 107, 46, 87, 17, 36, 20, 24, 52, 12, 34, 14, 62.64, 66.11, 121, 116, 51, 25, 9, 6, 12, 19),
(16, 23, 107, 47, 88, 10, 29, 20, 24, 52, 12, 34, 14, 59.09, 62.91, 116, 121, 40, 26, 10, 7, 13, 20),
(17, 24, 96, 47, 88, 10, 30, 21, 25, 38, 14, 35, 16, 59.09, 63.13, 130, 131, 40, 26, 10, 7, 13, 20),
(1, 24, 96, 49, 89, 11, 31, 17, 21, 38, 14, 35, 16, 61.24, 64.13, 131, 130, 41, 27, 6, 3, 14, 21),
(27, 25, 97, 51, 89, 11, 27, 17, 21, 40, 16, 36, 8, 63.48, 66.16, 134, 130, 41, 27, 6, 3, 14, 21),
(22, 25, 97, 48, 90, 12, 28, 18, 22, 40, 16, 36, 8, 60.00, 63.20, 130, 134, 42, 28, 7, 4, 15, 22),
(21, 26, 98, 38, 90, 12, 29, 18, 22, 42, 18, 37, 10, 48.89, 53.17, 108, 110, 42, 28, 7, 4, 15, 22),
(23, 26, 98, 38, 91, 13, 30, 19, 23, 42, 18, 37, 10, 48.90, 53.40, 110, 108, 43, 29, 8, 5, 16, 23),
(16, 27, 99, 46, 91, 13, 31, 19, 23, 44, 20, 38, 12, 57.69, 61.31, 125, 110, 43, 29, 8, 5, 16, 23),
(30, 27, 99, 38, 92, 14, 32, 19, 23, 44, 20, 38, 12, 48.91, 53.37, 110, 125, 44, 30, 9, 6, 10, 17),
(1, 28, 100, 40, 92, 14, 33, 20, 24, 46, 8, 25, 14, 51.09, 55.58, 114, 113, 44, 30, 9, 6, 10, 17),
(3, 28, 100, 39, 93, 15, 34, 20, 24, 46, 8, 25, 14, 50.00, 54.56, 113, 114, 45, 31, 10, 7, 11, 18),
(22, 29, 101, 34, 93, 15, 35, 21, 25, 48, 10, 26, 16, 44.62, 50.00, 103, 119, 45, 31, 10, 7, 11, 18),
(10, 29, 101, 44, 84, 16, 36, 16, 20, 48, 10, 26, 16, 61.90, 64.66, 119, 103, 46, 22, 6, 3, 12, 19),
(27, 30, 102, 35, 84, 16, 32, 16, 20, 50, 12, 27, 8, 51.19, 54.96, 100, 108, 46, 22, 6, 3, 12, 19),
(17, 30, 102, 38, 85, 17, 33, 17, 21, 50, 12, 27, 8, 54.71, 58.36, 108, 100, 47, 23, 7, 4, 13, 20),
(23, 31, 103, 35, 85, 17, 34, 17, 21, 52, 14, 28, 10, 51.18, 55.18, 101, 102, 47, 23, 7, 4, 13, 20),
(16, 31, 103, 38, 86, 10, 27, 19, 23, 52, 14, 28, 10, 50.00, 54.62, 102, 101, 48, 24, 8, 5, 14, 21),
(21, 32, 104, 38, 86, 10, 28, 19, 23, 38, 16, 29, 12, 50.00, 54.62, 101, 96, 48, 24, 8, 5, 14, 21),
(1, 32, 104, 35, 87, 11, 29, 19, 23, 38, 16, 29, 12, 46.55, 51.48, 96, 101, 49, 25, 9, 6, 15, 22);

-- Triples reconstruidos a partir del porcentaje original con el minimo denominador compatible.
INSERT INTO player_game_stats (
    player_id, game_id, team_id, seconds_played,
    points, rebounds, ofe_rebounds, def_rebounds,
    assists, steals, blocks, turnovers, plusminus,
    fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted
)
VALUES
-- 2026-10-04: LeBron James
(1, 1, 23, 2168,
 32, 9, 1, 8,
 7, 1, 0, 2, 9,
 12, 20, 4, 5, 4, 6),

-- 2026-10-04: Kevin Durant
(10, 1, 27, 1875,
 27, 5, 1, 4,
 3, 1, 2, 4, -10,
 9, 17, 1, 2, 8, 10),

-- 2026-10-05: Kawhi Leonard
(2, 2, 22, 2135,
 23, 8, 2, 6,
 7, 0, 1, 1, 12,
 7, 21, 1, 2, 8, 9),

-- 2026-10-05: Anthony Edwards
(9, 2, 17, 1920,
 31, 4, 4, 0,
 7, 1, 2, 2, -12,
 13, 25, 2, 7, 3, 5),

-- 2026-10-06: Jayson Tatum
(3, 3, 1, 2125,
 36, 7, 0, 7,
 6, 2, 2, 5, 8,
 15, 23, 5, 8, 1, 1),

-- 2026-10-06: Giannis Antetokounmpo
(8, 3, 10, 2122,
 38, 12, 2, 10,
 8, 3, 1, 1, -6,
 13, 21, 1, 1, 11, 13),

-- 2026-10-07: Nikola Jokic
(4, 4, 16, 2148,
 35, 14, 4, 10,
 7, 2, 0, 3, -27,
 12, 24, 1, 1, 10, 12),

-- 2026-10-07: Jalen Brunson
(7, 4, 3, 2295,
 34, 6, 1, 5,
 9, 3, 1, 4, 29,
 13, 21, 1, 2, 7, 9),

-- 2026-10-08: Stephen Curry
(5, 5, 21, 2079,
 31, 6, 0, 6,
 6, 0, 2, 2, -5,
 12, 17, 4, 9, 3, 4),

-- 2026-10-08: Victor Wembanyama
(6, 5, 30, 2101,
 18, 10, 3, 7,
 3, 2, 2, 5, 0,
 8, 26, 1, 5, 1, 3),

-- 2026-10-09: Anthony Edwards
(9, 6, 17, 1905,
 34, 3, 1, 2,
 1, 3, 1, 3, -18,
 11, 16, 3, 8, 9, 9),

-- 2026-10-09: LeBron James
(1, 6, 23, 2269,
 37, 4, 2, 2,
 10, 3, 1, 4, 17,
 14, 20, 1, 2, 8, 9),

-- 2026-10-10: Giannis Antetokounmpo
(8, 7, 10, 1931,
 27, 9, 2, 7,
 4, 2, 0, 4, -7,
 13, 17, 0, 1, 1, 1),

-- 2026-10-10: Kevin Durant
(10, 7, 27, 1836,
 24, 6, 3, 3,
 4, 1, 1, 1, 2,
 9, 24, 5, 9, 1, 3),

-- 2026-10-11: Jalen Brunson
(7, 8, 3, 2030,
 24, 3, 0, 3,
 8, 3, 1, 3, -14,
 7, 21, 4, 7, 6, 6),

-- 2026-10-11: Kawhi Leonard
(2, 8, 22, 2302,
 25, 3, 3, 0,
 4, 1, 0, 1, 17,
 11, 23, 1, 4, 2, 3),

-- 2026-10-12: Victor Wembanyama
(6, 9, 30, 2054,
 35, 10, 0, 10,
 5, 0, 3, 5, 8,
 10, 16, 3, 4, 12, 12),

-- 2026-10-12: Jayson Tatum
(3, 9, 1, 1947,
 21, 6, 1, 5,
 2, 2, 1, 4, -15,
 9, 23, 1, 4, 2, 2),

-- 2026-10-13: Stephen Curry
(5, 10, 21, 2327,
 23, 2, 2, 0,
 4, 2, 2, 5, -3,
 8, 19, 2, 5, 5, 5),

-- 2026-10-13: Nikola Jokic
(4, 10, 16, 2070,
 39, 9, 4, 5,
 9, 0, 2, 5, 5,
 15, 26, 1, 4, 8, 10),

-- 2026-10-14: LeBron James
(1, 11, 23, 1849,
 35, 3, 3, 0,
 7, 2, 2, 3, -20,
 15, 19, 1, 2, 4, 4),

-- 2026-10-14: Giannis Antetokounmpo
(8, 11, 10, 2218,
 32, 8, 2, 6,
 7, 3, 0, 3, 17,
 13, 24, 0, 1, 6, 7),

-- 2026-10-15: Anthony Edwards
(9, 12, 17, 1895,
 29, 3, 0, 3,
 4, 2, 1, 2, 15,
 13, 26, 0, 1, 3, 3),

-- 2026-10-15: Jalen Brunson
(7, 12, 3, 2294,
 32, 3, 3, 0,
 8, 1, 2, 5, -22,
 12, 26, 1, 1, 7, 8),

-- 2026-10-16: Kevin Durant
(10, 13, 27, 1962,
 26, 4, 2, 2,
 6, 0, 1, 3, 9,
 10, 16, 1, 3, 5, 7),

-- 2026-10-16: Victor Wembanyama
(6, 13, 30, 2277,
 25, 9, 4, 5,
 5, 3, 3, 5, 1,
 9, 19, 2, 3, 5, 6),

-- 2026-10-17: Kawhi Leonard
(2, 14, 22, 2200,
 26, 3, 3, 0,
 1, 3, 0, 5, 15,
 9, 24, 2, 3, 6, 7),

-- 2026-10-17: Stephen Curry
(5, 14, 21, 2124,
 44, 5, 2, 3,
 8, 0, 1, 2, -16,
 15, 26, 6, 13, 8, 9),

-- 2026-10-18: Jayson Tatum
(3, 15, 1, 2297,
 29, 7, 1, 6,
 4, 3, 1, 3, -5,
 8, 16, 1, 1, 12, 12),

-- 2026-10-18: Nikola Jokic
(4, 15, 16, 2070,
 28, 15, 3, 12,
 12, 1, 2, 1, 3,
 10, 18, 2, 3, 6, 7),

-- 2026-10-19: Jalen Brunson
(7, 16, 3, 2090,
 44, 4, 1, 3,
 8, 2, 2, 4, -4,
 15, 24, 7, 9, 7, 9),

-- 2026-10-19: LeBron James
(1, 16, 23, 1999,
 24, 4, 3, 1,
 8, 0, 0, 1, 5,
 8, 24, 1, 2, 7, 9),

-- 2026-10-20: Victor Wembanyama
(6, 17, 30, 2240,
 33, 12, 1, 11,
 6, 2, 5, 3, 8,
 9, 24, 8, 9, 7, 9),

-- 2026-10-20: Giannis Antetokounmpo
(8, 17, 10, 1914,
 27, 9, 2, 7,
 8, 3, 2, 5, -3,
 11, 21, 1, 2, 4, 5),

-- 2026-10-21: Stephen Curry
(5, 18, 21, 2333,
 40, 6, 2, 4,
 4, 3, 0, 1, -13,
 13, 17, 7, 11, 7, 9),

-- 2026-10-21: Anthony Edwards
(9, 18, 17, 2081,
 41, 7, 2, 5,
 1, 3, 1, 5, 16,
 15, 18, 2, 3, 9, 9),

-- 2026-10-22: Nikola Jokic
(4, 19, 16, 2225,
 38, 11, 4, 7,
 12, 0, 0, 5, -11,
 12, 24, 6, 7, 8, 10),

-- 2026-10-22: Kevin Durant
(10, 19, 27, 2254,
 28, 6, 0, 6,
 6, 2, 2, 1, 4,
 9, 23, 3, 4, 7, 9),

-- 2026-10-23: Jayson Tatum
(3, 20, 1, 1928,
 22, 6, 1, 5,
 2, 3, 2, 4, 25,
 7, 21, 1, 9, 7, 9),

-- 2026-10-23: Kawhi Leonard
(2, 20, 22, 2138,
 30, 9, 1, 8,
 6, 1, 2, 5, -28,
 11, 22, 7, 9, 1, 2),

-- 2026-10-24: LeBron James
(1, 21, 23, 1833,
 37, 5, 2, 3,
 8, 0, 0, 1, -24,
 14, 18, 1, 2, 8, 9),

-- 2026-10-24: Victor Wembanyama
(6, 21, 30, 2268,
 26, 9, 1, 8,
 6, 3, 2, 4, 31,
 12, 19, 0, 1, 2, 2),

-- 2026-10-25: Jalen Brunson
(7, 22, 3, 2213,
 34, 1, 1, 0,
 8, 1, 2, 4, 8,
 9, 24, 1, 1, 15, 17),

-- 2026-10-25: Stephen Curry
(5, 22, 21, 2189,
 30, 4, 3, 1,
 8, 1, 0, 1, -7,
 12, 23, 4, 9, 2, 2),

-- 2026-10-26: Giannis Antetokounmpo
(8, 23, 10, 1949,
 29, 10, 0, 10,
 4, 3, 2, 3, 0,
 13, 24, 0, 1, 3, 4),

-- 2026-10-26: Nikola Jokic
(4, 23, 16, 2238,
 43, 12, 0, 12,
 9, 2, 0, 5, -9,
 15, 24, 2, 3, 11, 11),

-- 2026-10-27: Anthony Edwards
(9, 24, 17, 1845,
 33, 4, 3, 1,
 6, 0, 0, 4, -1,
 14, 22, 1, 1, 4, 4),

-- 2026-10-27: Jayson Tatum
(3, 24, 1, 1958,
 24, 10, 3, 7,
 7, 2, 2, 5, 2,
 8, 19, 0, 1, 8, 8),

-- 2026-10-28: Kevin Durant
(10, 25, 27, 1938,
 33, 6, 2, 4,
 4, 3, 2, 5, 0,
 15, 23, 0, 1, 3, 5),

-- 2026-10-28: Kawhi Leonard
(2, 25, 22, 1910,
 26, 7, 4, 3,
 4, 1, 0, 4, 0,
 11, 16, 1, 4, 3, 3),

-- 2026-10-29: Stephen Curry
(5, 26, 21, 2181,
 35, 2, 0, 2,
 5, 2, 2, 2, -5,
 9, 23, 3, 4, 14, 15),

-- 2026-10-29: LeBron James
(1, 26, 23, 2189,
 27, 5, 2, 3,
 8, 1, 0, 2, -3,
 9, 25, 4, 7, 5, 5),

-- 2026-10-30: Nikola Jokic
(4, 27, 16, 2112,
 31, 15, 1, 14,
 9, 0, 1, 3, 18,
 13, 25, 4, 7, 1, 2),

-- 2026-10-30: Victor Wembanyama
(6, 27, 30, 2137,
 20, 14, 4, 10,
 4, 1, 2, 2, -15,
 9, 26, 0, 1, 2, 2),

-- 2026-10-31: Jayson Tatum
(3, 28, 1, 2052,
 22, 8, 1, 7,
 6, 2, 1, 5, 1,
 8, 26, 1, 1, 5, 6),

-- 2026-10-31: Jalen Brunson
(7, 28, 3, 2153,
 36, 5, 0, 5,
 6, 3, 1, 3, 0,
 15, 23, 1, 1, 5, 7),

-- 2026-11-01: Kawhi Leonard
(2, 29, 22, 1837,
 32, 6, 3, 3,
 3, 2, 0, 2, -19,
 12, 22, 1, 5, 7, 8),

-- 2026-11-01: Giannis Antetokounmpo
(8, 29, 10, 1974,
 35, 9, 2, 7,
 4, 3, 0, 1, 15,
 13, 26, 1, 1, 8, 9),

-- 2026-11-02: Kevin Durant
(10, 30, 27, 1930,
 25, 7, 0, 7,
 7, 2, 1, 5, -6,
 6, 16, 1, 1, 12, 13),

-- 2026-11-02: Anthony Edwards
(9, 30, 17, 2116,
 44, 4, 2, 2,
 5, 1, 2, 4, 11,
 14, 24, 1, 1, 15, 15),

-- 2026-11-03: LeBron James
(1, 31, 23, 2229,
 43, 3, 3, 0,
 9, 1, 1, 4, -4,
 14, 17, 3, 4, 12, 14),

-- 2026-11-03: Nikola Jokic
(4, 31, 16, 2107,
 31, 13, 2, 11,
 9, 2, 2, 4, -1,
 14, 17, 2, 3, 1, 3),

-- 2026-11-04: Stephen Curry
(5, 32, 21, 2266,
 38, 5, 1, 4,
 4, 0, 2, 2, 5,
 11, 23, 7, 12, 9, 10),

-- 2026-11-04: Jayson Tatum
(3, 32, 1, 2207,
 22, 10, 0, 10,
 4, 3, 2, 1, -7,
 9, 20, 2, 5, 2, 4);
COMMIT;
