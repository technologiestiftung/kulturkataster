import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.test" });

const port = Number(process.env.PORT ?? 3010);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
	testDir: "tests/e2e",
	globalSetup: "./tests/e2e/global-setup.ts",
	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	workers: 1,
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	webServer: {
		command: `npm run build && npm run start -- -p ${port}`,
		url: `${baseURL}/de/login`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
	reporter: [["list"], ["html", { open: "never" }]],
});
