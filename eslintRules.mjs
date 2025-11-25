export const technologiestiftungRules = {
	files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
	languageOptions: {
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
		globals: {
			React: "readonly",
			JSX: "readonly",
		},
	},
	settings: {
		react: {
			version: "detect",
		},
	},
	rules: {
		"prefer-const": "error",
		// "no-console": ["warn", { allow: ["warn", "error"] }],
		"no-undef": "error",
		"no-var": "error",
		"default-case": ["error", { commentPattern: "^no default$" }],
		"arrow-parens": "error",
		"default-param-last": ["warn"],
		eqeqeq: "error",
		"max-depth": ["error", 4],
		"max-params": ["warn", 3],
		complexity: ["warn", 10],
		"new-cap": [
			"error",
			{
				newIsCap: true,
				capIsNew: false,
				properties: false,
			},
		],
		"no-else-return": "error",
		"no-eval": "error",
		"no-implicit-globals": "error",
		"no-lonely-if": "error",
		"no-loop-func": "error",
		"no-multi-assign": "error",
		"no-multi-str": "error",
		"no-nested-ternary": "warn",
		"no-new": "error",
		"no-param-reassign": "error",
		"no-return-assign": "error",
		"no-shadow": "error",
		"no-throw-literal": "error",
		"no-unneeded-ternary": "error",
		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
			},
		],
		"react-hooks/exhaustive-deps": "off",
		"react-hooks/set-state-in-effect": "warn", // React 19 rule - set to warn for now
		"react-hooks/static-components": "warn", // React 19 rule - set to warn for now
		"react-hooks/purity": "warn", // React 19 rule - set to warn for now
	},
};
