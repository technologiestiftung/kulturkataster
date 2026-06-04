import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { UsersTable } from "@/components/Users/UsersTable";

const pushMock = vi.fn();
const dataTableMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) => {
			const normalizedKey = key.replace(/^content\./, "");
			return (
				options?.defaultValue ??
				{
					"userTable.actions.add": "Nutzer*in hinzufügen",
					"userTable.searchPlaceholder": "Nutzer*innen suchen...",
					"userTable.actions.reviewClaims": "Claims prüfen",
				}[normalizedKey] ??
				normalizedKey
			);
		},
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: { users: Array<Record<string, unknown>> }) => unknown,
	) =>
		selector({
			users: [
				{
					id: "user-1",
					email: "editor@example.com",
					first_name: "Ada",
					last_name: "Lovelace",
					status: "active",
					role: { id: 1, name: "Editor" },
					groups: [{ id: 5, name: "Group A" }],
					institutions: [{ id: 10, name: "Institution A" }],
					submissions: [{ id: 1, type: "claim" }],
					compliance: true,
				},
			],
		}),
}));

vi.mock("@/components/DataTable", () => ({
	DataTable: ({ config }: { config: unknown }) => {
		dataTableMock(config);
		return null;
	},
}));

describe("UsersTable", () => {
	beforeEach(() => {
		pushMock.mockReset();
		dataTableMock.mockReset();
	});

	it("configures users table with search, add, edit and review actions", () => {
		render(<UsersTable />);

		expect(dataTableMock).toHaveBeenCalledTimes(1);
		const config = dataTableMock.mock.calls[0][0] as {
			columns: Array<{ id?: string; accessorKey?: string }>;
			data: Array<{ id: string; submissions?: Array<{ type: string }> }>;
			searchable: boolean;
			searchPlaceholder: string;
			primaryButton: { onClick: () => void; label: string };
			onEdit: (row: { id: string }) => void;
			onReview: (row: { id: string }) => void;
			getCanReview: (row: { submissions?: Array<{ type: string }> }) => boolean;
			reviewAriaLabel: string;
		};

		expect(config.searchable).toBe(true);
		expect(config.searchPlaceholder).toBe("Nutzer*innen suchen...");
		expect(
			config.columns.map((column) => column.id ?? column.accessorKey),
		).not.toContain("compliance");
		expect(config.data).toHaveLength(1);
		expect(config.primaryButton.label).toBe("Nutzer*in hinzufügen");
		expect(config.reviewAriaLabel).toBe("Claims prüfen");

		config.primaryButton.onClick();
		expect(pushMock).toHaveBeenCalledWith("/de/account/users/new");

		config.onEdit({ id: "user-1" });
		expect(pushMock).toHaveBeenCalledWith("/de/account/users/user-1/edit");

		config.onReview({ id: "user-1" });
		expect(pushMock).toHaveBeenCalledWith("/de/account/users/user-1/review");

		expect(config.getCanReview({ submissions: [{ type: "claim" }] })).toBe(
			true,
		);
		expect(config.getCanReview({ submissions: [] })).toBe(false);
	});
});
