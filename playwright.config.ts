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
	forbidOnly: !!process.env.CI,
	maxFailures: 1,
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
	webServer: {
		command: `npm run build && \\
      rm -rf .next/standalone/.next/static && \\
      rm -rf .next/standalone/public && \\
      mkdir -p .next/standalone/.next && \\
      cp -R .next/static .next/standalone/.next/static && \\
      cp -R public .next/standalone/public && \\
      PORT=${port} node .next/standalone/server.js`,
		url: baseURL,
		timeout: 180_000,
		reuseExistingServer: !process.env.CI,
	},
	reporter: [["list"], ["html", { open: "never" }]],
});
