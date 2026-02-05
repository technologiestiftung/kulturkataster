export function localePath(locale: string | undefined, path: string): string {
	if (!path) return path;

	// Keep external/special schemes untouched.
	if (
		/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(path) ||
		path.startsWith("mailto:") ||
		path.startsWith("tel:")
	) {
		return path;
	}

	if (!locale) return path;

	const hashIndex = path.indexOf("#");
	const queryIndex = path.indexOf("?");
	let cutIndex: number;
	if (hashIndex === -1) {
		cutIndex = queryIndex;
	} else if (queryIndex === -1) {
		cutIndex = hashIndex;
	} else {
		cutIndex = Math.min(hashIndex, queryIndex);
	}
	const pathname = cutIndex === -1 ? path : path.slice(0, cutIndex);
	const suffix = cutIndex === -1 ? "" : path.slice(cutIndex);
	const normalizedPathname = pathname.startsWith("/")
		? pathname
		: `/${pathname}`;

	if (
		normalizedPathname === `/${locale}` ||
		normalizedPathname.startsWith(`/${locale}/`)
	) {
		return `${normalizedPathname}${suffix}`;
	}

	return `/${locale}${normalizedPathname}${suffix}`;
}
