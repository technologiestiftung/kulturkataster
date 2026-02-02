import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: [
			{ find: "@", replacement: path.resolve(__dirname, "src") },
			{
				find: /^.+\\.svg$/,
				replacement: path.resolve(__dirname, "tests/helpers/svgMock.tsx"),
			},
		],
	},
	test: {
		environment: "node",
		include: [
			"tests/integration/**/*.test.ts",
			"tests/integration/**/*.test.tsx",
		],
		setupFiles: ["./tests/helpers/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
	},
});
