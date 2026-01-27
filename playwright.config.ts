import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.test" });

export default defineConfig({
	testDir: "e2e",
	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
	},
	reporter: [["list"], ["html", { open: "never" }]],
});
