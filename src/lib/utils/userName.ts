export const splitDisplayName = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return { firstName: undefined, lastName: undefined };
	}
	const parts = trimmed.split(/\s+/);
	const firstName = parts.shift() ?? "";
	const lastName = parts.length > 0 ? parts.join(" ") : undefined;
	return { firstName, lastName };
};
