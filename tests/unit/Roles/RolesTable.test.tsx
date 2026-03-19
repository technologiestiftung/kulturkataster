import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RolesTable } from "@/components/Roles/RolesTable";

const pushMock = vi.fn();
const dataTableMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ??
			(
				{
					"roleTable.actions.add": "Rolle erstellen",
					"roleTable.searchPlaceholder": "Rollen durchsuchen...",
				} as Record<string, string>
			)[key] ??
			key,
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
		selector: (state: { roles: Array<Record<string, unknown>> }) => unknown,
	) =>
		selector({
			roles: [
				{
					id: 7,
					name: "Editor",
					description: "Can edit institutions",
					is_guest: true,
					created_at: new Date("2025-01-01").toISOString(),
					updated_at: new Date("2025-01-02").toISOString(),
					users: [],
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

describe("RolesTable", () => {
	beforeEach(() => {
		pushMock.mockReset();
		dataTableMock.mockReset();
	});

	it("configures table with search, add action and row edit action", () => {
		render(<RolesTable />);

		expect(dataTableMock).toHaveBeenCalledTimes(1);
		const config = dataTableMock.mock.calls[0][0] as {
			data: Array<{ id: number; name: string }>;
			searchable: boolean;
			searchPlaceholder: string;
			primaryButton: { onClick: () => void; label: string };
			onEdit: (row: { id: number }) => void;
		};

		expect(config.searchable).toBe(true);
		expect(config.searchPlaceholder).toBe("Rollen durchsuchen...");
		expect(config.data).toHaveLength(1);
		expect(config.primaryButton.label).toBe("Rolle erstellen");

		config.primaryButton.onClick();
		expect(pushMock).toHaveBeenCalledWith("/de/account/roles/new");

		config.onEdit({ id: 7 });
		expect(pushMock).toHaveBeenCalledWith("/de/account/roles/7/edit");
	});

	it("shows a guest badge in the name cell for guest roles", () => {
		render(<RolesTable />);

		const config = dataTableMock.mock.calls[0][0] as {
			columns: Array<{
				id?: string;
				accessorKey?: string;
				cell?: (args: {
					row: { original: Record<string, unknown> };
				}) => unknown;
			}>;
		};

		const nameColumn = config.columns.find(
			(column) => column.accessorKey === "name",
		);
		expect(nameColumn?.cell).toBeDefined();

		render(
			nameColumn!.cell!({
				row: {
					original: {
						name: "Editor",
						is_guest: true,
					},
				},
			}),
		);

		expect(screen.getByText("Guest role")).toBeInTheDocument();
	});
});
