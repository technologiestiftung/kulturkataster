import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CategoriesTable } from "@/components/Categories/CategoriesTable";

const pushMock = vi.fn();
const dataTableMock = vi.fn();

const categoriesMock = [
	{
		id: 1,
		key: "music",
		description: "Parent category",
		status: "active",
		parent_category_id: null,
	},
	{
		id: 2,
		key: "music_sub",
		description: "Child category",
		status: "active",
		parent_category_id: 1,
	},
	{
		id: 3,
		key: "visual",
		description: "Second parent",
		status: "inactive",
		parent_category_id: null,
	},
];

vi.mock("react-i18next", () => ({
	useTranslation: (ns?: string) => ({
		t: (key: string, options?: { defaultValue?: string }) => {
			if (ns === "enumMap" || key.startsWith("enumMap.category.")) {
				return `translated:${key.replace(/^enumMap\./, "")}`;
			}
			return options?.defaultValue ?? key.replace(/^content\./, "");
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
		selector: (state: {
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) =>
		selector({
			categories: categoriesMock,
		}),
}));

vi.mock("@/components/DataTable", () => ({
	DataTable: ({ config }: { config: unknown }) => {
		dataTableMock(config);
		return null;
	},
}));

vi.mock("@/icons/edit.svg", () => ({ default: () => null }));
vi.mock("@/icons/plus.svg", () => ({ default: () => null }));

describe("CategoriesTable", () => {
	beforeEach(() => {
		pushMock.mockReset();
		dataTableMock.mockReset();
	});

	it("builds hierarchical parent rows and expanded child content", () => {
		render(<CategoriesTable />);

		expect(dataTableMock).toHaveBeenCalledTimes(1);
		const config = dataTableMock.mock.calls[0][0] as {
			columns: Array<{
				id?: string;
				accessorKey?: string;
				header: string;
			}>;
			searchPlaceholder: string;
			data: Array<{
				id: number;
				displayKey: string;
				childRows: Array<{ id: number; displayKey: string }>;
			}>;
			getRowCanExpand: (row: {
				childRows: Array<{ id: number; displayKey: string }>;
			}) => boolean;
			getSearchableValues: (row: {
				displayKey: string;
				description?: string;
				status?: string;
				parentDisplay: string;
				childRows: Array<{ displayKey: string; description?: string }>;
			}) => string[];
			renderExpandedRow: (row: {
				childRows: Array<{
					id: number;
					displayKey: string;
					description?: string;
					status?: string;
					parentDisplay: string;
				}>;
			}) => unknown;
		};

		const columnHeadersById = Object.fromEntries(
			config.columns.map((column) => [
				column.id ?? column.accessorKey ?? "unknown",
				column.header,
			]),
		);
		expect(columnHeadersById.status).toBe("");
		expect(columnHeadersById.displayKey).toBe("categoryTable.columns.key");
		expect(columnHeadersById.icon).toBe("categoryTable.columns.icon");
		expect(columnHeadersById.description).toBe(
			"categoryTable.columns.description",
		);
		expect(config.searchPlaceholder).toBe("categoryTable.searchPlaceholder");

		expect(config.data).toHaveLength(2);
		expect(config.data[0]?.id).toBe(1);
		expect(config.data[0]?.displayKey).toBe("translated:category.music");
		expect(config.data[0]?.childRows).toHaveLength(1);
		expect(config.data[0]?.childRows[0]?.displayKey).toBe(
			"translated:category.music_sub",
		);
		expect(config.getRowCanExpand(config.data[0]!)).toBe(true);
		expect(config.getRowCanExpand(config.data[1]!)).toBe(false);

		const searchable = config.getSearchableValues(config.data[0]! as never);
		expect(searchable.join(" ")).toContain("translated:category.music_sub");

		render(config.renderExpandedRow(config.data[0]! as never));
		expect(
			screen.getByText("translated:category.music_sub"),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: "Unterkategorie bearbeiten" }),
		);
		expect(pushMock).toHaveBeenCalledWith("/de/account/categories/2/edit");
	});
});
