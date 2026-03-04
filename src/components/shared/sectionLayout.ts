import { FormWrapperFieldConfig } from "../FormWrapper/types";
import { InfoWrapperFieldConfig } from "../Institution";

export const getResponsiveGridClass = (columns?: 1 | 2) =>
	columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

export const getSpanClass = (
	layout: { span?: "full" | "half" } | undefined,
	columns?: 1 | 2,
) => {
	if (columns !== 2) return "grid-cols-1 col-span-1";
	if (layout?.span === "half") return "col-span-1";
	if (layout?.span === "full") return "md:col-span-2 col-span-1";
	return undefined;
};

export const getGridClass = (
	field: FormWrapperFieldConfig | InfoWrapperFieldConfig,
) => {
	return field.layout?.span === "full"
		? "col-span-1 md:col-span-2"
		: "col-span-1";
};
