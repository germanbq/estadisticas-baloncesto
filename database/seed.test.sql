INSERT INTO teams (name, short_name, logo, conference, division, stadium, coach)
OVERRIDING SYSTEM VALUE
VALUES
    ('Boston Celtics', 'BOS', '/logos/boston-celtics.webp', 'East', 'Atlantic', 'TD Garden', 'Joe Mazzulla'),
    ('Denver Nuggets', 'DEN', '/logos/denver-nuggets.webp', 'West', 'Northwest', 'Ball Arena', 'David Adelman');

INSERT INTO games (home_team_id, away_team_id, date, season_init_year, finished)
VALUES
    (1, 2, '2026-10-18 07:59:59.999+00', 2026, FALSE),
    (1, 2, '2026-10-18 08:00:00+00', 2026, FALSE),
    (1, 2, '2026-10-19 07:59:59.999+00', 2026, FALSE),
    (1, 2, '2026-10-19 08:00:00+00', 2026, FALSE)
