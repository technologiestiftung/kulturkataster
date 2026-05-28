import { afterEach, describe, expect, it } from "vitest";
import { useInstitutionStore } from "@/lib/store/institutionStore";

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
