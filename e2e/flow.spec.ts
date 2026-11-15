import { expect, test } from "@playwright/test";

test("quick mode draws a target and lets the player pull the trigger without turns or players", async ({ page }) => {
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
  await page.getByRole("button", { name: "Быстрый режим" }).click();
  await expect(page.getByRole("heading", { name: "Одна карта. Один барабан." })).toBeVisible();
  await page.locator("#quick-rank-range").selectOption("six");
  await page.locator("#quick-chambers").selectOption("8");
  await page.getByRole("button", { name: "Добавить пулю" }).click();
  await page.getByRole("button", { name: "Добавить пулю" }).click();
  await page.getByRole("button", { name: "Открыть быстрый стол" }).click();

  await expect(page.getByRole("heading", { name: "Ваша карта. Ваш курок." })).toBeVisible();
  await expect(page.locator(".quick-target-name")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Игроки" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Нажать курок/ })).toBeVisible();
  await page.getByRole("button", { name: /Нажать курок/ }).click();
  await expect(page.locator(".quick-outcome")).toContainText(/Щелчок|Выстрел/);
  await expect(page.locator(".quick-trigger small")).toContainText("1 · спусков");

  await page.getByRole("button", { name: "Новая карта и барабан" }).click();
  await expect(page.locator(".quick-outcome")).toContainText("Барабан готов");
  await expect(page.locator(".quick-trigger small")).toContainText("0 · спусков");
});

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
  const quickStart = page.getByRole("button", { name: "Быстрый режим" });
  await expect(quickStart).toBeVisible();
  expect((await quickStart.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(56);
  await quickStart.click();
  await expect(page.getByRole("button", { name: "Открыть быстрый стол" })).toBeVisible();
  await page.getByRole("button", { name: "Открыть быстрый стол" }).click();
  const quickTrigger = page.getByRole("button", { name: /Нажать курок/ });
  await expect(quickTrigger).toBeVisible();
  expect((await quickTrigger.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(56);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "В меню" }).click();
  await expect(page.getByRole("button", { name: "Новая партия" })).toBeVisible();

  const newGame = page.getByRole("button", { name: "Новая партия" });
  await expect(newGame).toBeVisible();

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
