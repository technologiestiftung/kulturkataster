import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		useCache: true,
	},
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},
	webpack(config) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const fileLoaderRule = config.module.rules.find((rule: any) =>
			rule.test?.test?.(".svg"),
		);
		config.module.rules.push(
			{
				test: /\.svg$/i,
				resourceQuery: /raw/,
				type: "asset/source",
			},
			{
				...fileLoaderRule,
				test: /\.svg$/i,
				resourceQuery: /url/,
			},
			{
				test: /\.svg$/i,
				issuer: fileLoaderRule.issuer,
				resourceQuery: { not: [/raw/, /url/] },
				use: ["@svgr/webpack"],
			},
		);
		fileLoaderRule.exclude = /\.svg$/i;
		return config;
	},
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "gdi.berlin.de",
			},
			{
				protocol: "https",
				hostname: "kulturkataster.netlify.app",
			},
			{
				protocol: "https",
				hostname: "*kulturkataster.netlify.app",
			},
		],
	},
	devIndicators: false,
};

export default nextConfig;
