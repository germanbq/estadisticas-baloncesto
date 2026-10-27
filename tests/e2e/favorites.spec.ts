import { test, expect, type Locator, type Page } from "@playwright/test";

test.use({ storageState: "playwright/.clerk/user.json" });
test.describe.configure({ mode: "serial" });

const favoriteCases = [
    {
        type: "jugadores", label: "jugador", tab: "Players",
        items: {
            chromium: { id: 226, names: ["LeBron James"] },
            firefox: { id: 160, names: ["Paul George"] },
            webkit: { id: 29, names: ["Scottie Barnes"] },
        },
    },
    {
        type: "equipos", label: "equipo", tab: "Teams",
        items: {
            chromium: { id: 25, names: ["Toronto Raptors"] },
            firefox: { id: 19, names: ["Philadelphia 76ers"] },
            webkit: { id: 2, names: ["Boston Celtics"] },
        },
    },
    {
        type: "partidos", label: "partido", tab: "Games",
        items: {
            chromium: { id: 1, names: ["Detroit Pistons", "Boston Celtics"] },
            firefox: { id: 2, names: ["New York Knicks", "Philadelphia 76ers"] },
            webkit: { id: 3, names: ["San Antonio Spurs", "Oklahoma City Thunder"] },
        },
    },
];

async function toggleFavorite(page: Page, button: Locator, endpoint: string, method: "POST" | "DELETE") {
    const responsePending = page.waitForResponse(response => {
        const actual = new URL(response.url());
        const expected = new URL(endpoint, page.url());
        return actual.pathname === expected.pathname &&
            actual.searchParams.get("itemId") === expected.searchParams.get("itemId") &&
            response.request().method() === method;
    });

    await button.click();
    expect((await responsePending).ok()).toBeTruthy();
    await expect(button).toHaveAttribute("aria-pressed", String(method === "POST"));
}

for (const favorite of favoriteCases) {
    test(`añadir un ${favorite.label}, cambiar su estrella y mostrarlo en favoritos`, async ({ page, browserName }) => {
        //Cada navegador usa elementos distintos para no interferir con los demás.
        const item = favorite.items[browserName];
        const profile = `/${favorite.type}/${item.id}`;
        const endpoint = `/api/favoritos/${favorite.type}?itemId=${item.id}`;

        await page.goto(profile);

        const button = page.getByRole("button", { name: "Cambiar estado de favorito", exact: true });
        await expect(button).toBeEnabled();
        await expect(button).toHaveAttribute("aria-pressed", /^(true|false)$/);
        const initiallyFavorite = await button.getAttribute("aria-pressed") === "true";

        try {
            if (initiallyFavorite) {
                await toggleFavorite(page, button, endpoint, "DELETE");
            }

            await expect(button).toHaveAttribute("aria-pressed", "false");
            await toggleFavorite(page, button, endpoint, "POST");

            await page.goto(`/favoritos?selected=${favorite.tab}`);

            const card = page.getByRole("article").filter({
                has: page.locator(`a[href="${profile}"]`),
            });
            await expect(card).toHaveCount(1);
            await expect(card).toBeVisible();

            for (const name of item.names) {
                await expect(card.getByText(name, { exact: true })).toBeVisible();
            }

            await expect(card.getByRole("button", {
                name: "Cambiar estado de favorito", exact: true,
            })).toHaveAttribute("aria-pressed", "true");
        } finally {
            const restored = await page.request.fetch(endpoint, {
                method: initiallyFavorite ? "POST" : "DELETE",
            });
            expect(restored.ok(), "Restaurar el estado inicial del favorito").toBeTruthy();
        }
    });

    test(`quitar un ${favorite.label}, vaciar su estrella y eliminarlo de favoritos`, async ({ page, browserName }) => {
        const item = favorite.items[browserName];
        const profile = `/${favorite.type}/${item.id}`;
        const endpoint = `/api/favoritos/${favorite.type}?itemId=${item.id}`;
        const favoritesURL = `/favoritos?selected=${favorite.tab}`;

        await page.goto(profile);
        const profileButton = page.getByRole("button", {
            name: "Cambiar estado de favorito", exact: true,
        });
        await expect(profileButton).toBeEnabled();
        await expect(profileButton).toHaveAttribute("aria-pressed", /^(true|false)$/);
        const initiallyFavorite = await profileButton.getAttribute("aria-pressed") === "true";

        try {
            if (!initiallyFavorite) {
                await toggleFavorite(page, profileButton, endpoint, "POST");
            }

            await page.goto(favoritesURL);
            const card = page.getByRole("article").filter({
                has: page.locator(`a[href="${profile}"]`),
            });
            await expect(card).toBeVisible();
            for (const name of item.names) {
                await expect(card.getByText(name, { exact: true })).toBeVisible();
            }

            const favoriteButton = card.getByRole("button", {
                name: "Cambiar estado de favorito", exact: true,
            });
            await expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
            await toggleFavorite(page, favoriteButton, endpoint, "DELETE");

            const listPending = page.waitForResponse(response =>
                new URL(response.url()).pathname === `/api/favoritos/${favorite.type}` &&
                response.request().method() === "GET"
            );
            await page.reload();
            const response = await listPending;
            expect(response.ok()).toBeTruthy();
            const { data } = await response.json();

            if (data.length === 0) {
                await expect(page.getByText(`Todavía no tienes ${favorite.type} favoritos`, {
                    exact: true,
                })).toBeVisible();
            } else {
                await expect(page.locator(`article a[href^="/${favorite.type}/"]`))
                    .toHaveCount(data.length);
            }
            await expect(card).toHaveCount(0);
        } finally {
            const restored = await page.request.fetch(endpoint, {
                method: initiallyFavorite ? "POST" : "DELETE",
            });
            expect(restored.ok(), "Restaurar el estado inicial del favorito").toBeTruthy();
        }
    });
}

test("comprobar el guardado en la url de los filtros de favoritos", async ({page}) => {
    await page.goto("/favoritos");

    const teamsButton = page.getByRole("button", {
        name: /^Equipos \(\d+\)$/,
    });
    await teamsButton.click();
    await expect(page).toHaveURL(url =>
        url.pathname === "/favoritos" && url.searchParams.get("selected") === "Teams"
    );

    const gamesButton = page.getByRole("button", {
        name: /^Partidos \(\d+\)$/,
    });
    await gamesButton.click();
    await expect(page).toHaveURL(url =>
        url.pathname === "/favoritos" && url.searchParams.get("selected") === "Games"
    );

    const playersButton = page.getByRole("button", {
        name: /^Jugadores \(\d+\)$/,
    });
    await playersButton.click();
    await expect(page).toHaveURL(url =>
        url.pathname === "/favoritos" && url.searchParams.get("selected") === "Players"
    );
});
