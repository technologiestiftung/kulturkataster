import { defineConfig } from "vitest/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.test" });

export default defineConfig({
	resolve: {
		alias: [
			{ find: "@", replacement: path.resolve(__dirname, "src") },
			{
				find: /^.+\.svg$/,
				replacement: path.resolve(__dirname, "tests/helpers/svgMock.tsx"),
			},
		],
	},
	test: {
		environment: "jsdom",
		include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
		setupFiles: ["./tests/helpers/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
	},
});
