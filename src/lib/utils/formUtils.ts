type SubmitLabelText = {
	default: string;
	loading: string;
};

const getSubmitLabel = (
	mode: string,
	submitting: boolean,
	labels: Record<string, SubmitLabelText>,
) => {
	const resolved = labels[mode] ?? labels.default;
	if (!resolved) return "";
	return submitting ? resolved.loading : resolved.default;
};

const toNumberArray = (value: unknown): number[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
};

const toOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value !== "string") return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalText = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => String(item))
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};

const splitStreetLine = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return { street: "", streetNumber: "" };
	}

	const parts = trimmed.split(/\s+/);
	const lastPart = parts[parts.length - 1];
	if (parts.length > 1 && /\d/.test(lastPart)) {
		return {
			street: parts.slice(0, -1).join(" "),
			streetNumber: lastPart,
		};
	}

	return { street: trimmed, streetNumber: "" };
};

const buildStreetLine = (
	street?: string | null,
	streetNumber?: string | null,
) => {
	const parts = [street?.trim(), streetNumber?.trim()].filter(Boolean);
	return parts.join(" ");
};

export {
	getSubmitLabel,
	toNumberArray,
	toOptionalNumber,
	toOptionalText,
	toStringArray,
	splitStreetLine,
	buildStreetLine,
};
