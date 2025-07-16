import type { NextConfig } from "next";
import { i18n, localePath, localeDetection } from "./next-i18next.config.js";

const nextConfig: NextConfig = {
	/* config options here */
	i18n,
	localePath,
	localeDetection,
};

export default nextConfig;
