import { afterEach, describe, expect, it } from "vitest";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import type { Institution } from "@/types";

const initialState = useInstitutionStore.getState();

afterEach(() => {
	useInstitutionStore.setState(initialState, true);
});

describe("institutionStore hydratePublicData", () => {
	it("clears loading and error on successful hydration", () => {
		useInstitutionStore.setState({
			...useInstitutionStore.getState(),
			isLoading: true,
			error: "stale error",
		});

		useInstitutionStore.getState().hydratePublicData({
			institutions: [],
			categories: [],
			districts: [],
		});

		const state = useInstitutionStore.getState();
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});
});

describe("institutionStore culture index filter", () => {
	const redacted = { id: 1, name: "Redacted" } as unknown as Institution;
	const readable = {
		id: 2,
		name: "Readable",
		culture_index: 90,
	} as unknown as Institution;

	const activateRange = () => {
		const { filters, setFilters } = useInstitutionStore.getState();
		setFilters({ ...filters, culture_index_ranges: ["81-100"] });
	};

	it("clears active ranges when hydrated institutions lack culture_index", () => {
		activateRange();

		useInstitutionStore.getState().hydratePublicData({
			institutions: [redacted],
			categories: [],
			districts: [],
		});

		const state = useInstitutionStore.getState();
		expect(state.filters.culture_index_ranges).toEqual([]);
		expect(state.filteredInstitutions).toEqual([redacted]);
	});

	it("clears active ranges when set institutions lack culture_index", () => {
		activateRange();

		useInstitutionStore.getState().setInstitutions([redacted]);

		const state = useInstitutionStore.getState();
		expect(state.filters.culture_index_ranges).toEqual([]);
		expect(state.filteredInstitutions).toEqual([redacted]);
	});

	it("keeps active ranges when institutions carry culture_index", () => {
		activateRange();

		useInstitutionStore.getState().hydratePublicData({
			institutions: [redacted, readable],
			categories: [],
			districts: [],
		});
		expect(useInstitutionStore.getState().filters.culture_index_ranges).toEqual(
			["81-100"],
		);

		useInstitutionStore.getState().setInstitutions([readable]);
		expect(useInstitutionStore.getState().filters.culture_index_ranges).toEqual(
			["81-100"],
		);
	});
});
