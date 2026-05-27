import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { GroupsTable } from "@/components/Groups/GroupsTable";

const pushMock = vi.fn();
const dataTableMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) => {
			const normalizedKey = key.replace(/^content\./, "");
			return (
				options?.defaultValue ??
				{
					"groupTable.actions.add": "Gruppe erstellen",
					"groupTable.searchPlaceholder": "Gruppen durchsuchen...",
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
		selector: (state: { groups: Array<Record<string, unknown>> }) => unknown,
	) =>
		selector({
			groups: [
				{
					id: 9,
					name: "Editors",
					description: "Editors group",
					created_at: new Date("2025-01-01"),
					updated_at: new Date("2025-01-02"),
					users: [],
					institutions: [],
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

describe("GroupsTable", () => {
	beforeEach(() => {
		pushMock.mockReset();
		dataTableMock.mockReset();
	});

	it("configures table with search, add action and row edit action", () => {
		render(<GroupsTable />);

		expect(dataTableMock).toHaveBeenCalledTimes(1);
		const config = dataTableMock.mock.calls[0][0] as {
			data: Array<{ id: number; name: string }>;
			searchable: boolean;
			searchPlaceholder: string;
			primaryButton: { onClick: () => void; label: string };
			onEdit: (row: { id: number }) => void;
		};

		expect(config.searchable).toBe(true);
		expect(config.searchPlaceholder).toBe("Gruppen durchsuchen...");
		expect(config.data).toHaveLength(1);
		expect(config.primaryButton.label).toBe("Gruppe erstellen");

		config.primaryButton.onClick();
		expect(pushMock).toHaveBeenCalledWith("/de/account/groups/new");

		config.onEdit({ id: 9 });
		expect(pushMock).toHaveBeenCalledWith("/de/account/groups/9/edit");
	});
});
