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

INSERT INTO games (
    home_team_id, away_team_id, date,
    finished, home_score, away_score
)
VALUES
(23, 27, '2026-10-04 20:00:00+00', TRUE, 111, 103),
(22, 17, '2026-10-05 20:00:00+00', TRUE, 127, 114),
(1, 10, '2026-10-06 20:00:00+00', TRUE, 122, 118),
(16, 3, '2026-10-07 20:00:00+00', TRUE, 103, 127),
(21, 30, '2026-10-08 20:00:00+00', TRUE, 109, 112),
(17, 23, '2026-10-09 20:00:00+00', TRUE, 107, 121),
(10, 27, '2026-10-10 20:00:00+00', TRUE, 121, 126),
(3, 22, '2026-10-11 20:00:00+00', TRUE, 105, 122),
(30, 1, '2026-10-12 20:00:00+00', TRUE, 130, 119),
(21, 16, '2026-10-13 20:00:00+00', TRUE, 118, 120),
(23, 10, '2026-10-14 20:00:00+00', TRUE, 107, 126),
(17, 3, '2026-10-15 20:00:00+00', TRUE, 128, 108),
(27, 30, '2026-10-16 20:00:00+00', TRUE, 124, 120),
(22, 21, '2026-10-17 20:00:00+00', TRUE, 129, 116),
(1, 16, '2026-10-18 20:00:00+00', TRUE, 104, 107),
(3, 23, '2026-10-19 20:00:00+00', TRUE, 109, 110),
(30, 10, '2026-10-20 20:00:00+00', TRUE, 111, 108),
(21, 17, '2026-10-21 20:00:00+00', TRUE, 112, 125),
(16, 27, '2026-10-22 20:00:00+00', TRUE, 107, 113),
(1, 22, '2026-10-23 20:00:00+00', TRUE, 131, 102),
(23, 30, '2026-10-24 20:00:00+00', TRUE, 100, 127),
(3, 21, '2026-10-25 20:00:00+00', TRUE, 121, 112),
(10, 16, '2026-10-26 20:00:00+00', TRUE, 129, 124),
(17, 1, '2026-10-27 20:00:00+00', TRUE, 125, 126),
(27, 22, '2026-10-28 20:00:00+00', TRUE, 130, 126),
(21, 23, '2026-10-29 20:00:00+00', TRUE, 106, 108),
(16, 30, '2026-10-30 20:00:00+00', TRUE, 124, 109),
(1, 3, '2026-10-31 20:00:00+00', TRUE, 114, 113),
(22, 10, '2026-11-01 20:00:00+00', TRUE, 104, 120),
(27, 17, '2026-11-02 20:00:00+00', TRUE, 102, 110),
(23, 16, '2026-11-03 20:00:00+00', TRUE, 104, 105),
(21, 1, '2026-11-04 20:00:00+00', TRUE, 105, 100);

INSERT INTO player_game_stats (
    player_id, game_id, team_id, seconds_played,
    points, rebounds, ofe_rebounds, def_rebounds,
    assists, steals, blocks, turnovers, plusminus,
    fg_percentage, three_percentage, fg_made, fg_attempted
)
VALUES
-- 2026-10-04: LeBron James
(1, 1, 23, 2168,
 32, 9, 1, 8,
 7, 1, 0, 2, 9,
 60.00, 80.00, 12, 20),

-- 2026-10-04: Kevin Durant
(10, 1, 27, 1875,
 27, 5, 1, 4,
 3, 1, 2, 4, -10,
 52.94, 50.00, 9, 17),

-- 2026-10-05: Kawhi Leonard
(2, 2, 22, 2135,
 23, 8, 2, 6,
 7, 0, 1, 1, 12,
 33.33, 50.00, 7, 21),

-- 2026-10-05: Anthony Edwards
(9, 2, 17, 1920,
 31, 4, 4, 0,
 7, 1, 2, 2, -12,
 52.00, 28.57, 13, 25),

-- 2026-10-06: Jayson Tatum
(3, 3, 1, 2125,
 36, 7, 0, 7,
 6, 2, 2, 5, 8,
 65.22, 62.50, 15, 23),

-- 2026-10-06: Giannis Antetokounmpo
(8, 3, 10, 2122,
 38, 12, 2, 10,
 8, 3, 1, 1, -6,
 61.90, 100.00, 13, 21),

-- 2026-10-07: Nikola Jokic
(4, 4, 16, 2148,
 35, 14, 4, 10,
 7, 2, 0, 3, -27,
 50.00, 100.00, 12, 24),

-- 2026-10-07: Jalen Brunson
(7, 4, 3, 2295,
 34, 6, 1, 5,
 9, 3, 1, 4, 29,
 61.90, 50.00, 13, 21),

-- 2026-10-08: Stephen Curry
(5, 5, 21, 2079,
 31, 6, 0, 6,
 6, 0, 2, 2, -5,
 70.59, 44.44, 12, 17),

-- 2026-10-08: Victor Wembanyama
(6, 5, 30, 2101,
 18, 10, 3, 7,
 3, 2, 2, 5, 0,
 30.77, 20.00, 8, 26),

-- 2026-10-09: Anthony Edwards
(9, 6, 17, 1905,
 34, 3, 1, 2,
 1, 3, 1, 3, -18,
 68.75, 37.50, 11, 16),

-- 2026-10-09: LeBron James
(1, 6, 23, 2269,
 37, 4, 2, 2,
 10, 3, 1, 4, 17,
 70.00, 50.00, 14, 20),

-- 2026-10-10: Giannis Antetokounmpo
(8, 7, 10, 1931,
 27, 9, 2, 7,
 4, 2, 0, 4, -7,
 76.47, 0.00, 13, 17),

-- 2026-10-10: Kevin Durant
(10, 7, 27, 1836,
 24, 6, 3, 3,
 4, 1, 1, 1, 2,
 37.50, 55.56, 9, 24),

-- 2026-10-11: Jalen Brunson
(7, 8, 3, 2030,
 24, 3, 0, 3,
 8, 3, 1, 3, -14,
 33.33, 57.14, 7, 21),

-- 2026-10-11: Kawhi Leonard
(2, 8, 22, 2302,
 25, 3, 3, 0,
 4, 1, 0, 1, 17,
 47.83, 25.00, 11, 23),

-- 2026-10-12: Victor Wembanyama
(6, 9, 30, 2054,
 35, 10, 0, 10,
 5, 0, 3, 5, 8,
 62.50, 75.00, 10, 16),

-- 2026-10-12: Jayson Tatum
(3, 9, 1, 1947,
 21, 6, 1, 5,
 2, 2, 1, 4, -15,
 39.13, 25.00, 9, 23),

-- 2026-10-13: Stephen Curry
(5, 10, 21, 2327,
 23, 2, 2, 0,
 4, 2, 2, 5, -3,
 42.11, 40.00, 8, 19),

-- 2026-10-13: Nikola Jokic
(4, 10, 16, 2070,
 39, 9, 4, 5,
 9, 0, 2, 5, 5,
 57.69, 25.00, 15, 26),

-- 2026-10-14: LeBron James
(1, 11, 23, 1849,
 35, 3, 3, 0,
 7, 2, 2, 3, -20,
 78.95, 50.00, 15, 19),

-- 2026-10-14: Giannis Antetokounmpo
(8, 11, 10, 2218,
 32, 8, 2, 6,
 7, 3, 0, 3, 17,
 54.17, 0.00, 13, 24),

-- 2026-10-15: Anthony Edwards
(9, 12, 17, 1895,
 29, 3, 0, 3,
 4, 2, 1, 2, 15,
 50.00, 0.00, 13, 26),

-- 2026-10-15: Jalen Brunson
(7, 12, 3, 2294,
 32, 3, 3, 0,
 8, 1, 2, 5, -22,
 46.15, 100.00, 12, 26),

-- 2026-10-16: Kevin Durant
(10, 13, 27, 1962,
 26, 4, 2, 2,
 6, 0, 1, 3, 9,
 62.50, 33.33, 10, 16),

-- 2026-10-16: Victor Wembanyama
(6, 13, 30, 2277,
 25, 9, 4, 5,
 5, 3, 3, 5, 1,
 47.37, 66.67, 9, 19),

-- 2026-10-17: Kawhi Leonard
(2, 14, 22, 2200,
 26, 3, 3, 0,
 1, 3, 0, 5, 15,
 37.50, 66.67, 9, 24),

-- 2026-10-17: Stephen Curry
(5, 14, 21, 2124,
 44, 5, 2, 3,
 8, 0, 1, 2, -16,
 57.69, 46.15, 15, 26),

-- 2026-10-18: Jayson Tatum
(3, 15, 1, 2297,
 29, 7, 1, 6,
 4, 3, 1, 3, -5,
 50.00, 100.00, 8, 16),

-- 2026-10-18: Nikola Jokic
(4, 15, 16, 2070,
 28, 15, 3, 12,
 12, 1, 2, 1, 3,
 55.56, 66.67, 10, 18),

-- 2026-10-19: Jalen Brunson
(7, 16, 3, 2090,
 44, 4, 1, 3,
 8, 2, 2, 4, -4,
 62.50, 77.78, 15, 24),

-- 2026-10-19: LeBron James
(1, 16, 23, 1999,
 24, 4, 3, 1,
 8, 0, 0, 1, 5,
 33.33, 50.00, 8, 24),

-- 2026-10-20: Victor Wembanyama
(6, 17, 30, 2240,
 33, 12, 1, 11,
 6, 2, 5, 3, 8,
 37.50, 88.89, 9, 24),

-- 2026-10-20: Giannis Antetokounmpo
(8, 17, 10, 1914,
 27, 9, 2, 7,
 8, 3, 2, 5, -3,
 52.38, 50.00, 11, 21),

-- 2026-10-21: Stephen Curry
(5, 18, 21, 2333,
 40, 6, 2, 4,
 4, 3, 0, 1, -13,
 76.47, 63.64, 13, 17),

-- 2026-10-21: Anthony Edwards
(9, 18, 17, 2081,
 41, 7, 2, 5,
 1, 3, 1, 5, 16,
 83.33, 66.67, 15, 18),

-- 2026-10-22: Nikola Jokic
(4, 19, 16, 2225,
 38, 11, 4, 7,
 12, 0, 0, 5, -11,
 50.00, 85.71, 12, 24),

-- 2026-10-22: Kevin Durant
(10, 19, 27, 2254,
 28, 6, 0, 6,
 6, 2, 2, 1, 4,
 39.13, 75.00, 9, 23),

-- 2026-10-23: Jayson Tatum
(3, 20, 1, 1928,
 22, 6, 1, 5,
 2, 3, 2, 4, 25,
 33.33, 11.11, 7, 21),

-- 2026-10-23: Kawhi Leonard
(2, 20, 22, 2138,
 30, 9, 1, 8,
 6, 1, 2, 5, -28,
 50.00, 77.78, 11, 22),

-- 2026-10-24: LeBron James
(1, 21, 23, 1833,
 37, 5, 2, 3,
 8, 0, 0, 1, -24,
 77.78, 50.00, 14, 18),

-- 2026-10-24: Victor Wembanyama
(6, 21, 30, 2268,
 26, 9, 1, 8,
 6, 3, 2, 4, 31,
 63.16, 0.00, 12, 19),

-- 2026-10-25: Jalen Brunson
(7, 22, 3, 2213,
 34, 1, 1, 0,
 8, 1, 2, 4, 8,
 37.50, 100.00, 9, 24),

-- 2026-10-25: Stephen Curry
(5, 22, 21, 2189,
 30, 4, 3, 1,
 8, 1, 0, 1, -7,
 52.17, 44.44, 12, 23),

-- 2026-10-26: Giannis Antetokounmpo
(8, 23, 10, 1949,
 29, 10, 0, 10,
 4, 3, 2, 3, 0,
 54.17, 0.00, 13, 24),

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