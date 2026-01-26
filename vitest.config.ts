import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: [
			{ find: "@", replacement: path.resolve(__dirname, "src") },
			{
				find: /^.+\\.svg$/,
				replacement: path.resolve(__dirname, "tests/mocks/svgMock.tsx"),
			},
		],
	},
	test: {
		environment: "jsdom",
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
		setupFiles: ["./tests/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
	},
});
