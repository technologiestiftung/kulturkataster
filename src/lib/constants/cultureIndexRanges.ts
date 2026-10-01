export const CULTURE_INDEX_RANGES = [
	{ key: "81-100", min: 81, max: 100, color: "fachfarben-dark-green" },
	{ key: "61-80", min: 61, max: 80, color: "fachfarben-green" },
	{ key: "41-60", min: 41, max: 60, color: "fachfarben-yellow" },
	{ key: "21-40", min: 21, max: 40, color: "fachfarben-orange" },
	{ key: "0-20", min: 0, max: 20, color: "fachfarben-pink" },
] as const;

export type CultureIndexRangeKey = (typeof CULTURE_INDEX_RANGES)[number]["key"];

export const getCultureIndexRangeForValue = (
	value: number | null | undefined,
): CultureIndexRangeKey | null => {
	if (value === null || value === undefined) return null;
	const range = CULTURE_INDEX_RANGES.find(
		(candidate) => value >= candidate.min && value <= candidate.max,
	);
	return range?.key ?? null;
};

export const getCultureIndexRangeColor = (
	rangeKey: CultureIndexRangeKey,
): string =>
	CULTURE_INDEX_RANGES.find((range) => range.key === rangeKey)?.color ??
	CULTURE_INDEX_RANGES[0].color;

const RANGE_BG_CLASS: Record<CultureIndexRangeKey, string> = {
	"81-100": "bg-fachfarben-dark-green",
	"61-80": "bg-fachfarben-green",
	"41-60": "bg-fachfarben-yellow",
	"21-40": "bg-fachfarben-orange",
	"0-20": "bg-fachfarben-pink",
};

export const getCultureIndexRangeBgClass = (
	rangeKey: CultureIndexRangeKey,
): string => RANGE_BG_CLASS[rangeKey];

export const createEmptyCultureIndexRangeCounts = (): Record<
	CultureIndexRangeKey,
	number
> =>
	CULTURE_INDEX_RANGES.reduce(
		(counts, range) => {
			counts[range.key] = 0;
			return counts;
		},
		{} as Record<CultureIndexRangeKey, number>,
	);

// The six dimensions the culture index is manually derived from. All but the
// global assessment are scores from 0 to 100; the global assessment is free text.
export const CULTURE_INDEX_SCORE_FIELDS = [
	"culture_index_location",
	"culture_index_property",
	"culture_index_financial",
	"culture_index_social_spatial",
	"culture_index_visibility",
] as const;

export const CULTURE_INDEX_DIMENSION_FIELDS = [
	...CULTURE_INDEX_SCORE_FIELDS,
	"culture_index_global",
] as const;

export type CultureIndexDimensionField =
	(typeof CULTURE_INDEX_DIMENSION_FIELDS)[number];
