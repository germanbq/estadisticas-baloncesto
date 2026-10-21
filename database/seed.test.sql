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
