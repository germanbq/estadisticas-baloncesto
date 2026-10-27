import { test, expect } from "@playwright/test";

test("consultar partidos y abrir uno", async ({page}) => {
    const expectedGames = [
        { id: 1, home: 'Detroit Pistons', away: 'Boston Celtics', homeScore: 121, awayScore: 113, mvp: 'Paul George'},
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

    const homeLink = page.getByTestId("home-name");
    await expect(homeLink).toHaveText(String(selectedGame.home));
    const homeScore = page.getByTestId("home-score");
    await expect(homeScore).toHaveText(String(selectedGame.homeScore))

    const awayLink = page.getByTestId("away-name");
    await expect(awayLink).toHaveText(selectedGame.away);
    const awayScore = page.getByTestId("away-score");
    await expect(awayScore).toHaveText(String(selectedGame.awayScore))

    const mvpLink = page.getByTestId("mvp-name");
    await expect(mvpLink).toHaveText(String(selectedGame.mvp));
});

test("cambiar la fecha usando los botones y comprobar que cambia el listado de partidos", async ({page}) => {
    await page.goto('/?date=2026-10-20&reference=2026-10-20');

    const links = page.getByRole("link", { name: /^Ver partido:/ });

    await expect(links).toHaveCount(3);
    const before = await links.evaluateAll(elements =>
        elements.map(element => element.getAttribute("href"))
    );

    const button = page.getByRole("button", {name: "21"})
    await button.click();

    await expect(links).toHaveCount(11);
    const after = await links.evaluateAll(elements =>
        elements.map(element => element.getAttribute("href"))
    );

    expect(before).not.toEqual(after);
});

test("navegar al equipo local desde el perfil de partido", async ({page}) => {
    await page.goto('/partidos/1');

    const homeLink = page.getByTestId("home-name");
    await expect(homeLink).toHaveText("Detroit Pistons");

    await homeLink.click();
    await expect(page).toHaveURL(/\/equipos\/29$/);

    await expect(page.getByTestId("team-name")).toHaveText("Detroit Pistons");
});

test("navegar al equipo visitante desde el perfil de partido", async ({page}) => {
    await page.goto('/partidos/1');

    const awayLink = page.getByTestId("away-name");
    await expect(awayLink).toHaveText("Boston Celtics");

    await awayLink.click();
    await expect(page).toHaveURL(/\/equipos\/2$/);

    await expect(page.getByTestId("team-name")).toHaveText("Boston Celtics");
});

test("navegar al perfil del mvp del partido desde el perfil de partido", async ({page}) => {
    await page.goto('/partidos/1');

    const mvpLink = page.getByTestId("mvp-name");
    await expect(mvpLink).toHaveText("Paul George");
    await mvpLink.click();
    await expect(page).toHaveURL(/\/jugadores\/160$/);

    await expect(page.getByTestId("player-name")).toHaveText("Paul George");
});

test("navegar al perfil de un jugador desde la tabla de estadísticas", async ({page}) => {
    await page.goto('/partidos/1');

    const awayTable = page.getByRole("region", {
        name: `Estadísticas de jugadores de ${"Boston Celtics"}`,
        exact: true,
    });

    const playerLink = awayTable.getByRole("link", {
        name: "Paul George",
        exact: true,
    });

    await playerLink.click();
    await expect(page).toHaveURL(/\/jugadores\/160$/);
    
    await expect(page.getByTestId("player-name")).toHaveText("Paul George");
});

