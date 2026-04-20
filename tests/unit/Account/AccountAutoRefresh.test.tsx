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

const getUsersMock = vi.fn();
const getGroupsMock = vi.fn();
const getRolesMock = vi.fn();
const getCategoriesMock = vi.fn();
const getMyInstitutionsMock = vi.fn();
const getSubmissionsMock = vi.fn();
const getEntityAuditsMock = vi.fn();

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

vi.mock("@/server/actions/users", () => ({
	getUsers: (...args: unknown[]) => getUsersMock(...args),
}));

vi.mock("@/server/actions/groups", () => ({
	getGroups: (...args: unknown[]) => getGroupsMock(...args),
}));

vi.mock("@/server/actions/roles", () => ({
	getRoles: (...args: unknown[]) => getRolesMock(...args),
}));

vi.mock("@/server/actions/categories", () => ({
	getCategories: (...args: unknown[]) => getCategoriesMock(...args),
}));

vi.mock("@/server/actions/institutions", () => ({
	getMyInstitutions: (...args: unknown[]) => getMyInstitutionsMock(...args),
}));

vi.mock("@/server/actions/submissions", () => ({
	getSubmissions: (...args: unknown[]) => getSubmissionsMock(...args),
}));

vi.mock("@/server/actions/entityAudits", () => ({
	getEntityAudits: (...args: unknown[]) => getEntityAuditsMock(...args),
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
		getUsersMock.mockReset().mockResolvedValue([]);
		getGroupsMock.mockReset().mockResolvedValue([]);
		getRolesMock.mockReset().mockResolvedValue([]);
		getCategoriesMock.mockReset().mockResolvedValue([]);
		getMyInstitutionsMock.mockReset().mockResolvedValue([]);
		getSubmissionsMock.mockReset().mockResolvedValue([]);
		getEntityAuditsMock.mockReset().mockResolvedValue([]);
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

		expect(getUsersMock).toHaveBeenCalledTimes(1);
		expect(getGroupsMock).toHaveBeenCalledTimes(1);
		expect(getRolesMock).toHaveBeenCalledTimes(1);
		expect(getCategoriesMock).toHaveBeenCalledTimes(1);
		expect(getMyInstitutionsMock).toHaveBeenCalledTimes(1);
		expect(getSubmissionsMock).toHaveBeenCalledTimes(1);
		expect(getEntityAuditsMock).toHaveBeenCalledTimes(1);
	});

	it("does not poll on institution routes", async () => {
		pathnameState.value = "/de/account/institutions/42/edit";

		render(<AccountAutoRefresh intervalMs={1_000} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});

		expect(getUsersMock).not.toHaveBeenCalled();
		expect(getGroupsMock).not.toHaveBeenCalled();
		expect(getRolesMock).not.toHaveBeenCalled();
		expect(getCategoriesMock).not.toHaveBeenCalled();
		expect(getMyInstitutionsMock).not.toHaveBeenCalled();
		expect(getSubmissionsMock).not.toHaveBeenCalled();
		expect(getEntityAuditsMock).not.toHaveBeenCalled();
	});

	it("enables polling only for stable account tabs", () => {
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
