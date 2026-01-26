export const getResponsiveGridClass = (columns?: 1 | 2) =>
	columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

export const getSpanClass = (
	layout: { span?: "full" | "half" } | undefined,
	columns?: 1 | 2,
) => {
	if (columns !== 2) return "grid-cols-1 col-span-1";
	if (layout?.span === "half") return "col-span-1";
	if (layout?.span === "full") return "col-span-2";
	return undefined;
};
