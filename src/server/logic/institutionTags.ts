import { tagRepo } from "@/server/data/tagRepo";

type TagInput = { tagIds?: number[]; newTagNames?: string[] };

const dedupeIgnoringCase = (names: string[]) => {
	const byKey = new Map<string, string>();
	names.forEach((name) => {
		const key = name.toLowerCase();
		if (!byKey.has(key)) byKey.set(key, name);
	});
	return Array.from(byKey.values());
};

/**
 * Turns tag names typed in the form into tag ids. A name that already exists in any
 * capitalisation reuses that tag (exact spelling first), so no new case duplicates appear.
 */
const resolveTagIds = async (names: string[]): Promise<number[]> => {
	const uniqueNames = dedupeIgnoringCase(names);
	const existing = await tagRepo.findByNamesIgnoringCase(uniqueNames);
	const findExisting = (name: string) =>
		existing.find((tag) => tag.name === name) ??
		existing.find((tag) => tag.name.toLowerCase() === name.toLowerCase());

	const missingNames = uniqueNames.filter((name) => !findExisting(name));
	if (missingNames.length > 0) await tagRepo.createMany(missingNames);
	const created =
		missingNames.length > 0 ? await tagRepo.findByNames(missingNames) : [];

	return uniqueNames
		.map(
			(name) => findExisting(name) ?? created.find((tag) => tag.name === name),
		)
		.filter((tag): tag is { id: number; name: string } => Boolean(tag))
		.map((tag) => tag.id);
};

/** Creates missing tags and merges them into tagIds; call only after authorizing the "tags" field. */
export const withNewTagsResolved = async <T extends TagInput>(
	input: T,
): Promise<T> => {
	if (!input.newTagNames?.length) return input;
	const newTagIds = await resolveTagIds(input.newTagNames);
	return {
		...input,
		tagIds: Array.from(new Set([...(input.tagIds ?? []), ...newTagIds])),
		newTagNames: undefined,
	};
};
