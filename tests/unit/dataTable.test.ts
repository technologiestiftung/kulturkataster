import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable } from "@/components/DataTable/DataTable";
import type { DataTableConfig } from "@/components/DataTable";

vi.mock("@tanstack/react-virtual", () => ({
	useWindowVirtualizer: () => ({
		getVirtualItems: () => [],
		getTotalSize: () => 0,
	}),
}));

vi.mock("@/icons/chevron-up.svg", () => ({ default: () => null }));
vi.mock("@/icons/chevron-down.svg", () => ({ default: () => null }));
vi.mock("@/icons/edit.svg", () => ({ default: () => null }));
vi.mock("@/icons/arrow-narrow-left.svg", () => ({ default: () => null }));
vi.mock("@/icons/arrow-narrow-right.svg", () => ({ default: () => null }));
vi.mock("@/icons/plus.svg", () => ({ default: () => null }));
vi.mock("@/icons/search.svg", () => ({ default: () => null }));
vi.mock("@/icons/close.svg", () => ({ default: () => null }));

type Row = {
	id: number;
	name: string;
	status: string;
};

const buildMarkup = () => {
	const config: DataTableConfig<Row> = {
		columns: [
			{
				accessorKey: "name",
				header: "Name",
				enableSorting: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "status",
				header: "Status",
				enableSorting: false,
			},
		],
		data: [{ id: 1, name: "Alpha", status: "Active" }],
		getRowKey: (row) => row.id,
	};

	return renderToStaticMarkup(React.createElement(DataTable<Row>, { config }));
};

describe("DataTable", () => {
	it("wires header ids to data cells for accessibility", () => {
		const markup = buildMarkup();
		const nameHeaderMatch = markup.match(/id="([^"]+-header-name)"/);
		const statusHeaderMatch = markup.match(/id="([^"]+-header-status)"/);

		expect(nameHeaderMatch).not.toBeNull();
		expect(statusHeaderMatch).not.toBeNull();

		const nameHeaderId = nameHeaderMatch?.[1] ?? "";
		const statusHeaderId = statusHeaderMatch?.[1] ?? "";

		expect(markup).toContain(`headers="${nameHeaderId}"`);
		expect(markup).toContain(`headers="${statusHeaderId}"`);
	});

	it("applies truncate only to columns that opt in", () => {
		const markup = buildMarkup();
		const truncateMatches = markup.match(/\btruncate\b/g) ?? [];
		expect(truncateMatches.length).toBe(1);
	});

	it("renders only sortable headers as sort buttons", () => {
		const markup = buildMarkup();
		const sortButtons = markup.match(/<button type="button"[^>]*>Name/g) ?? [];

		expect(sortButtons).toHaveLength(1);
		expect(markup).not.toMatch(/<button type="button"[^>]*>Status/);
	});

	it("exposes the sort state only on the accessible table header", () => {
		const markup = buildMarkup();

		expect(markup.match(/aria-sort="none"/g) ?? []).toHaveLength(1);
		expect(markup).not.toMatch(/<th[^>]*tabindex/);
	});

	it("includes row ids in the global search index", () => {
		const config: DataTableConfig<Row> = {
			columns: [
				{
					accessorKey: "name",
					header: "Name",
					enableSorting: true,
				},
				{
					accessorKey: "status",
					header: "Status",
				},
			],
			data: [
				{ id: 101, name: "Alpha", status: "Active" },
				{ id: 202, name: "Beta", status: "Draft" },
			],
			getRowKey: (row) => row.id,
			getSearchableValues: (row) => [row.name, row.status],
			searchable: true,
			searchPlaceholder: "Search...",
		};

		render(React.createElement(DataTable<Row>, { config }));

		fireEvent.change(screen.getByPlaceholderText("Search..."), {
			target: { value: "202" },
		});

		expect(screen.getByText("Beta")).toBeInTheDocument();
		expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
	});
});
