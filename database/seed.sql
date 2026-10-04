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


-- 2026-10-26: Nikola Jokic
(4, 23, 16, 2238,
 43, 12, 0, 12,
 9, 2, 0, 5, -9,
 62.50, 66.67, 15, 24),

-- 2026-10-27: Anthony Edwards
(9, 24, 17, 1845,
 33, 4, 3, 1,
 6, 0, 0, 4, -1,
 63.64, 100.00, 14, 22),

-- 2026-10-27: Jayson Tatum
(3, 24, 1, 1958,
 24, 10, 3, 7,
 7, 2, 2, 5, 2,
 42.11, 0.00, 8, 19),

-- 2026-10-28: Kevin Durant
(10, 25, 27, 1938,
 33, 6, 2, 4,
 4, 3, 2, 5, 0,
 65.22, 0.00, 15, 23),

-- 2026-10-28: Kawhi Leonard
(2, 25, 22, 1910,
 26, 7, 4, 3,
 4, 1, 0, 4, 0,
 68.75, 25.00, 11, 16),

-- 2026-10-29: Stephen Curry
(5, 26, 21, 2181,
 35, 2, 0, 2,
 5, 2, 2, 2, -5,
 39.13, 75.00, 9, 23),

-- 2026-10-29: LeBron James
(1, 26, 23, 2189,
 27, 5, 2, 3,
 8, 1, 0, 2, -3,
 36.00, 57.14, 9, 25),

-- 2026-10-30: Nikola Jokic
(4, 27, 16, 2112,
 31, 15, 1, 14,
 9, 0, 1, 3, 18,
 52.00, 57.14, 13, 25),

-- 2026-10-30: Victor Wembanyama
(6, 27, 30, 2137,
 20, 14, 4, 10,
 4, 1, 2, 2, -15,
 34.62, 0.00, 9, 26),

-- 2026-10-31: Jayson Tatum
(3, 28, 1, 2052,
 22, 8, 1, 7,
 6, 2, 1, 5, 1,
 30.77, 100.00, 8, 26),

-- 2026-10-31: Jalen Brunson
(7, 28, 3, 2153,
 36, 5, 0, 5,
 6, 3, 1, 3, 0,
 65.22, 100.00, 15, 23),

-- 2026-11-01: Kawhi Leonard
(2, 29, 22, 1837,
 32, 6, 3, 3,
 3, 2, 0, 2, -19,
 54.55, 20.00, 12, 22),

-- 2026-11-01: Giannis Antetokounmpo
(8, 29, 10, 1974,
 35, 9, 2, 7,
 4, 3, 0, 1, 15,
 50.00, 100.00, 13, 26),

-- 2026-11-02: Kevin Durant
(10, 30, 27, 1930,
 25, 7, 0, 7,
 7, 2, 1, 5, -6,
 37.50, 100.00, 6, 16),

-- 2026-11-02: Anthony Edwards
(9, 30, 17, 2116,
 44, 4, 2, 2,
 5, 1, 2, 4, 11,
 58.33, 100.00, 14, 24),

-- 2026-11-03: LeBron James
(1, 31, 23, 2229,
 43, 3, 3, 0,
 9, 1, 1, 4, -4,
 82.35, 75.00, 14, 17),

-- 2026-11-03: Nikola Jokic
(4, 31, 16, 2107,
 31, 13, 2, 11,
 9, 2, 2, 4, -1,
 82.35, 66.67, 14, 17),

-- 2026-11-04: Stephen Curry
(5, 32, 21, 2266,
 38, 5, 1, 4,
 4, 0, 2, 2, 5,
 47.83, 58.33, 11, 23),

-- 2026-11-04: Jayson Tatum
(3, 32, 1, 2207,
 22, 10, 0, 10,
 4, 3, 2, 1, -7,
 45.00, 40.00, 9, 20);
COMMIT;