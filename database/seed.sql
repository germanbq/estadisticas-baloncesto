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

INSERT INTO team_season_stats (
    team_id, season_init_year, victorys, losses,
    win_rate, difference, streak_number, streak_victory
)
VALUES
(1, 2025, 56, 26, 68.29, 7.70, 2, TRUE),      -- Boston Celtics
(2, 2025, 20, 62, 24.39, -10.00, 3, FALSE),   -- Brooklyn Nets
(3, 2025, 53, 29, 64.63, 6.40, 1, FALSE),     -- New York Knicks
(4, 2025, 45, 37, 54.88, -0.20, 2, TRUE),     -- Philadelphia 76ers
(5, 2025, 46, 36, 56.10, 2.80, 1, TRUE),      -- Toronto Raptors

(6, 2025, 31, 51, 37.80, -5.20, 2, FALSE),    -- Chicago Bulls
(7, 2025, 52, 30, 63.41, 4.10, 1, TRUE),      -- Cleveland Cavaliers
(8, 2025, 60, 22, 73.17, 8.20, 3, TRUE),      -- Detroit Pistons
(9, 2025, 19, 63, 23.17, -8.00, 2, FALSE),    -- Indiana Pacers
(10, 2025, 32, 50, 39.02, -6.20, 1, FALSE),   -- Milwaukee Bucks

(11, 2025, 46, 36, 56.10, 2.50, 1, FALSE),    -- Atlanta Hawks
(12, 2025, 44, 38, 53.66, 4.80, 1, TRUE),     -- Charlotte Hornets
(13, 2025, 43, 39, 52.44, 2.40, 2, TRUE),     -- Miami Heat
(14, 2025, 45, 37, 54.88, 0.60, 1, FALSE),    -- Orlando Magic
(15, 2025, 17, 65, 20.73, -12.00, 10, FALSE), -- Washington Wizards

(16, 2025, 54, 28, 65.85, 5.20, 12, TRUE),    -- Denver Nuggets
(17, 2025, 49, 33, 59.76, 3.40, 2, TRUE),     -- Minnesota Timberwolves
(18, 2025, 64, 18, 78.05, 11.10, 2, FALSE),   -- Oklahoma City Thunder
(19, 2025, 42, 40, 51.22, -0.30, 2, TRUE),    -- Portland Trail Blazers
(20, 2025, 22, 60, 26.83, -8.40, 1, FALSE),   -- Utah Jazz

(21, 2025, 37, 45, 45.12, -0.60, 3, FALSE),   -- Golden State Warriors
(22, 2025, 42, 40, 51.22, 1.20, 1, TRUE),     -- Los Angeles Clippers
(23, 2025, 53, 29, 64.63, 1.70, 3, TRUE),     -- Los Angeles Lakers
(24, 2025, 45, 37, 54.88, 1.50, 1, TRUE),     -- Phoenix Suns
(25, 2025, 22, 60, 26.83, -10.00, 1, FALSE),  -- Sacramento Kings

(26, 2025, 26, 56, 31.71, -5.50, 1, TRUE),    -- Dallas Mavericks
(27, 2025, 52, 30, 63.41, 5.20, 1, TRUE),     -- Houston Rockets
(28, 2025, 25, 57, 30.49, -6.00, 8, FALSE),   -- Memphis Grizzlies
(29, 2025, 26, 56, 31.71, -4.50, 2, FALSE),   -- New Orleans Pelicans
(30, 2025, 62, 20, 75.61, 8.30, 1, FALSE);    -- San Antonio Spurs


INSERT INTO players (
    name, height, weight, age, draft, team_id,
    country, jersey_number, position, image
)
VALUES
('LeBron James', 2.06, 113.00, 41, 2003, 23,
 'USA', 23, 'SF', '/LeBron_James.webp'),
('Kawhi Leonard', 1.98, 102.00, 34, 2011, 22,
 'USA', 2, 'SF', '/Kawhi_Leonard.webp'),
('Jayson Tatum', 2.03, 95.00, 28, 2017, 1,
 'USA', 0, 'SF', '/Jayson_Tatum.webp'),
('Nikola Jokic', 2.11, 129.00, 31, 2014, 16,
 'Serbia', 15, 'C', '/Nikola_Jokic.webp'),
('Stephen Curry', 1.88, 91.00, 38, 2009, 21,
 'USA', 30, 'PG', '/Stephen_Curry.webp'),
('Victor Wembanyama', 2.24, 107.00, 22, 2023, 30,
 'France', 1, 'C', '/Victor_Wembanyama.webp'),
('Jalen Brunson', 1.88, 86.00, 29, 2018, 3,
 'USA', 11, 'PG', '/Jalen_Brunson.webp'),
('Giannis Antetokounmpo', 2.11, 110.00, 31, 2013, 10,
 'Greece', 34, 'PF', '/Giannis_Antetokounmpo.webp'),
('Anthony Edwards', 1.93, 102.00, 24, 2020, 17,
 'USA', 5, 'SG', '/Anthony_Edwards.webp'),
('Kevin Durant', 2.11, 109.00, 37, 2007, 27,
 'USA', 7, 'SF', '/Kevin_Durant.webp');


INSERT INTO player_season_stats (
    player_id, season_init_year,
    points, rebounds, ofe_rebounds, def_rebounds,
    assists, steals, blocks, turnovers, plusminus,
    fg_percentage, three_percentage, games_played
)
VALUES
-- LeBron James
(1, 2025, 20.90, 6.10, 0.70, 5.40,
 7.20, 1.20, 0.60, 3.00, 2.00, 51.50, 31.70, 60),
-- Kawhi Leonard
(2, 2025, 27.90, 6.40, 1.10, 5.30,
 3.60, 1.90, 0.40, 2.00, 5.20, 50.50, 38.70, 65),
-- Jayson Tatum
(3, 2025, 21.80, 10.00, 0.50, 9.50,
 5.30, 1.40, 0.20, 2.40, 7.40, 41.10, 32.90, 16),
-- Nikola Jokic
(4, 2025, 27.70, 12.90, 3.00, 9.90,
 10.70, 1.40, 0.80, 3.70, 8.50, 56.90, 38.00, 65),
-- Stephen Curry
(5, 2025, 26.60, 3.60, 0.40, 3.20,
 4.70, 1.10, 0.40, 2.80, 2.10, 46.80, 39.30, 43),
-- Victor Wembanyama
(6, 2025, 25.00, 11.50, 2.00, 9.50,
 3.10, 1.00, 3.10, 2.40, 10.70, 51.20, 34.90, 64),
-- Jalen Brunson
(7, 2025, 26.00, 3.30, 0.40, 2.90,
 6.80, 0.80, 0.10, 2.40, 4.80, 46.70, 36.90, 74),
-- Giannis Antetokounmpo
(8, 2025, 27.60, 9.80, 2.70, 7.10,
 5.40, 0.90, 0.70, 3.20, 2.70, 62.40, 33.30, 36),
-- Anthony Edwards
(9, 2025, 28.80, 5.00, 0.60, 4.40,
 3.70, 1.40, 0.80, 2.90, 2.70, 48.90, 39.90, 61),
-- Kevin Durant
(10, 2025, 26.00, 5.50, 0.50, 4.90,
 4.80, 0.80, 0.90, 3.20, 4.40, 52.00, 41.30, 78);


INSERT INTO games (
    home_team_id, away_team_id, date,
    finished, home_score, away_score
)
VALUES
(1, 2, '2026-03-01 23:00:00+00', TRUE, 112, 105),
(3, 1, '2026-03-04 03:00:00+00', TRUE, 121, 115),
(1, 4, '2026-03-06 00:30:00+00', TRUE, 118, 102),
(5, 1, '2026-03-08 00:30:00+00', TRUE, 104, 110),
(1, 3, '2026-03-10 23:00:00+00', TRUE, 108, 114);

INSERT INTO player_game_stats (
    player_id, game_id, team_id, seconds_played,
    points, rebounds, ofe_rebounds, def_rebounds,
    assists, steals, blocks, turnovers, plusminus,
    fg_percentage, three_percentage, fg_made, fg_attempted
)
VALUES
(1, 1, 1, 2145,
 28, 8, 2, 6,
 5, 2, 1, 3, 9,
 50.00, 40.00, 10, 20),

(1, 2, 1, 2280,
 31, 7, 1, 6,
 6, 1, 0, 4, -6,
 50.00, 42.86, 11, 22),

(1, 3, 1, 1987,
 24, 10, 3, 7,
 4, 2, 2, 1, 16,
 50.00, 40.00, 9, 18),

(1, 4, 1, 2210,
 29, 9, 2, 7,
 7, 1, 1, 2, 8,
 52.38, 50.00, 11, 21),

(1, 5, 1, 2335,
 26, 6, 1, 5,
 5, 0, 1, 3, -7,
 45.00, 37.50, 9, 20);

COMMIT;