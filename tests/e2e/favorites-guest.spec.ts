import { test, expect } from "@playwright/test";

test("pedir iniciar sesión al intentar añadir un partido a favoritos", async ({ page }) => {
    await page.goto("/partidos/1");
    await expect(page.getByRole("banner").getByRole("button", {
        name: "Iniciar sesión", exact: true,
    })).toBeVisible();

    const button = page.getByRole("button", {
        name: "Cambiar estado de favorito", exact: true,
    });
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", "false");

    const addRequests: string[] = [];
    page.on("request", request => {
        if (new URL(request.url()).pathname === "/api/favoritos/partidos" &&
            request.method() === "POST") {
            addRequests.push(request.url());
        }
    });

    await button.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", {
        name: "Entrar", exact: true,
    })).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(addRequests).toHaveLength(0);
    await expect(page).toHaveURL(url => url.pathname === "/partidos/1");
});

test("mostrar el inicio de sesión de Clerk al pulsar favoritos en el header", async ({ page }) => {
    await page.goto("/jugadores");

    const header = page.getByRole("banner");
    await expect(header.getByRole("button", {
        name: "Iniciar sesión", exact: true,
    })).toBeVisible();

    await header.getByRole("button", {
        name: "Favoritos", exact: true,
    }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", {
        name: "Entrar", exact: true,
    })).toBeVisible();
    await expect(page).toHaveURL(url => url.pathname === "/jugadores");
});
