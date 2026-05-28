import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AccountAutoRefresh,
	isAccountAutoRefreshPathEnabled,
} from "@/components/Account/AccountAutoRefresh";

const pathnameState = {
	value: "/de/account/activity",
};

const setAccountData = vi.fn();
const getAccountRefreshDataMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: { setAccountData: typeof setAccountData }) => unknown,
	) => selector({ setAccountData }),
}));

vi.mock("@/server/actions/account", () => ({
	getAccountRefreshData: (...args: unknown[]) =>
		getAccountRefreshDataMock(...args),
}));

describe("AccountAutoRefresh", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Advance past any lastRefreshedAt timestamps set in previous tests
		vi.advanceTimersByTime(60_000);
		pathnameState.value = "/de/account/activity";
		setAccountData.mockReset();
		getAccountRefreshDataMock.mockReset().mockResolvedValue({
			users: [],
			groups: [],
			roles: [],
			categories: [],
			institutions: [],
			submissions: [],
			entityAudits: [],
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

	it("polls on stable dashboard routes", async () => {
		render(<AccountAutoRefresh intervalMs={1_000} />);

		// Immediate refresh fires on mount; interval fires after 1000ms → 2 calls total
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(getAccountRefreshDataMock).toHaveBeenCalledTimes(2);
		expect(setAccountData).toHaveBeenCalledWith(
			expect.objectContaining({
				users: [],
				groups: [],
				roles: [],
				categories: [],
				institutions: [],
				submissions: [],
				entityAudits: [],
			}),
		);
	});

	it("does not poll on institution routes", async () => {
		pathnameState.value = "/de/account/institutions/42/edit";

		render(<AccountAutoRefresh intervalMs={1_000} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});

		expect(getAccountRefreshDataMock).not.toHaveBeenCalled();
	});

	it("applies partial refresh payloads without overwriting missing slices", async () => {
		getAccountRefreshDataMock.mockResolvedValueOnce({
			users: [{ id: "user-1" }],
			submissions: [{ id: 5 }],
		});

		render(<AccountAutoRefresh intervalMs={1_000} />);

		// Only let the immediate refresh settle (no interval advance)
		await act(async () => {});

		expect(setAccountData).toHaveBeenCalledWith({
			users: [{ id: "user-1" }],
			submissions: [{ id: 5 }],
		});
	});

	it("enables polling only for stable account tabs", () => {
		expect(isAccountAutoRefreshPathEnabled("/de/account/")).toBe(true);
		expect(isAccountAutoRefreshPathEnabled("/de/account/activity")).toBe(true);
		expect(isAccountAutoRefreshPathEnabled("/de/account/users")).toBe(true);
		expect(isAccountAutoRefreshPathEnabled("/de/account/institutions")).toBe(
			false,
		);
		expect(
			isAccountAutoRefreshPathEnabled("/de/account/institutions/42/edit"),
		).toBe(false);
		expect(isAccountAutoRefreshPathEnabled("/de/account/submissions/42")).toBe(
			false,
		);
	});
});
