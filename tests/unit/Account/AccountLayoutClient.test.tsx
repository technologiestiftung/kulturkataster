import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Profile } from "@/types";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { logout } from "@/server/actions/auth";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const prefetchMock = vi.fn();
let pathnameMock = "/de/account/activity";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		refresh: refreshMock,
		prefetch: prefetchMock,
	}),
	usePathname: () => pathnameMock,
}));

vi.mock("next/image", () => ({
	default: () => null,
}));

vi.mock("@/icons/settings.svg", () => ({ default: () => null }));
vi.mock("@/icons/edit.svg", () => ({ default: () => null }));

vi.mock("@/components/Account/AccountAlertDialog", () => ({
	AccountAlertDialog: () => null,
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { name?: string; defaultValue?: string }) => {
			const normalizedKey = key.replace(/^common\./, "");

			if (normalizedKey === "auth.account.welcome") {
				return `Willkommen, ${options?.name ?? ""}!`;
			}
			if (normalizedKey === "auth.account.subtitle") {
				return "Meine Profilübersicht";
			}
			const dictionary: Record<string, string> = {
				"auth.account.actions.addInstitution": "Add new institution",
				"auth.account.actions.profileSettings": "Profile settings",
				"auth.account.actions.faq": "FAQ",
				"auth.account.actions.refreshData": "Refresh data",
				"auth.account.actions.logout": "Logout",
				"auth.account.tabs.activity": "Activity",
				"auth.account.tabs.institutions": "Institutions",
				"auth.account.tabs.users": "Users",
				"auth.account.tabs.groups": "Groups",
				"auth.account.tabs.roles": "Roles",
				"auth.account.tabs.categories": "Categories",
			};
			return (
				dictionary[normalizedKey] ?? options?.defaultValue ?? normalizedKey
			);
		},
	}),
}));

vi.mock("@/server/actions/auth", () => ({
	logout: vi.fn(),
}));

const mockedLogout = vi.mocked(logout);

const currentProfile = {
	id: "user-1",
	email: "max@example.com",
	first_name: "Max",
	last_name: "Mustermann",
} as Profile;

describe("AccountLayoutClient", () => {
	beforeEach(() => {
		pushMock.mockReset();
		refreshMock.mockReset();
		mockedLogout.mockReset();
		pathnameMock = "/de/account/activity";
	});

	it("greets by profile name and renders dashboard tabs", () => {
		render(
			<AccountLayoutClient
				currentProfile={currentProfile}
				allowedTabs={[
					"activity",
					"institutions",
					"users",
					"groups",
					"roles",
					"categories",
				]}
			>
				<div>Activity Content</div>
			</AccountLayoutClient>,
		);

		expect(screen.getByText("Willkommen, Max Mustermann!")).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute(
			"data-state",
			"active",
		);
		expect(
			screen.getByRole("tab", { name: "Institutions" }),
		).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Groups" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Roles" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Categories" })).toBeInTheDocument();
		expect(screen.getByText("Activity Content")).toBeInTheDocument();
	});

	it("uses deep link pathname to keep current tab active after refresh", () => {
		pathnameMock = "/de/account/groups";

		render(
			<AccountLayoutClient
				currentProfile={currentProfile}
				allowedTabs={["activity", "institutions", "groups"]}
			>
				<div>Groups Content</div>
			</AccountLayoutClient>,
		);

		expect(screen.getByRole("tab", { name: "Groups" })).toHaveAttribute(
			"data-state",
			"active",
		);
		expect(screen.getByText("Groups Content")).toBeInTheDocument();
	});

	it("renders dashboard menu actions and routes correctly", async () => {
		mockedLogout.mockResolvedValue({ ok: true });

		render(
			<AccountLayoutClient
				currentProfile={currentProfile}
				allowedTabs={["activity"]}
			>
				<div>Dashboard Content</div>
			</AccountLayoutClient>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Profile settings" }));
		expect(pushMock).toHaveBeenCalledWith("/de/account/edit");

		fireEvent.click(screen.getByRole("button", { name: "FAQ" }));
		expect(pushMock).toHaveBeenCalledWith("/de/account/faq");

		fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
		expect(refreshMock).toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Logout" }));

		await waitFor(() => {
			expect(mockedLogout).toHaveBeenCalled();
			expect(pushMock).toHaveBeenCalledWith("/de/");
		});
	});
});
