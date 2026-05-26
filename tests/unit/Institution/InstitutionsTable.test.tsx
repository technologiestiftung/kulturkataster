import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstitutionsTable } from "@/components/Institution/InstitutionsTable";

const pushMock = vi.fn();
const prefetchMock = vi.fn();
const dataTableMock = vi.fn();
const downloadModalMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ??
			(
				{
					"institutionsTable.actions.addInstitution": "Kulturort hinzufügen",
					"institutionsTable.actions.claimInstitution": "Meine Orte anfragen",
					"filter.title": "Kulturorte filtern",
				} as Record<string, string>
			)[key] ??
			key,
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, prefetch: prefetchMock }),
	usePathname: () => "/de/account/institutions",
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/DataTable", () => ({
	DataTable: ({ config }: { config: unknown }) => {
		dataTableMock(config);
		return null;
	},
}));

vi.mock("@/components/Modals/Pages/DownloadModal", () => ({
	DownloadModal: (props: unknown) => {
		downloadModalMock(props);
		return null;
	},
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			institutions: Array<Record<string, unknown>>;
			submissions: Array<Record<string, unknown>>;
			institutionPermissions: {
				create: boolean;
				update: boolean;
				delete: boolean;
				createSubmission: boolean;
				reviewSubmission: boolean;
			};
			setActiveInstitutionEdit: (institution: unknown) => void;
		}) => unknown,
	) =>
		selector({
			institutions: [
				{
					id: 100,
					name: "Institution Alpha",
					status: "public",
					email: null,
					phone: null,
					website: null,
					parent_organization: null,
					address: null,
					categories: [],
					tags: [],
					users: [],
					groups: [],
					created_at: new Date("2025-01-01"),
					updated_at: new Date("2025-01-01"),
				},
			],
			submissions: [],
			institutionPermissions: {
				create: true,
				update: true,
				delete: false,
				createSubmission: true,
				reviewSubmission: true,
			},
			setActiveInstitutionEdit: vi.fn(),
		}),
}));

vi.mock("@/lib/store/institutionDraftStore", () => ({
	useInstitutionDraftStore: (
		selector: (state: {
			setDraft: (value: unknown) => void;
			setMode: (value: string) => void;
			setStepId: (value: string) => void;
			resetDraft: () => void;
		}) => unknown,
	) =>
		selector({
			setDraft: vi.fn(),
			setMode: vi.fn(),
			setStepId: vi.fn(),
			resetDraft: vi.fn(),
		}),
}));

vi.mock("@/lib/hooks/useInstitutionFilterCategories", () => ({
	useInstitutionFilterCategories: () => ({
		filterCategoryGroups: [],
		flattenedCategories: [],
		isFilterCategoriesLoading: false,
		retryInitializeFilterCategories: vi.fn(),
	}),
}));

vi.mock("@/lib/hooks/useInstitutionTableFilters", () => ({
	useInstitutionTableFilters: (tableRows: unknown[]) => ({
		filters: {},
		setFilters: vi.fn(),
		districts: [],
		filteredTableRows: tableRows,
		categoryCounts: {},
		subcategoryCounts: {},
		downloadableInstitutions: [
			{
				id: 100,
				name: "Institution Alpha",
				status: "public",
				email: null,
				phone: null,
				website: null,
				parent_organization: null,
				address: null,
				categories: [],
				tags: [],
				users: [],
				groups: [],
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
			},
		],
	}),
}));

describe("InstitutionsTable", () => {
	beforeEach(() => {
		pushMock.mockReset();
		prefetchMock.mockReset();
		dataTableMock.mockReset();
		downloadModalMock.mockReset();
	});

	it("configures search/filter, add and claim actions plus edit/review routing", () => {
		render(<InstitutionsTable />);

		expect(dataTableMock).toHaveBeenCalledTimes(1);
		const config = dataTableMock.mock.calls[0][0] as {
			searchable: boolean;
			searchPlaceholder: string;
			filterModal?: { triggerLabel: string };
			primaryButton?: { label: string; onClick: () => void };
			secondaryButton?: { onClick: () => void };
			rightButton?: { label: string; onClick: () => void };
			onEdit: (row: Record<string, unknown>) => void;
			onReview: (row: Record<string, unknown>) => void;
			getCanReview: (row: Record<string, unknown>) => boolean;
		};

		expect(config.searchable).toBe(true);
		expect(config.searchPlaceholder).toBe("Search institutions...");
		expect(config.filterModal?.triggerLabel).toBe("Kulturorte filtern");
		expect(config.primaryButton?.label).toBe("Kulturort hinzufügen");
		expect(config.secondaryButton).toBeDefined();
		expect(config.rightButton?.label).toBe("Liste herunterladen");

		config.primaryButton?.onClick();
		expect(pushMock).toHaveBeenCalledWith("/de/account/institutions/new");

		config.secondaryButton?.onClick();
		expect(pushMock).toHaveBeenCalledWith("/de/account/submissions/claim");

		config.onEdit({ rowKind: "institution", id: 100 });
		expect(pushMock).toHaveBeenCalledWith("/de/account/institutions/100/edit");

		config.onReview({
			rowKind: "submission",
			submissionType: "update",
			submissionId: 55,
		});
		expect(pushMock).toHaveBeenCalledWith("/de/account/submissions/55");
		expect(
			config.getCanReview({ rowKind: "submission", submissionType: "update" }),
		).toBe(true);
	});

	it("renders zero numeric table values as a dash", () => {
		render(<InstitutionsTable />);

		const config = dataTableMock.mock.calls[0][0] as {
			columns: Array<{
				accessorKey?: string;
				cell?: (args: {
					row: { original: Record<string, unknown> };
				}) => unknown;
			}>;
		};
		const areaColumn = config.columns.find(
			(column) => column.accessorKey === "area",
		);

		expect(areaColumn?.cell).toBeDefined();

		render(
			<>
				{areaColumn?.cell?.({
					row: {
						original: {
							area: 0,
						},
					},
				})}
			</>,
		);

		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("renders tag names instead of tag ids", () => {
		render(<InstitutionsTable />);

		const config = dataTableMock.mock.calls[0][0] as {
			columns: Array<{
				id?: string;
				cell?: (args: {
					row: { original: Record<string, unknown> };
				}) => unknown;
			}>;
		};
		const tagsColumn = config.columns.find((column) => column.id === "tags");

		expect(tagsColumn?.cell).toBeDefined();

		render(
			<>
				{tagsColumn?.cell?.({
					row: {
						original: {
							tags: [
								{ id: 12, name: "barrier-free" },
								{ id: 34, name: "late-night" },
							],
						},
					},
				})}
			</>,
		);

		expect(screen.getByText("barrier-free, late-night")).toBeInTheDocument();
	});

	it("inserts utilization status detail fields into the table-owned export order", () => {
		render(<InstitutionsTable />);

		expect(downloadModalMock).toHaveBeenCalledTimes(1);
		const props = downloadModalMock.mock.calls[0][0] as {
			exportColumnOrder: string[];
		};

		expect(props.exportColumnOrder).toEqual(
			expect.arrayContaining([
				"utilization_status",
				"utilization_status_info",
				"utilization_status_internal_notes",
				"protection_status",
			]),
		);
		expect(
			props.exportColumnOrder.indexOf("utilization_status_info"),
		).toBeGreaterThan(props.exportColumnOrder.indexOf("utilization_status"));
		expect(
			props.exportColumnOrder.indexOf("utilization_status_info"),
		).toBeLessThan(props.exportColumnOrder.indexOf("protection_status"));
		expect(
			props.exportColumnOrder.indexOf("utilization_status_internal_notes"),
		).toBeGreaterThan(
			props.exportColumnOrder.indexOf("utilization_status_info"),
		);
	});

	it("passes only downloadable filtered institutions to the download modal", () => {
		render(<InstitutionsTable />);

		expect(downloadModalMock).toHaveBeenCalledTimes(1);
		const props = downloadModalMock.mock.calls[0][0] as {
			data: Array<{ id: number }>;
		};

		expect(props.data.map((institution) => institution.id)).toEqual([100]);
	});
});
