import type { NextConfig } from "next";
import { i18n, localeDetection, localePath } from "./next-i18next.config.js";

const nextConfig: NextConfig = {
	/* config options here */
	i18n,
	localePath,
	localeDetection,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "gdi.berlin.de",
			},
		],
	},
};

export default nextConfig;
