import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	StoreAutoRefresh,
	isPublicAutoRefreshPathEnabled,
} from "@/components/StoreAutoRefresh";

const pathnameState = {
	value: "/de/map",
};

const setInstitutions = vi.fn();
const setCategories = vi.fn();
const setDistricts = vi.fn();

const getPublicInstitutionRefreshDataMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			setInstitutions: typeof setInstitutions;
			setCategories: typeof setCategories;
			setDistricts: typeof setDistricts;
		}) => unknown,
	) =>
		selector({
			setInstitutions,
			setCategories,
			setDistricts,
		}),
}));

vi.mock("@/server/actions/publicInstitutionData", () => ({
	getPublicInstitutionRefreshData: (...args: unknown[]) =>
		getPublicInstitutionRefreshDataMock(...args),
}));

describe("StoreAutoRefresh", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		pathnameState.value = "/de/map";
		setInstitutions.mockReset();
		setCategories.mockReset();
		setDistricts.mockReset();
		getPublicInstitutionRefreshDataMock.mockReset().mockResolvedValue({
			institutions: [],
			categories: [],
			districts: [],
		});
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			value: "visible",
		});
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it("polls on map routes", async () => {
		render(<StoreAutoRefresh intervalMs={1_000} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(getPublicInstitutionRefreshDataMock).toHaveBeenCalledTimes(2);
		expect(setInstitutions).toHaveBeenCalledWith([]);
		expect(setCategories).toHaveBeenCalledWith([]);
		expect(setDistricts).toHaveBeenCalledWith([]);
	});

	it("does not poll outside map/list/info/simpleLanguage routes", async () => {
		pathnameState.value = "/de/welcome";

		render(<StoreAutoRefresh intervalMs={1_000} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});

		expect(getPublicInstitutionRefreshDataMock).not.toHaveBeenCalled();
	});

	it("applies partial refresh payloads without overwriting missing slices", async () => {
		getPublicInstitutionRefreshDataMock.mockResolvedValue({
			institutions: [{ id: 1 }],
		});

		render(<StoreAutoRefresh intervalMs={1_000} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(setInstitutions).toHaveBeenCalledWith([{ id: 1 }]);
		expect(setCategories).not.toHaveBeenCalled();
		expect(setDistricts).not.toHaveBeenCalled();
	});

	it("normalizes localized map/list paths", () => {
		expect(isPublicAutoRefreshPathEnabled("/de/map")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/map/")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/map/institution/12")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/list")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/list/")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/info")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/simpleLanguage")).toBe(true);
		expect(isPublicAutoRefreshPathEnabled("/de/welcome")).toBe(false);
	});
});
