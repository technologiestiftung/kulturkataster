import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { technologiestiftungRules } from "./eslintRules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends(
		"next/core-web-vitals",
		"next/typescript",
	),
	{
		plugins: {
			"jsx-a11y": jsxA11y,
		},
		rules: {
			...jsxA11y.configs.recommended.rules,
		},
	},
	technologiestiftungRules,
];

export default eslintConfig;
