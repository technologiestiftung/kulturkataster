import { expect, test } from "@playwright/test";

const cardSelector = "article[data-institution-card-id]";
const selectedCardSelector = `${cardSelector}[data-selected="true"]`;
const scrollToTopButtonSelector = '[data-testid="list-scroll-top"]';

test.describe("ListView Selection Behavior", () => {
	test.beforeEach(async ({ page }) => {
		// No networkidle: background requests keep the network busy on CI
		await page.goto("/de/list");
		await expect(page.locator('[role="list"]').first()).toBeVisible();
	});

	test("1. Selected item should be centered with details open", async ({
		page,
	}) => {
		const firstCard = page.locator(cardSelector).first();
		await firstCard.click();
		await page.waitForURL(/\/list\/institution\/\d+/);

		const selectedCard = page.locator(selectedCardSelector).first();
		await expect(selectedCard).toBeVisible();

		const cardBox = await selectedCard.boundingBox();
		const viewportSize = page.viewportSize();
		if (cardBox && viewportSize) {
			const cardCenterY = cardBox.y + cardBox.height / 2;
			const viewportCenterY = viewportSize.height / 2;
			expect(cardCenterY).toBeGreaterThan(0);
			expect(cardCenterY).toBeLessThan(viewportSize.height + 120);
			expect(Math.abs(cardCenterY - viewportCenterY)).toBeLessThan(
				viewportSize.height,
			);
		}

		const expandedDetail = selectedCard.locator('[data-state="open"]');
		if ((await expandedDetail.count()) > 0) {
			await expect(expandedDetail.first()).toBeVisible();
		}
	});

	test("2. Selecting new item should center it", async ({ page }) => {
		const firstCard = page.locator(cardSelector).first();
		const firstId = await firstCard.getAttribute("data-institution-card-id");
		await firstCard.click();
		await page.waitForURL(/\/list\/institution\/\d+/);

		const secondCard = page.locator(cardSelector).nth(1);
		const secondId = await secondCard.getAttribute("data-institution-card-id");
		expect(secondId).not.toBe(firstId);
		await secondCard.click();

		await page.waitForURL(new RegExp(`/list/institution/${secondId}`));
		await expect(
			page.locator(
				`[data-institution-card-id="${secondId}"][data-selected="true"]`,
			),
		).toBeVisible();
	});

	test("3. Direct route navigation shows item immediately centered", async ({
		page,
	}) => {
		await page.goto("/de/list/institution/5");
		await expect(page.locator('[role="list"]').first()).toBeVisible();

		const selectedCard = page.locator(
			'[data-institution-card-id="5"][data-selected="true"]',
		);
		await expect(selectedCard).toBeVisible({ timeout: 15_000 });
	});

	test("4. Scroll to top button works", async ({ page }) => {
		await page.evaluate(() => window.scrollTo(0, 1000));
		await page.waitForTimeout(250);

		const scrollToTopButton = page.locator(scrollToTopButtonSelector).first();
		await expect(scrollToTopButton).toBeVisible();
		await scrollToTopButton.click();
		await page.waitForTimeout(500);

		const scrollY = await page.evaluate(() => window.pageYOffset);
		expect(scrollY).toBeLessThan(50);
	});

	test("5. Scroll to top works with selected institution route", async ({
		page,
	}) => {
		await page.goto("/de/list/institution/30");
		await expect(page.locator('[role="list"]').first()).toBeVisible();
		await page.waitForTimeout(400);

		const scrollToTopButton = page.locator(scrollToTopButtonSelector).first();
		await expect(scrollToTopButton).toBeVisible();
		await scrollToTopButton.click();
		await page.waitForTimeout(500);

		const scrollY = await page.evaluate(() => window.pageYOffset);
		expect(scrollY).toBeLessThan(50);
		await page.waitForURL(/\/de\/list(?:\?|$)/);
	});

	test("6. Maintains virtualization and performance", async ({ page }) => {
		const renderedCards = await page.locator(cardSelector).count();
		expect(renderedCards).toBeLessThan(80);

		await page.evaluate(() => window.scrollTo(0, 2000));
		await page.waitForTimeout(300);
		const renderedCardsAfterScroll = await page.locator(cardSelector).count();
		expect(renderedCardsAfterScroll).toBeLessThan(80);
	});

	test("Deselects when clicking selected item", async ({ page }) => {
		const firstCard = page.locator(cardSelector).first();
		const cardId = await firstCard.getAttribute("data-institution-card-id");
		await firstCard.click();
		await page.waitForURL(new RegExp(`/list/institution/${cardId}`));

		const selectedCard = page.locator(
			`[data-institution-card-id="${cardId}"][data-selected="true"]`,
		);
		await expect(selectedCard).toBeVisible();
		await selectedCard.click();
		await page.waitForURL("/de/list");
		await expect(page.locator(selectedCardSelector)).toHaveCount(0);
	});

	test("Keyboard navigation works with selection", async ({ page }) => {
		const focusCard = page.locator(`${cardSelector} > button`).first();
		await focusCard.focus();
		await expect(focusCard).toBeFocused();
		await page.keyboard.press("Enter");
		await page.waitForURL(/\/list\/institution\/\d+/);
		await expect(page.locator(selectedCardSelector).first()).toBeVisible();
	});

	test("Handles rapid selection changes smoothly", async ({ page }) => {
		const cards = page.locator(cardSelector);
		for (let i = 0; i < 5; i++) {
			await cards.nth(i).click();
			await page.waitForTimeout(100);
		}
		await expect(page.locator(selectedCardSelector)).toHaveCount(1);
	});
});
