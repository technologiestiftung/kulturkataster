import { describe, expect, it, vi, beforeEach } from "vitest";

const searchInstitutionsMock = vi.fn().mockResolvedValue([]);
const fetchMock = vi.fn().mockResolvedValue({
	ok: true,
	json: async () => ({ features: [] }),
});
global.fetch = fetchMock as unknown as typeof fetch;
vi.mock("@/server/actions/institutions", () => ({
	searchInstitutions: (query: string) => searchInstitutionsMock(query),
}));

import { searchLocations } from "@/server/actions/searchLocations";

describe("searchLocations", () => {
	beforeEach(() => {
		searchInstitutionsMock.mockClear();
	});

	it("returns empty results for short query", async () => {
		const result = await searchLocations("a");
		expect(result).toEqual({
			institutions: [],
			addresses: [],
			allResults: [],
		});
	});

	it("calls institution search for valid query", async () => {
		await searchLocations("museum");
		expect(searchInstitutionsMock).toHaveBeenCalledWith("museum");
	});
});
