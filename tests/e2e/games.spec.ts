import { test, expect } from "@playwright/test";

test("consultar partidos y abrir uno", async ({page}) => {
    const expectedGames = [
        { id: 1, home: 'Detroit Pistons', away: 'Boston Celtics', homeScore: 121, awayScore: 113, homeId: 29, awayId: 2, mvpId: 160, mvpName: 'Paul George' },
        { id: 2, home: 'New York Knicks', away: 'Philadelphia 76ers'},
        { id: 3, home: 'San Antonio Spurs', away: 'Oklahoma City Thunder'},
    ];
    const selectedGame = expectedGames[0];

    await page.goto('/?date=2026-10-20');

    await expect(page.getByRole("link", { name: /^Ver partido:/})).toHaveCount(expectedGames.length);

    for (const game of expectedGames) {
        const link = page.getByRole("link", {
            name: `Ver partido: ${game.home} contra ${game.away}`,
            exact: true,
        });

        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", `/partidos/${game.id}`);
    }

    const link = page.getByRole("link", {
        name: `Ver partido: ${selectedGame.home} contra ${selectedGame.away}`,
        exact: true,
    });

    await link.click();
    await expect(page).toHaveURL(
        new RegExp(`/partidos/${selectedGame.id}$`)
    );

    await expect(page.getByTestId("home-score")).toHaveText(String(selectedGame.homeScore));
    await expect(page.getByTestId("away-score")).toHaveText(String(selectedGame.awayScore));
    
    const homeLink = page.getByTestId("home-name");
    const awayLink = page.getByTestId("away-name");
    await expect(homeLink).toHaveText(String(selectedGame.home));
    await expect(awayLink).toHaveText(String(selectedGame.away));

    await homeLink.click();
    await expect(page).toHaveURL(
        new RegExp(`/equipos/${selectedGame.homeId}$`)
    );
    await expect(page.getByTestId("team-name")).toHaveText(String(selectedGame.home));

    await page.goBack();

    await awayLink.click();
    await expect(page).toHaveURL(
        new RegExp(`/equipos/${selectedGame.awayId}$`)
    );
    await expect(page.getByTestId("team-name")).toHaveText(String(selectedGame.away));

    await page.goBack();

    const mvpLink = page.getByTestId("mvp-name");
    await mvpLink.click();
    await expect(page).toHaveURL(
        new RegExp(`/jugadores/${selectedGame.mvpId}$`)
    );
    await expect(page.getByTestId("player-name")).toHaveText(String(selectedGame.mvpName));

    await page.goBack();

    const awayTable = page.getByRole("region", {
        name: `Estadísticas de jugadores de ${expectedGames[0].away}`,
        exact: true,
    });

    const playerLink = awayTable.getByRole("link", {
        name: "Paul George",
        exact: true,
    });

    await playerLink.click();
    await expect(page).toHaveURL(
        new RegExp(`/jugadores/${selectedGame.mvpId}$`)
    );
    await expect(page.getByTestId("player-name")).toHaveText(String(selectedGame.mvpName));
});