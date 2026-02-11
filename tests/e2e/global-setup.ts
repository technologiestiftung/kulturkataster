import fs from "node:fs/promises";
import { chromium, type FullConfig } from "@playwright/test";
import {
	ADMIN_STORAGE_STATE,
	E2E_AUTH_DIR,
	USER_STORAGE_STATE,
} from "../helpers/e2eAuthState";

const LOGIN_TIMEOUT = 30_000;

type SaveStorageOptions = {
	baseURL: string,
	statePath: string,
	label: string,
	email?: string,
	password?: string,
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
			await page.goto("/de/login", {
				waitUntil: "domcontentloaded",
				timeout: LOGIN_TIMEOUT,
			});

			const emailInput = page.locator("input#email");
			await emailInput.waitFor({ state: "visible", timeout: 15_000 });
			await emailInput.fill(email);

			const passwordInput = page.getByRole("textbox", { name: /^Passwort/ });
			await passwordInput.waitFor({ state: "visible", timeout: 15_000 });
			await passwordInput.fill(password);

			const loginButton = page.getByRole("button", { name: "Anmelden" });
			await Promise.all([
				page.waitForURL(/\/de\/account(\/.*)?$/, { timeout: LOGIN_TIMEOUT }),
				loginButton.click(),
			]);
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
		"http://localhost:3000";

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
