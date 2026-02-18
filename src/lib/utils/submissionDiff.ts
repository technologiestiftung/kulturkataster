import { isEqual } from "lodash";

type JsonLike = Record<string, unknown>;

const isPlainObject = (value: unknown): value is JsonLike =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const pickComparableValue = (
	key: string,
	source: JsonLike | undefined,
): unknown => {
	if (!source) return undefined;
	if (key === "categoryIds") {
		if (Array.isArray(source.categoryIds)) return source.categoryIds;
		if (Array.isArray(source.categories)) {
			return source.categories
				.map((category) =>
					isPlainObject(category) ? Number(category.id) : Number.NaN,
				)
				.filter((id) => Number.isFinite(id));
		}
	}
	return source[key];
};

export const buildSubmissionDiff = (
	payload: JsonLike,
	source?: JsonLike,
): JsonLike | undefined => {
	const diff: JsonLike = {};

	for (const [key, value] of Object.entries(payload)) {
		const original = pickComparableValue(key, source);
		if (key === "address" && isPlainObject(value)) {
			const addressDiff: JsonLike = {};
			const originalAddress = isPlainObject(original)
				? (original as JsonLike)
				: undefined;
			for (const [addressKey, addressValue] of Object.entries(value)) {
				const originalAddressValue = originalAddress?.[addressKey];
				if (!isEqual(addressValue, originalAddressValue)) {
					addressDiff[addressKey] = addressValue;
				}
			}
			if (Object.keys(addressDiff).length > 0) {
				diff[key] = addressDiff;
			}
			continue;
		}
		if (!isEqual(value, original)) {
			diff[key] = value;
		}
	}

	return Object.keys(diff).length > 0 ? diff : undefined;
};
