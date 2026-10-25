import { calculatePercentagesStatsComparison } from "@/src/components/game/BarsComparison";
import { describe, test, expect } from "vitest";


describe("calculatePercentagesStatsComparison", () => {
    test.each([
        { home: 1, secondHome: 3, away: 2, secondAway: 2, expectedHome: 33.33, expectedAway: 66.67 },
        { home: 8, secondHome: 24, away: 5, secondAway: 25, expectedHome: 60, expectedAway: 40 },
        { home: 0, secondHome: 0, away: 0, secondAway: 2, expectedHome: 50, expectedAway: 50 },
    ])(
        "para $home victorias con $secondHome derrotas y $away victorias con $secondAway derrotas devuelve $expectedHome/$expectedAway",
        ({ home, secondHome, away, secondAway, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Balance",
                homeValue: home, secondHomeValue: secondHome,
                awayValue: away, secondAwayValue: secondAway,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: -9.22, away: 15.24, expectedHome: 18.20, expectedAway: 81.80 },
        { home: 8.5, away: 3.2, expectedHome: 56.89, expectedAway: 43.11 },
        { home: 0, away: 0, expectedHome: 50, expectedAway: 50 },
    ])(
        "en Net Rating para $home y $away devuelve $expectedHome/$expectedAway",
        ({ home, away, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Net Rating",
                homeValue: home, awayValue: away,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: 118.5, away: 110.2, expectedHome: 60.79, expectedAway: 39.21 },
        { home: 105.4, away: 115.8, expectedHome: 36.48, expectedAway: 63.52 },
        { home: 0, away: 0, expectedHome: 50, expectedAway: 50 },
    ])(
        "en Offensive Rating para $home y $away devuelve $expectedHome/$expectedAway",
        ({ home, away, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Offensive Rating",
                homeValue: home, awayValue: away,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: 108.5, away: 116.2, expectedHome: 60.01, expectedAway: 39.99 },
        { home: 119.4, away: 111.8, expectedHome: 40.12, expectedAway: 59.88 },
        { home: 0, away: 0, expectedHome: 50, expectedAway: 50 },
    ])(
        "en Defensive Rating para $home y $away devuelve $expectedHome/$expectedAway",
        ({ home, away, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Defensive Rating",
                homeValue: home, awayValue: away,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: 100, away: 120, expectedHome: 54.55, expectedAway: 45.45 },
        { home: 120, away: 100, expectedHome: 45.45, expectedAway: 54.55 },
        { home: 110, away: 110, expectedHome: 50, expectedAway: 50 },
        { home: 0, away: 0, expectedHome: 50, expectedAway: 50 },
    ])(
        "en PAPG para $home y $away favorece al que recibe menos y devuelve $expectedHome/$expectedAway",
        ({ home, away, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Puntos recibidos / Partido (PAPG)",
                homeValue: home,
                awayValue: away,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: 60, away: 40, factor: 3, expectedHome: 80, expectedAway: 20 },
        { home: 60, away: 40, factor: 0.5, expectedHome: 55, expectedAway: 45 },
        { home: 60, away: 40, factor: 0, expectedHome: 50, expectedAway: 50 },
        { home: 90, away: 10, factor: 3, expectedHome: 100, expectedAway: 0 },
        { home: 10, away: 90, factor: 3, expectedHome: 0, expectedAway: 100 },
        { home: 0, away: 0, factor: 3, expectedHome: 50, expectedAway: 50 },
    ])(
        "con factor $factor para $home y $away devuelve $expectedHome/$expectedAway",
        ({ home, away, factor, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Puntos / Partido (PPG)",
                homeValue: home,
                awayValue: away,
                factor,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );

    test.each([
        { home: 60, away: 40, expectedHome: 60, expectedAway: 40 },
        { home: 10, away: 20, expectedHome: 33.33, expectedAway: 66.67 },
        { home: 0, away: 0, expectedHome: 50, expectedAway: 50 },
    ])(
        "sin factor para $home y $away devuelve $expectedHome/$expectedAway",
        ({ home, away, expectedHome, expectedAway }) => {
            const result = calculatePercentagesStatsComparison({
                label: "Puntos",
                homeValue: home,
                awayValue: away,
            });

            expect(result.homePercentage).toBeCloseTo(expectedHome, 2);
            expect(result.awayPercentage).toBeCloseTo(expectedAway, 2);
        },
    );
});
