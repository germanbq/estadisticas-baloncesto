import { test as setup, expect } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { mkdir } from "node:fs/promises";

setup.describe.configure({ mode: "serial" });

setup("preparar Clerk", async () => {
    for (const key of ["CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "E2E_CLERK_USER_EMAIL"]) {
        if (!process.env[key]?.trim()) {
            throw new Error(`Falta ${key}. Configúrala en .env.local para los tests E2E.`);
        }
    }

    await clerkSetup();
});

setup("autenticar la cuenta de pruebas y guardar la sesión", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({
        page,
        emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
    });

    // Verifica que el servidor reconoce la sesión antes de guardarla.
    const response = await page.request.get("/api/favoritos/numero");
    expect(response.status()).toBe(200);

    await mkdir("playwright/.clerk", { recursive: true });
    await page.context().storageState({ path: "playwright/.clerk/user.json" });
});
