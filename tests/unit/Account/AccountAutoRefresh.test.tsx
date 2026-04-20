import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AccountAutoRefresh,
	isAccountAutoRefreshPathEnabled,
} from "@/components/Account/AccountAutoRefresh";

const pathnameState = {
	value: "/de/account/activity",
};

const setUsers = vi.fn();
const setGroups = vi.fn();
const setRoles = vi.fn();
const setCategories = vi.fn();
const setInstitutions = vi.fn();
const setSubmissions = vi.fn();
const setEntityAudits = vi.fn();

const getAccountRefreshDataMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			setUsers: typeof setUsers;
			setGroups: typeof setGroups;
			setRoles: typeof setRoles;
			setCategories: typeof setCategories;
			setInstitutions: typeof setInstitutions;
			setSubmissions: typeof setSubmissions;
			setEntityAudits: typeof setEntityAudits;
		}) => unknown,
	) =>
		selector({
			setUsers,
			setGroups,
			setRoles,
			setCategories,
			setInstitutions,
			setSubmissions,
			setEntityAudits,
		}),
}));

vi.mock("@/server/actions/account", () => ({
	getAccountRefreshData: (...args: unknown[]) =>
		getAccountRefreshDataMock(...args),
}));

describe("AccountAutoRefresh", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		pathnameState.value = "/de/account/activity";
		setUsers.mockReset();
		setGroups.mockReset();
		setRoles.mockReset();
		setCategories.mockReset();
		setInstitutions.mockReset();
		setSubmissions.mockReset();
		setEntityAudits.mockReset();
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

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(getAccountRefreshDataMock).toHaveBeenCalledTimes(1);
		expect(setUsers).toHaveBeenCalledWith([]);
		expect(setGroups).toHaveBeenCalledWith([]);
		expect(setRoles).toHaveBeenCalledWith([]);
		expect(setCategories).toHaveBeenCalledWith([]);
		expect(setInstitutions).toHaveBeenCalledWith([]);
		expect(setSubmissions).toHaveBeenCalledWith([]);
		expect(setEntityAudits).toHaveBeenCalledWith([]);
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

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(setUsers).toHaveBeenCalledWith([{ id: "user-1" }]);
		expect(setSubmissions).toHaveBeenCalledWith([{ id: 5 }]);
		expect(setGroups).not.toHaveBeenCalled();
		expect(setRoles).not.toHaveBeenCalled();
		expect(setCategories).not.toHaveBeenCalled();
		expect(setInstitutions).not.toHaveBeenCalled();
		expect(setEntityAudits).not.toHaveBeenCalled();
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
