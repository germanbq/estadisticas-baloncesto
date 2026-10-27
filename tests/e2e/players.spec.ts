import { test, expect } from "@playwright/test";

test("filtrar jugadores con el campo de búsqueda y entrar al perfil de un jugador", async({page}) => {
    await page.goto('/jugadores');
    
    const searcher = page.getByPlaceholder("Buscar jugador...", {
        exact: true,
    });

    await searcher.fill("LeBron");
    await expect(searcher).toHaveValue("LeBron");

    const card = page.getByRole("article").filter({
        has: page.getByText("LeBron James", { exact: true }),
    });

    const link = card.getByRole("link", {
        name: "Ver ficha completa",
        exact: true,
    });
    await link.click();
    
    await expect(page).toHaveURL(/\/jugadores\/226$/);
    await expect(page.getByTestId("player-name")).toHaveText("LeBron James");
    await expect(page.getByTestId("team-name")).toHaveText("Philadelphia 76ers")
});

test("borrar la búsqueda de jugador con el botón de limpiar", async ({page}) => {
    await page.goto('/jugadores');
    
    const searcher = page.getByPlaceholder("Buscar jugador...", {
        exact: true,
    });

    await searcher.fill("LeBron");
    await expect(searcher).toHaveValue("LeBron");

    const card = page.getByRole("article").filter({
        has: page.getByText("LeBron James", { exact: true }),
    });
    await expect(card).toBeVisible();

    const button = page.getByRole("button", {
        name: "Borrar búsqueda",
        exact: true,
    });
    await button.click();

    await expect(searcher).toHaveValue("");
    await expect(card).not.toBeVisible();
});

test("usar los filtros de posición de la búsqueda y comprobar su guardado en la url", async ({page}) => {
    await page.goto('/jugadores');

    const searcher = page.getByPlaceholder("Buscar jugador...", {
        exact: true,
    });

    await searcher.fill("LeBron");
    await expect(searcher).toHaveValue("LeBron");

    const card = page.getByRole("article").filter({
        has: page.getByText("LeBron James", { exact: true }),
    });
    await expect(card).toBeVisible();

    const guardButton = page.getByRole("button", {
        name: 'BASE',
        exact: true,
    });
    await guardButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("pos") === "PG"
    );

    await expect(card).not.toBeVisible();

    const forwardButton = page.getByRole("button", {
        name: 'ALERO',
        exact: true,
    });
    await forwardButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("pos") === "SF"
    );

    await expect(card).toBeVisible();
});

test("usar los filtros de conferencia de la búsqueda y comprobar su guardado en la url", async ({page}) => {
    await page.goto('/jugadores');

    const searcher = page.getByPlaceholder("Buscar jugador...", {
        exact: true,
    });

    await searcher.fill("LeBron");
    await expect(searcher).toHaveValue("LeBron");

    const card = page.getByRole("article").filter({
        has: page.getByText("LeBron James", { exact: true }),
    });
    await expect(card).toBeVisible();

    const westButton = page.getByRole("button", {
        name: 'OESTE',
        exact: true,
    });
    await westButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("conf") === "West"
    );

    await expect(card).not.toBeVisible();

    const eastButton = page.getByRole("button", {
        name: 'ESTE',
        exact: true,
    });
    await eastButton.click();
    await expect(page).toHaveURL(url =>
        url.searchParams.get("conf") === "East"
    );

    await expect(card).toBeVisible();
});

test("navegar al equipo desde el perfil de jugador", async ({page}) => {
    await page.goto('/jugadores/226');

    const teamLink = page.getByTestId("team-name");
    await expect(teamLink).toHaveText("Philadelphia 76ers");
    
    await teamLink.click();
    await expect(page).toHaveURL(/\/equipos\/19$/);
    await expect(page.getByTestId("team-name")).toHaveText("Philadelphia 76ers");
});

test("navegar a uno de los últimos partido desde el perfil de jugador", async ({page}) => {
    await page.goto('/jugadores/226');

    const links = page.getByTestId('recent-game-link');
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