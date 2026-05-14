const isObjectLike = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

export const areStoreSliceValuesEqual = (
	left: unknown,
	right: unknown,
): boolean => {
	if (Object.is(left, right)) return true;

	if (left instanceof Date && right instanceof Date) {
		return left.getTime() === right.getTime();
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right)) return false;
		if (left.length !== right.length) return false;
		return left.every((value, index) =>
			areStoreSliceValuesEqual(value, right[index]),
		);
	}

	if (!isObjectLike(left) || !isObjectLike(right)) {
		return false;
	}

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length) return false;

	return leftKeys.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(right, key) &&
			areStoreSliceValuesEqual(left[key], right[key]),
	);
};
