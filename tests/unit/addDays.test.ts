import { expect, test } from "vitest";
import { addDays } from "@/src/components/app/DateButtons";

test.each([
  { name: "avanza correctamente al siguiente año", date: "2026-12-29", amount: 5, expected: [2027, 1, 3] },
  { name: "suma días dentro del mismo mes", date: "2026-05-10", amount: 5, expected: [2026, 5, 15] },
  { name: "resta días dentro del mismo mes", date: "2026-05-10", amount: -5, expected: [2026, 5, 5] },
  { name: "mantiene la fecha al sumar cero", date: "2026-05-10", amount: 0, expected: [2026, 5, 10] },
  { name: "avanza tras un mes de 31 días", date: "2026-01-31", amount: 1, expected: [2026, 2, 1] },
  { name: "avanza tras un mes de 30 días", date: "2026-04-30", amount: 1, expected: [2026, 5, 1] },
  { name: "retrocede al mes anterior", date: "2026-05-01", amount: -1, expected: [2026, 4, 30] },
  { name: "retrocede al año anterior", date: "2026-01-03", amount: -5, expected: [2025, 12, 29] },
  { name: "pasa de febrero a marzo en un año no bisiesto", date: "2026-02-28", amount: 1, expected: [2026, 3, 1] },
  { name: "incluye el 29 de febrero en un año bisiesto", date: "2028-02-28", amount: 1, expected: [2028, 2, 29] },
  { name: "avanza desde el 29 de febrero", date: "2028-02-29", amount: 1, expected: [2028, 3, 1] },
  { name: "retrocede al 29 de febrero", date: "2028-03-01", amount: -1, expected: [2028, 2, 29] },
  { name: "atraviesa varios meses", date: "2026-01-01", amount: 90, expected: [2026, 4, 1] },
])("$name", ({ date, amount, expected }) => {
  const result = addDays(date, amount);

  expect([
    result.getFullYear(),
    result.getMonth() + 1,
    result.getDate(),
  ]).toStrictEqual(expected);
});

