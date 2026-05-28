export const parseHiddenMenuItems = (value: string | undefined) =>
	value
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean) ?? [];
