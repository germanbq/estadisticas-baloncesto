// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
import {
  act, cleanup, createEvent, fireEvent, render, screen, waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import FavoriteButton from "@/src/components/FavoriteButton";

const clerk = vi.hoisted(() => ({
  useUser: vi.fn<() => { isLoaded: boolean; isSignedIn: boolean | undefined }>(),
  openSignIn: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: clerk.useUser,
  useClerk: () => ({ openSignIn: clerk.openSignIn }),
}));

const fetchMock = vi.fn<typeof fetch>();
const onFavoriteChange = vi.fn<(favorite: boolean) => void>();

const defaultProps = {
  type: "jugadores",
  itemId: 15,
  isFavorite: false,
};

function renderButton(props: Partial<ComponentProps<typeof FavoriteButton>> = {}) {
  return render(
    <FavoriteButton
      {...defaultProps}
      onFavoriteChange={onFavoriteChange}
      {...props}
    />,
  );
}

function button() {
  return screen.getByRole("button", { name: "Cambiar estado de favorito" });
}

function pendingResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  clerk.useUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  fetchMock.mockImplementation(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FavoriteButton: estado inicial y autenticación", () => {
  test.each([
    { isFavorite: false, pressed: "false" },
    { isFavorite: true, pressed: "true" },
  ])("representa isFavorite=$isFavorite al renderizar", ({ isFavorite, pressed }) => {
    renderButton({ isFavorite });

    expect(button()).toBeEnabled();
    expect(button()).toHaveAttribute("aria-pressed", pressed);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("está deshabilitado mientras Clerk carga", () => {
    clerk.useUser.mockReturnValue({ isLoaded: false, isSignedIn: undefined });
    renderButton();

    expect(button()).toBeDisabled();
    fireEvent.click(button());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(clerk.openSignIn).not.toHaveBeenCalled();
    expect(onFavoriteChange).not.toHaveBeenCalled();
  });

  test("respeta la propiedad disabled", () => {
    renderButton({ disabled: true });

    expect(button()).toBeDisabled();
    fireEvent.click(button());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onFavoriteChange).not.toHaveBeenCalled();
  });

  test("abre el inicio de sesión y no guarda si no hay usuario", () => {
    clerk.useUser.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderButton();

    fireEvent.click(button());

    expect(clerk.openSignIn).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onFavoriteChange).not.toHaveBeenCalled();
    expect(button()).toHaveAttribute("aria-pressed", "false");
  });

  test("muestra la estrella vacía sin sesión aunque isFavorite sea true", () => {
    clerk.useUser.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderButton({ isFavorite: true });

    expect(button()).toHaveAttribute("aria-pressed", "false");
  });
});

describe.each(["jugadores", "equipos", "partidos"])(
  "FavoriteButton: favoritos de %s",
  (type) => {
    test("añade con POST, activa la estrella y avisa al componente padre", async () => {
      renderButton({ type, isFavorite: false });

      fireEvent.click(button());

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        "/api/favoritos/" + type + "?itemId=15",
        { method: "POST", signal: expect.any(AbortSignal) },
      );

      await waitFor(() => {
        expect(button()).toBeEnabled();
        expect(button()).toHaveAttribute("aria-pressed", "true");
        expect(onFavoriteChange).toHaveBeenCalledExactlyOnceWith(true);
      });
    });

    test("quita con DELETE, vacía la estrella y avisa al componente padre", async () => {
      renderButton({ type, isFavorite: true });

      fireEvent.click(button());

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        "/api/favoritos/" + type + "?itemId=15",
        { method: "DELETE", signal: expect.any(AbortSignal) },
      );

      await waitFor(() => {
        expect(button()).toBeEnabled();
        expect(button()).toHaveAttribute("aria-pressed", "false");
        expect(onFavoriteChange).toHaveBeenCalledExactlyOnceWith(false);
      });
    });
  },
);

describe("FavoriteButton: espera y errores", () => {
  test("bloquea los clics repetidos y conserva el estado mientras guarda", async () => {
    const request = pendingResponse();
    fetchMock.mockReturnValueOnce(request.promise);
    renderButton();

    fireEvent.click(button());

    expect(button()).toBeDisabled();
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(onFavoriteChange).not.toHaveBeenCalled();

    fireEvent.click(button());
    fireEvent.click(button());

    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      request.resolve(new Response(null, { status: 200 }));
    });

    expect(button()).toBeEnabled();
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(onFavoriteChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  test.each([
    { isFavorite: false, failure: "HTTP", pressed: "false" },
    { isFavorite: true, failure: "HTTP", pressed: "true" },
    { isFavorite: false, failure: "red", pressed: "false" },
    { isFavorite: true, failure: "red", pressed: "true" },
  ])(
    "conserva isFavorite=$isFavorite si falla por $failure",
    async ({ isFavorite, failure, pressed }) => {
      if (failure === "HTTP") {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
      } else {
        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      }

      renderButton({ isFavorite });
      fireEvent.click(button());

      await waitFor(() => {
        expect(button()).toBeEnabled();
        expect(console.error).toHaveBeenCalledOnce();
      });

      expect(button()).toHaveAttribute("aria-pressed", pressed);
      expect(onFavoriteChange).not.toHaveBeenCalled();
      expect(clerk.openSignIn).not.toHaveBeenCalled();
    },
  );

  test("permite reintentar después de un error", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    renderButton();

    fireEvent.click(button());
    await waitFor(() => expect(button()).toBeEnabled());

    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(onFavoriteChange).not.toHaveBeenCalled();

    fireEvent.click(button());

    await waitFor(() => {
      expect(button()).toBeEnabled();
      expect(button()).toHaveAttribute("aria-pressed", "true");
      expect(onFavoriteChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([, options]) => options?.method))
      .toStrictEqual(["POST", "POST"]);
  });
});

describe("FavoriteButton: integración con el componente padre", () => {
  test("funciona aunque no se proporcione onFavoriteChange", async () => {
    renderButton({ onFavoriteChange: undefined });

    fireEvent.click(button());

    await waitFor(() => {
      expect(button()).toBeEnabled();
      expect(button()).toHaveAttribute("aria-pressed", "true");
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  test("cancela la acción por defecto y no propaga el clic al padre", async () => {
    const onParentClick = vi.fn();

    render(
      <div onClick={onParentClick}>
        <FavoriteButton {...defaultProps} onFavoriteChange={onFavoriteChange} />
      </div>,
    );

    const event = createEvent.click(button());
    fireEvent(button(), event);

    expect(event.defaultPrevented).toBe(true);
    expect(onParentClick).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onFavoriteChange).toHaveBeenCalledExactlyOnceWith(true);
    });
  });

  test.each(["resuelve", "rechaza"] as const)(
    "cancela al desmontarse e ignora la petición si después se %s",
    async (outcome) => {
      const request = pendingResponse();
      fetchMock.mockReturnValueOnce(request.promise);
      const { unmount } = renderButton();

      fireEvent.click(button());

      const signal = fetchMock.mock.calls[0][1]?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);

      unmount();

      expect(signal?.aborted).toBe(true);

      await act(async () => {
        if (outcome === "resuelve") {
          request.resolve(new Response(null, { status: 200 }));
        } else {
          request.reject(new DOMException("Petición cancelada", "AbortError"));
        }
      });

      expect(onFavoriteChange).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    },
  );
});
