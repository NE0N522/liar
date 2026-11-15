import { expect, test } from "@playwright/test";

test("three players finish a round, challenge, reveal, shoot, and crown a winner", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "getRandomValues", {
      configurable: true,
      value: <T extends ArrayBufferView | null>(array: T): T => {
        if (array) new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(0);
        return array;
      },
    });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Настройки" }).click();
  await page.getByRole("checkbox", { name: /Звук/ }).uncheck();
  await page.getByRole("checkbox", { name: /Лайт-режим/ }).check();
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.getByRole("button", { name: "Новая партия" }).click();
  const bullets = page.getByRole("group", { name: "Пуль" });
  for (let count = 0; count < 4; count += 1) {
    await bullets.getByRole("button", { name: "Пуль +" }).click();
  }
  await page.getByRole("button", { name: "Начать партию" }).click();

  await page.getByRole("button", { name: /1 карту$/ }).click();
  await page.getByRole("button", { name: /1 карту$/ }).click();
  await page.getByRole("button", { name: "ЛЖЕЦ!" }).click();
  await expect(page.getByRole("heading", { name: "Вскрывайте карты" })).toBeVisible();
  await page.getByRole("button", { name: "Он врал" }).click();

  await page.getByRole("button", { name: "Нажать" }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("heading", { name: "Стол стал тише." })).toBeVisible();
  await page.getByRole("button", { name: "Следующий раунд" }).click();

  await page.getByRole("button", { name: /1 карту$/ }).click();
  await page.getByRole("button", { name: /1 карту$/ }).click();
  await page.getByRole("button", { name: "ЛЖЕЦ!" }).click();
  await page.getByRole("button", { name: "Он врал" }).click();
  await page.getByRole("button", { name: "Нажать" }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("heading", { name: "Последний за столом" })).toBeVisible();
  await expect(page.locator(".winner-nameplate strong")).toHaveText("Никита");
});

test("fits a narrow phone in portrait and landscape with touch-sized primary actions", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const newGame = page.getByRole("button", { name: "Новая партия" });
  await expect(newGame).toBeVisible();
  expect((await newGame.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(56);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(newGame).toBeVisible();

  await newGame.click();
  await page.getByRole("button", { name: "Начать партию" }).click();
  const firstPlay = page.getByRole("button", { name: /1 карту$/ });
  await expect(firstPlay).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await firstPlay.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(56);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(firstPlay).toBeVisible();
});
