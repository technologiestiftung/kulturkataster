import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Filter from "@/components/Filter/Filter";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import type { Institution } from "@/types";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "de" } }),
}));

vi.mock("@/icons/filter.svg", () => ({ default: () => null }));
vi.mock("@/icons/search.svg", () => ({ default: () => null }));
vi.mock("@/icons/close.svg", () => ({ default: () => null }));
vi.mock("@/icons/chevron-down.svg", () => ({ default: () => null }));
vi.mock("@/icons/chevron-up.svg", () => ({ default: () => null }));
vi.mock("@/icons/chevron-left.svg", () => ({ default: () => null }));
vi.mock("@/icons/eye.svg", () => ({ default: () => null }));
vi.mock("@/icons/eye-off.svg", () => ({ default: () => null }));
vi.mock("@/icons/minus.svg", () => ({ default: () => null }));

const initialState = useInstitutionStore.getState();
const cultureIndexHeading = () =>
	screen.queryByRole("heading", { name: "content.filter.cultureIndex.title" });

const hydrate = (institutions: Institution[]) =>
	useInstitutionStore.getState().hydratePublicData({
		institutions,
		categories: [],
		districts: ["Mitte"],
	});

describe("Filter culture index section", () => {
	beforeEach(() => {
		// Keep the component from fetching real data on mount.
		useInstitutionStore.setState({ initializePublicData: vi.fn() });
	});
	afterEach(() => {
		useInstitutionStore.setState(initialState, true);
	});

	it("is hidden when the guest-redacted data lacks culture_index", () => {
		hydrate([{ id: 1, name: "Guest view" } as unknown as Institution]);
		render(<Filter />);

		expect(screen.getByText("content.filter.title")).toBeInTheDocument();
		expect(cultureIndexHeading()).toBeNull();
	});

	it("is shown when the data carries culture_index", () => {
		hydrate([
			{ id: 1, name: "Readable", culture_index: 42 } as unknown as Institution,
		]);
		render(<Filter />);

		expect(cultureIndexHeading()).toBeInTheDocument();
	});

	it("disappears and stops filtering when refreshed data drops culture_index", () => {
		const readable = {
			id: 1,
			name: "Readable",
			culture_index: 90,
		} as unknown as Institution;
		const redacted = { id: 1, name: "Readable" } as unknown as Institution;
		hydrate([readable]);
		render(<Filter />);
		act(() => {
			const { filters, setFilters } = useInstitutionStore.getState();
			setFilters({ ...filters, culture_index_ranges: ["0-20"] });
		});
		expect(useInstitutionStore.getState().filteredInstitutions).toEqual([]);

		act(() => useInstitutionStore.getState().setInstitutions([redacted]));

		expect(cultureIndexHeading()).toBeNull();
		expect(useInstitutionStore.getState().filteredInstitutions).toEqual([
			redacted,
		]);
	});
});
