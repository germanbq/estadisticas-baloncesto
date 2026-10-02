BEGIN;

-- EQUIPOS
-- Las rutas de logos son de ejemplo.
INSERT INTO teams (
    name, short_name, logo, conference, divison, stadium
)
VALUES
('Boston Celtics', 'BOS', '/logos/bos.png', 'East', 'Atlantic', 'TD Garden'),
('Los Angeles Lakers', 'LAL', '/logos/lal.png', 'West', 'Pacific', 'Crypto.com Arena'),
('Golden State Warriors', 'GSW', '/logos/gsw.png', 'West', 'Pacific', 'Chase Center'),
('Chicago Bulls', 'CHI', '/logos/chi.png', 'East', 'Central', 'United Center'),
('Miami Heat', 'MIA', '/logos/mia.png', 'East', 'Southeast', 'Kaseya Center');


-- ESTADÍSTICAS DE EQUIPOS
-- win_rate expresado de 0 a 100.
INSERT INTO team_season_stats (
    team_id, season_init_year, victorys, loses,
    win_rate, difference, streak_number, streak_victory
)
VALUES
(1, 2025, 60, 22, 73.17,  8.50, 4, TRUE),
(2, 2025, 48, 34, 58.54,  3.20, 2, TRUE),
(3, 2025, 45, 37, 54.88,  1.80, 1, FALSE),
(4, 2025, 35, 47, 42.68, -2.40, 3, FALSE),
(5, 2025, 44, 38, 53.66,  1.10, 1, TRUE);


-- JUGADORES
-- Altura en metros, peso en kg y draft como año.
-- Imagen provisional compartida.
INSERT INTO players (
    name, height, weight, age, draft, team_id,
    country, jersey_number, position, image
)
VALUES
('Daniel Carter', 2.03, 98.00, 26, 2020, 1,
 'USA', 12, 'SF', '/LeBron_James.jpg'),
('Marcus Hill', 2.11, 112.50, 28, 2018, 2,
 'USA', 34, 'C', '/LeBron_James.jpg'),
('Adrian Lopez', 1.91, 86.00, 24, 2022, 3,
 'Spain', 8, 'PG', '/LeBron_James.jpg'),
('Lucas Martin', 1.98, 94.00, 25, 2021, 4,
 'France', 21, 'SG', '/LeBron_James.jpg'),
('Gabriel Silva', 2.06, 104.00, 27, 2019, 5,
 'Brazil', 15, 'PF', '/LeBron_James.jpg');


-- ESTADÍSTICAS DE TEMPORADA
-- Promedios ficticios de temporada completa.
-- El detalle de partidos de abajo es solo una muestra.
INSERT INTO player_season_stats (
    player_id, season_init_year,
    points, rebounds, ofe_rebounds, def_rebounds,
    assists, steals, blocks, turnovers, plusminus,
    fg_percentage, three_percentage, games_played
)
VALUES
(1, 2025, 27.50, 8.20, 1.30, 6.90,
 4.80, 1.20, 0.80, 2.60, 7.40, 48.00, 37.50, 80),
(2, 2025, 23.40, 11.60, 3.20, 8.40,
 3.10, 0.90, 2.10, 2.30, 4.20, 60.00, 25.00, 75),
(3, 2025, 25.80, 4.30, 0.60, 3.70,
 8.70, 1.60, 0.30, 3.10, 3.50, 45.00, 40.00, 78),
(4, 2025, 21.20, 5.10, 0.90, 4.20,
 4.20, 1.30, 0.50, 2.00, -1.80, 46.00, 36.00, 80),
(5, 2025, 19.60, 9.40, 2.40, 7.00,
 3.60, 1.10, 1.40, 1.90, 2.60, 52.00, 32.00, 76);


-- PARTIDOS
-- Boston participa en los cinco: tres victorias y dos derrotas.
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


-- ESTADÍSTICAS POR PARTIDO
-- Daniel Carter jugó con Boston en los cinco encuentros.
-- team_id = 1 cumple la validación del trigger.
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