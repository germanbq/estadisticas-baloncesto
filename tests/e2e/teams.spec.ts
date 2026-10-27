import { test, expect } from "@playwright/test";

test("mostrar todos los equipos en sus conferencias en la tabla de clasificación", async ({ page }) => {
    const conferences = [
        {
            button: "CONFERENCIA ESTE",
            teams: [
                "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets",
                "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers",
                "Detroit Pistons", "Indiana Pacers", "Miami Heat",
                "Milwaukee Bucks", "New York Knicks", "Orlando Magic",
                "Philadelphia 76ers", "Toronto Raptors", "Washington Wizards",
            ],
        },
        {
            button: "CONFERENCIA OESTE",
            teams: [
                "Dallas Mavericks", "Denver Nuggets", "Golden State Warriors",
                "Houston Rockets", "Los Angeles Clippers", "Los Angeles Lakers",
                "Memphis Grizzlies", "Minnesota Timberwolves", "New Orleans Pelicans",
                "Oklahoma City Thunder", "Phoenix Suns", "Portland Trail Blazers",
                "Sacramento Kings", "San Antonio Spurs", "Utah Jazz",
            ],
        },
    ];

    await page.goto("/clasificacion");

    const table = page.getByRole("region", {
        name: "Clasificación por conferencia",
        exact: true,
    });

    for (const conference of conferences) {
        await page.getByRole("button", {
            name: conference.button,
            exact: true,
        }).click();

        await expect(table.getByRole("table")).toHaveAttribute("aria-busy", "false");
        await expect(table.getByRole("link")).toHaveCount(conference.teams.length);

        for (const name of conference.teams) {
            const link = table.getByRole("link").filter({
                has: page.getByText(name, { exact: true }),
            });

            await expect(link).toBeVisible();
            await expect(link).toHaveAttribute("href", /^\/equipos\/\d+$/);
        }
    }
});

test("comprobar el guardado en la url de los filtros", async ({page}) => {
    await page.goto("/clasificacion");

    const westButton = page.getByRole("button", {
        name: 'CONFERENCIA OESTE',
        exact: true,
    });
    await westButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("conf") === "West"
    );

    const eastButton = page.getByRole("button", {
        name: 'CONFERENCIA ESTE',
        exact: true,
    });
    await eastButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("conf") === "East"
    );
});

test("navegar al perfil de un equipo desde la tabla de clasificación", async ({page}) => {
    await page.goto('/clasificacion');

    const link = page.getByRole("link").filter({
        has: page.getByText("Toronto Raptors", { exact: true }),
    });

    await link.click();

    await expect(page).toHaveURL(/\/equipos\/25$/);
    await expect(page.getByTestId("team-name")).toHaveText("Toronto Raptors")
});

test("navegar a uno de los últimos partidos desde el perfil de un equipo", async ({page}) => {
    await page.goto('/equipos/25');

    const links = page.getByTestId("last-games");
    const link = links.first();

    await expect(link).toHaveAttribute('href', /^\/partidos\/\d+$/);

    const href = await link.getAttribute('href');

    if (!href) {
        throw new Error('El enlace del partido no tiene href');
    }

    const expectedURL = new URL(href, page.url()).href;

    await link.click();

    await expect(page).toHaveURL(expectedURL);
});

test("navegar a uno de los próximos partidos desde el perfil de un equipo", async ({page}) => {
    await page.goto('/equipos/25');

    const links = page.getByTestId("upcoming-games");
    const link = links.first();

    await expect(link).toHaveAttribute('href', /^\/partidos\/\d+$/);

    const href = await link.getAttribute('href');

    if (!href) {
        throw new Error('El enlace del partido no tiene href');
    }

    const expectedURL = new URL(href, page.url()).href;

    await link.click();

    await expect(page).toHaveURL(expectedURL);
});

test("navegar a uno de los jugadores desde el perfil de un equipo", async ({page}) => {
    await page.goto('/equipos/25');

    const table = page.getByRole("region", {
        name: `Estadísticas completas por temporada`,
        exact: true,
    });

    const playerLink = table.getByRole("link", {
        name: "Scottie Barnes",
        exact: true,
    });

    await playerLink.click();
    await expect(page).toHaveURL(/\/jugadores\/29$/);
    
    await expect(page.getByTestId("player-name")).toHaveText("Scottie Barnes");
});