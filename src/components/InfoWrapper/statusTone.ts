import { StatusLevelMap } from "./types";

export const getStatusAccentClass = (value: string | null | undefined) => {
	const normalizedValue = value || "unknown";
	const hasKnownStatusLevel = Object.hasOwn(StatusLevelMap, normalizedValue);

	if (normalizedValue === "in_use") return "bg-brand-light";
	if (normalizedValue === "permanently_closed") return "bg-alert";
	if (hasKnownStatusLevel) return "bg-chart-2";
	return "bg-alert";
};

export const getStatusCircleClass = (value: string | null | undefined) => {
	const normalizedValue = value || "unknown";
	const hasKnownStatusLevel = Object.hasOwn(StatusLevelMap, normalizedValue);

	if (normalizedValue === "in_use") return "bg-brand-default";
	if (normalizedValue === "permanently_closed") return "bg-alert";
	if (hasKnownStatusLevel) return "bg-chart-2";
	return "bg-alert";
};
