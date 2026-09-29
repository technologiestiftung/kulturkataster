import { beforeEach, describe, expect, it, vi } from "vitest";

const tags = vi.hoisted(() => ({
	rows: [] as { id: number; name: string }[],
	nextId: 100,
}));

vi.mock("@/server/data/tagRepo", () => ({
	tagRepo: {
		findByNamesIgnoringCase: async (names: string[]) =>
			tags.rows.filter((tag) =>
				names.some((name) => name.toLowerCase() === tag.name.toLowerCase()),
			),
		findByNames: async (names: string[]) =>
			tags.rows.filter((tag) => names.includes(tag.name)),
		createMany: async (names: string[]) => {
			names.forEach((name) => tags.rows.push({ id: tags.nextId++, name }));
			return { count: names.length };
		},
	},
}));

import { withNewTagsResolved } from "@/server/logic/institutionTags";

describe("withNewTagsResolved", () => {
	beforeEach(() => {
		tags.rows = [
			{ id: 1, name: "Urbane Praxis" },
			{ id: 2, name: "urbane Praxis" },
			{ id: 3, name: "Kunst" },
		];
		tags.nextId = 100;
	});

	it("leaves input without new tags untouched", async () => {
		const input = { tagIds: [3] };
		expect(await withNewTagsResolved(input)).toBe(input);
	});

	it("reuses existing tags, preferring the exact spelling, and creates only missing ones", async () => {
		const result = await withNewTagsResolved({
			tagIds: [3],
			newTagNames: ["urbane Praxis", "KUNST", "Jazz", "jazz"],
		});

		expect(result).toEqual({ tagIds: [3, 2, 100], newTagNames: undefined });
		expect(tags.rows.map((tag) => tag.name)).toEqual([
			"Urbane Praxis",
			"urbane Praxis",
			"Kunst",
			"Jazz",
		]);
	});
});
