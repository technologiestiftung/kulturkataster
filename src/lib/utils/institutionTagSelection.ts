// Tags typed in the form are kept as "new:<name>" until the place is saved.
const NEW_TAG_VALUE_PREFIX = "new:";

export const toNewTagValue = (name: string) =>
	`${NEW_TAG_VALUE_PREFIX}${name.trim()}`;

export const isNewTagValue = (value: string) =>
	value.startsWith(NEW_TAG_VALUE_PREFIX);

/** Splits the multiselect value into existing tag ids and names of tags to create on save. */
export function splitTagSelection(value: unknown): {
	tagIds: number[];
	newTagNames: string[];
} {
	const values = Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
	return {
		tagIds: values
			.filter((item) => !isNewTagValue(item))
			.map(Number)
			.filter((id) => Number.isInteger(id) && id > 0),
		newTagNames: values
			.filter(isNewTagValue)
			.map((item) => item.slice(NEW_TAG_VALUE_PREFIX.length).trim())
			.filter(Boolean),
	};
}
