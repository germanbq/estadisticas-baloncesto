// @vitest-environment jsdom

import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StatsDataNotice from "../../src/components/StatsDataNotice";
import GameCard from "../../src/components/GameCard";

vi.mock("../../src/components/FavoriteButton", () => ({ default: () => null }));

const prototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(prototype, "close");

// JSDOM does not implement native dialog methods; focus and Escape use the browser's native behavior.
beforeAll(() => {
    Object.defineProperties(prototype, {
        showModal: {
            configurable: true,
            value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
        },
        close: {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.removeAttribute("open");
                this.dispatchEvent(new Event("close"));
            },
        },
    });
});

afterAll(() => {
    if (originalShowModal) Object.defineProperty(prototype, "showModal", originalShowModal);
    else Reflect.deleteProperty(prototype, "showModal");
    if (originalClose) Object.defineProperty(prototype, "close", originalClose);
    else Reflect.deleteProperty(prototype, "close");
});

afterEach(cleanup);

describe("StatsDataNotice", () => {
    test("identifica los datos antes de abrirse y permite consultar y cerrar la explicación", () => {
        render(<StatsDataNotice context="Clasificación" />);
        const trigger = screen.getByRole("button", { name: "Información sobre los datos ficticios: Clasificación" });

        expect(trigger).toHaveTextContent("Datos ficticios");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        fireEvent.click(trigger);

        const dialog = screen.getByRole("dialog", { name: "Estadísticas de demostración" });
        expect(dialog).toHaveAccessibleDescription(/No representan partidos ni el rendimiento real/);
        expect(dialog).toHaveTextContent(/sin monetización/);
        expect(dialog).toHaveTextContent(/no está afiliado, patrocinado ni respaldado/);

        fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso de datos ficticios" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("los avisos de distintas secciones mantienen sus asociaciones y apertura independientes", () => {
        render(<><StatsDataNotice context="Puntos" /><StatsDataNotice context="Rebotes" /></>);
        fireEvent.click(screen.getByRole("button", { name: "Información sobre los datos ficticios: Puntos" }));
        const firstTitle = screen.getByRole("dialog").getAttribute("aria-labelledby");
        fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
        fireEvent.click(screen.getByRole("button", { name: "Información sobre los datos ficticios: Rebotes" }));
        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-labelledby", firstTitle);
    });

    test("el aviso de una tarjeta de partido queda fuera del enlace de navegación", () => {
        render(<GameCard id={1} isFavorite={false} finalizado homeTeam="Boston Celtics" awayTeam="Denver Nuggets"
            homeScore={104} awayScore={107} homeRecord="3-3" awayRecord="4-2"
            homeLogo="/logos/boston-celtics.webp" awayLogo="/logos/denver-nuggets.webp"
            place="TD Garden" date={new Date("2026-10-20T20:00:00Z")} href="/partidos/1" />);

        const trigger = screen.getByRole("button", { name: /Información sobre los datos ficticios/ });
        expect(trigger.closest("a")).toBeNull();
        fireEvent.click(trigger);
        expect(screen.getByRole("dialog")).toBeVisible();
        expect(screen.getByRole("link", { name: /Ver partido:/ })).toHaveAttribute("href", "/partidos/1");
    });
});
