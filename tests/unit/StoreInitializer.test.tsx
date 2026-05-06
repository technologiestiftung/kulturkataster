import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreInitializer } from "@/components/StoreInitializer";

const pathnameState = {
	value: "/de/info",
};

const hydratePublicData = vi.fn();
const initializePublicData = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			hydratePublicData: typeof hydratePublicData;
			initializePublicData: typeof initializePublicData;
		}) => unknown,
	) =>
		selector({
			hydratePublicData,
			initializePublicData,
		}),
}));

describe("StoreInitializer", () => {
	beforeEach(() => {
		pathnameState.value = "/de/info";
		hydratePublicData.mockReset();
		initializePublicData.mockReset();
	});

	it("hydrates the public institution store from provided server data", () => {
		const publicData = {
			institutions: [],
			categories: [],
			districts: [],
		};

		render(<StoreInitializer publicData={publicData} />);

		expect(hydratePublicData).toHaveBeenCalledWith(publicData);
		expect(initializePublicData).not.toHaveBeenCalled();
	});

	it("falls back to client initialization on public map/list routes", () => {
		pathnameState.value = "/de/map";

		render(<StoreInitializer />);

		expect(initializePublicData).toHaveBeenCalledTimes(1);
		expect(hydratePublicData).not.toHaveBeenCalled();
	});
});
