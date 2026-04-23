import fs from "node:fs/promises";
import { chromium, type FullConfig } from "@playwright/test";
import dotenv from "dotenv";
import {
	ADMIN_STORAGE_STATE,
	E2E_AUTH_DIR,
	USER_STORAGE_STATE,
} from "../helpers/e2eAuthState";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.test" });

const LOGIN_TIMEOUT = 30_000;
const FIELD_TIMEOUT = 30_000;
const SERVER_WAIT_TIMEOUT = 90_000;
const RETRY_INTERVAL_MS = 1_500;

type SaveStorageOptions = {
	baseURL: string;
	statePath: string;
	label: string;
	email?: string;
	password?: string;
};

const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const isConnectionRefusedError = (error: unknown) => {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return (
		message.includes("ERR_CONNECTION_REFUSED") ||
		message.includes("ECONNREFUSED")
	);
};

const gotoWithRetry = async (
	page: import("@playwright/test").Page,
	route: string,
	deadline: number,
) => {
	let lastError: unknown;
	while (Date.now() < deadline) {
		try {
			await page.goto(route, {
				waitUntil: "domcontentloaded",
				timeout: Math.min(10_000, Math.max(1_000, deadline - Date.now())),
			});
			await page.waitForLoadState("domcontentloaded", {
				timeout: Math.min(10_000, Math.max(1_000, deadline - Date.now())),
			});
			return;
		} catch (error) {
			lastError = error;
			if (!isConnectionRefusedError(error)) {
				// Retry transient navigation issues as well.
			}
			await sleep(RETRY_INTERVAL_MS);
		}
	}
	throw lastError ?? new Error(`Navigation to ${route} failed before timeout.`);
};

const findLoginFields = async (page: import("@playwright/test").Page) => {
	const emailCandidates = [
		page.getByLabel(/E-?Mail/i).first(),
		page.locator('input[name="email"]').first(),
		page.locator("input#email").first(),
		page.locator('input[type="email"]').first(),
	];
	const passwordCandidates = [
		page.getByLabel(/Passwort/i).first(),
		page.locator('input[name="password"]').first(),
		page.locator("input#password").first(),
		page.locator('input[type="password"]').first(),
	];

	for (const emailInput of emailCandidates) {
		const emailVisible = await emailInput
			.isVisible({ timeout: 2_500 })
			.catch(() => false);
		if (!emailVisible) continue;
		for (const passwordInput of passwordCandidates) {
			const passwordVisible = await passwordInput
				.isVisible({ timeout: 2_500 })
				.catch(() => false);
			if (passwordVisible) {
				return { emailInput, passwordInput };
			}
		}
	}
	return null;
};

const ensureLoginFormVisible = async (
	page: import("@playwright/test").Page,
) => {
	const deadline = Date.now() + SERVER_WAIT_TIMEOUT;
	const routeAttempts = ["/de/login", "/de/account", "/de/map"];
	for (const route of routeAttempts) {
		await gotoWithRetry(page, route, deadline);
		await page.waitForLoadState("networkidle", {
			timeout: Math.min(LOGIN_TIMEOUT, Math.max(2_000, deadline - Date.now())),
		});

		// If the session is already valid and we are on account, skip login form lookup.
		if (/\/de\/account(?:\/.*)?$/.test(page.url())) {
			return null;
		}

		let fields = await findLoginFields(page);
		if (fields) return fields;

		if (route === "/de/map") {
			const userButton = page
				.locator(
					'button[aria-label="user.title"], button[aria-label*="Konto"], button[aria-label*="user"]',
				)
				.first();
			const canOpenUser = await userButton
				.isVisible({ timeout: 3_000 })
				.catch(() => false);
			if (canOpenUser) {
				await userButton.click({ force: true });
				await page
					.waitForURL(/\/[a-z]{2}\/(?:login|account)(?:\/.*)?$/, {
						timeout: 10_000,
					})
					.catch(() => undefined);
				fields = await findLoginFields(page);
				if (fields) return fields;
			}
		}
	}

	throw new Error(
		`Login form was not visible. Last URL: ${page.url()}. Expected visible email/password inputs.`,
	);
};

const saveStorageState = async ({
	baseURL,
	statePath,
	label,
	email,
	password,
}: SaveStorageOptions) => {
	const browser = await chromium.launch();
	const context = await browser.newContext({ baseURL });

	try {
		if (!email || !password) {
			await context.storageState({ path: statePath });
			return;
		}

		try {
			const page = await context.newPage();
			const fields = await ensureLoginFormVisible(page);
			if (!fields) {
				console.warn(
					`[global-setup] No login form found for ${label}, URL: ${page.url()}`,
				);
				await context.storageState({ path: statePath });
				return;
			}
			const { emailInput, passwordInput } = fields;
			await emailInput.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
			await emailInput.fill(email);

			await passwordInput.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
			await passwordInput.fill(password);

			console.log(
				`[global-setup] Submitting login for ${label} at ${page.url()}`,
			);
			const loginButton = page
				.getByRole("button", { name: /Anmelden/i })
				.or(page.locator('button[type="submit"]').first());
			await Promise.all([
				page.waitForURL(/\/de\/account(\/.*)?$/, { timeout: LOGIN_TIMEOUT }),
				loginButton.click(),
			]);
			console.log(
				`[global-setup] ${label} login successful, URL: ${page.url()}`,
			);
		} catch (error) {
			console.warn(
				`[global-setup] Failed to create ${label} auth state, using anonymous state instead.`,
				error,
			);
		}

		await context.storageState({ path: statePath });
	} finally {
		await context.close();
		await browser.close();
	}
};

export default async function globalSetup(config: FullConfig) {
	await fs.mkdir(E2E_AUTH_DIR, { recursive: true });

	const projectBaseUrl =
		(typeof config.projects[0]?.use?.baseURL === "string" &&
			config.projects[0].use.baseURL) ||
		process.env.PLAYWRIGHT_BASE_URL ||
		"http://localhost:3010";

	await saveStorageState({
		baseURL: projectBaseUrl,
		statePath: USER_STORAGE_STATE,
		label: "user",
		email: process.env.E2E_USER_EMAIL,
		password: process.env.E2E_USER_PASSWORD,
	});

	await saveStorageState({
		baseURL: projectBaseUrl,
		statePath: ADMIN_STORAGE_STATE,
		label: "admin",
		email: process.env.E2E_ADMIN_EMAIL,
		password: process.env.E2E_ADMIN_PASSWORD,
	});
}
