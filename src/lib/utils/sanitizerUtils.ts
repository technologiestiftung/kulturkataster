/**
 * Sanitizes address input to allow only characters typically found in addresses
 * @param input The raw user input string
 * @param strict If true, only allows alphanumeric characters and spaces
 * @returns Sanitized string with only allowed characters
 */
export const sanitizeAddressInput = (input: string, strict = false): string => {
	if (!input) return "";

	if (strict) {
		return input.replace(/[^a-zA-Z0-9\s]/g, "");
	}
	return input.replace(/[^a-zA-Z0-9\u00C0-\u017F\s,.'\-/#&()\u00B0+]/g, "");
};

/**
 * Normalizes a URL to ensure it has a proper protocol (https://)
 * @param url The raw URL string from backend or user input
 * @returns Normalized URL with https:// protocol if missing
 */
export const normalizeUrl = (url: string): string => {
	// Remove any leading/trailing whitespace
	const trimmedUrl = url.trim();

	// If URL already has a protocol, return as is
	if (trimmedUrl.match(/^https?:\/\//i)) {
		return trimmedUrl;
	}

	// If URL starts with www. or contains a domain, add https://
	if (
		trimmedUrl.match(
			/^(www\.|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,})/,
		)
	) {
		return `https://${trimmedUrl}`;
	}

	// If it looks like a domain without www, add https://
	if (trimmedUrl.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/)) {
		return `https://${trimmedUrl}`;
	}

	// For any other case, assume it needs https://
	return `https://${trimmedUrl}`;
};
