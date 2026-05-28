vi.mock("@/icons/send.svg", () => ({ default: () => null }));
vi.mock("@/icons/edit.svg", () => ({ default: () => null }));
vi.mock("@/icons/filter.svg", () => ({ default: () => null }));
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { ActivityList } from "@/components/Activity/ActivityList";
import { getEntityAuditsPage } from "@/server/actions/entityAudits";

type MockAudit = {
	id: number;
	action: "create" | "update" | "delete";
	entity_type: string;
	entity_id: string;
	changed_at: Date | string;
	status: "approval_pending" | "approved" | "rejected" | "completed";
	user: {
		first_name?: string | null;
		last_name?: string | null;
		email: string;
		account_type?: string | null;
	} | null;
	old_data?: Record<string, unknown> | null;
	new_data?: Record<string, unknown> | null;
	meta_info?: Record<string, unknown> | null;
};

type MockState = {
	currentProfile: { id: string; email: string } | null;
	users: Array<{
		id: string;
		email: string;
		role?: {
			table_permissions?: Array<{
				table: string;
				action: string;
				scope?: string | null;
			}>;
		} | null;
	}>;
	entityAudits: MockAudit[];
	submissions: Array<{ id: number }>;
	institutionPermissions?: {
		create?: boolean;
		update?: boolean;
		reviewSubmission?: boolean;
	} | null;
};

let mockState: MockState = {
	currentProfile: null,
	users: [],
	entityAudits: [],
	submissions: [],
	institutionPermissions: null,
};

type MockIntersectionObserverEntry = {
	target: Element;
	isIntersecting: boolean;
};

const intersectionObserverCallbacks: Array<
	(entries: MockIntersectionObserverEntry[]) => void
> = [];

class MockIntersectionObserver {
	private callback: (entries: MockIntersectionObserverEntry[]) => void;

	constructor(callback: (entries: MockIntersectionObserverEntry[]) => void) {
		this.callback = callback;
		intersectionObserverCallbacks.push(callback);
	}

	observe() {}

	unobserve() {}

	disconnect() {
		const index = intersectionObserverCallbacks.indexOf(this.callback);
		if (index >= 0) {
			intersectionObserverCallbacks.splice(index, 1);
		}
	}
}

const triggerIntersectionObservers = (isIntersecting = true) => {
	act(() => {
		for (const callback of intersectionObserverCallbacks) {
			callback([{ target: document.body, isIntersecting }]);
		}
	});
};

(
	globalThis as typeof globalThis & {
		IntersectionObserver: typeof MockIntersectionObserver;
	}
).IntersectionObserver = MockIntersectionObserver;

vi.mock("@/server/actions/entityAudits", () => ({
	getEntityAuditsPage: vi.fn(),
}));

vi.mock("@tanstack/react-virtual", () => ({
	useWindowVirtualizer: ({ count }: { count: number }) => ({
		getVirtualItems: () =>
			Array.from({ length: count }, (_, index) => ({
				index,
				start: index * 64,
				size: 64,
			})),
		getTotalSize: () => count * 64,
		measure: vi.fn(),
		measureElement: vi.fn(),
		resizeItem: vi.fn(),
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string; id?: string }) =>
			options?.defaultValue ?? (options?.id ? `${key}:${options.id}` : key),
	}),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (selector: (state: MockState) => unknown) =>
		selector(mockState),
}));

vi.mock("@/components/ui/search-input", () => ({
	SearchInput: ({
		value,
		onChange,
		placeholder,
	}: {
		value?: string;
		onChange?: (event: { target: { value: string } }) => void;
		placeholder?: string;
	}) => (
		<input
			aria-label={placeholder ?? "search"}
			value={value ?? ""}
			onChange={(event) =>
				onChange?.({ target: { value: event.target.value } })
			}
		/>
	),
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({
		value,
		onValueChange,
		children,
	}: {
		value?: string;
		onValueChange?: (value: string) => void;
		children: React.ReactNode;
	}) => (
		<select
			value={value ?? ""}
			onChange={(event) => onValueChange?.(event.target.value)}
		>
			{children}
		</select>
	),
	SelectTrigger: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	SelectValue: () => null,
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	SelectItem: ({
		value,
		children,
	}: {
		value: string;
		children: React.ReactNode;
	}) => <option value={value}>{children}</option>,
}));

vi.mock("@/components/Activity/ActivityItem", () => ({
	ActivityItem: ({ activity }: { activity: Record<string, unknown> }) => (
		<div data-testid="activity-row">
			<div>{String(activity.actor ?? "")}</div>
			<div>{String(activity.status ?? "")}</div>
			<div>{String(activity.eventType ?? "")}</div>
			<div>{String(activity.action ?? "")}</div>
			<div>{String(activity.primaryEntity ?? "")}</div>
			{typeof activity.primaryEntityLink === "string" ? (
				<a
					data-testid={`primary-link-${String(activity.id)}`}
					href={activity.primaryEntityLink}
				>
					link
				</a>
			) : null}
		</div>
	),
}));

vi.mock("@/components/EmptyActionState", () => ({
	EmptyActionState: ({ title }: { title: string }) => <div>{title}</div>,
}));

const makeAudit = (overrides: Partial<MockAudit>): MockAudit => ({
	id: 1,
	action: "update",
	entity_type: "institution",
	entity_id: "1",
	changed_at: new Date(),
	status: "approved",
	user: {
		first_name: "Alice",
		last_name: "Admin",
		email: "alice@example.com",
	},
	old_data: null,
	new_data: { name: "Die Etage" },
	meta_info: null,
	...overrides,
});

describe("ActivityList filters", () => {
	beforeEach(() => {
		intersectionObserverCallbacks.splice(
			0,
			intersectionObserverCallbacks.length,
		);
		vi.mocked(getEntityAuditsPage).mockReset();
		vi.mocked(getEntityAuditsPage).mockResolvedValue({
			audits: [],
			hasMore: false,
		});
		const now = new Date();
		const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
		const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
		mockState = {
			currentProfile: {
				id: "current-user",
				email: "current@example.com",
			},
			users: [
				{
					id: "current-user",
					email: "current@example.com",
					role: {
						table_permissions: [
							{ table: "user", action: "read", scope: "all" },
						],
					},
				},
			],
			submissions: [],
			entityAudits: [
				makeAudit({
					id: 1,
					status: "approved",
					changed_at: now,
					new_data: { name: "Die Etage" },
					user: {
						first_name: "Alice",
						last_name: "Admin",
						email: "alice@example.com",
					},
				}),
				makeAudit({
					id: 2,
					action: "create",
					status: "rejected",
					entity_type: "category",
					entity_id: "9",
					changed_at: tenDaysAgo,
					new_data: { key: "musik" },
					user: {
						first_name: "Bob",
						last_name: "Editor",
						email: "bob@example.com",
					},
				}),
				makeAudit({
					id: 3,
					action: "update",
					status: "completed",
					entity_type: "user",
					entity_id: "7",
					changed_at: fortyDaysAgo,
					old_data: { status: "approval_pending" },
					new_data: { status: "approved", email: "person@example.com" },
					user: null,
				}),
			],
		};
	});

	it("filters by status, type, actor and search text", () => {
		render(<ActivityList />);

		expect(screen.getAllByTestId("activity-row")).toHaveLength(3);

		const filters = screen.getAllByRole("combobox");
		const statusSelect = filters[0];
		const typeSelect = filters[1];
		const entityTypeSelect = filters[2];
		const actorSelect = filters[3];

		fireEvent.change(statusSelect, { target: { value: "approved" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(2);

		fireEvent.change(statusSelect, { target: { value: "all" } });
		fireEvent.change(typeSelect, { target: { value: "status_change" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(typeSelect, { target: { value: "all" } });
		fireEvent.change(entityTypeSelect, { target: { value: "category" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(entityTypeSelect, { target: { value: "all" } });
		fireEvent.change(actorSelect, {
			target: { value: "Alice Admin (alice@example.com)" },
		});
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(actorSelect, { target: { value: "all" } });
		fireEvent.change(screen.getAllByRole("textbox")[0], {
			target: { value: "Die Etage" },
		});
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
	});

	it("does not reapply row entry animations when rerendered with the same activities", () => {
		const { rerender } = render(<ActivityList />);

		expect(screen.getAllByTestId("activity-row")).toHaveLength(3);
		for (const row of screen.getAllByTestId("activity-row")) {
			expect(row.parentElement).toHaveClass("motion-safe:animate-in");
		}

		rerender(<ActivityList />);

		expect(screen.getAllByTestId("activity-row")).toHaveLength(3);
		for (const row of screen.getAllByTestId("activity-row")) {
			expect(row.parentElement).not.toHaveClass("motion-safe:animate-in");
		}
	});

	it("falls back to the audit user for download rows with stale unknown requester metadata", () => {
		mockState.entityAudits = [
			makeAudit({
				id: 10,
				action: "update",
				entity_type: "user",
				entity_id: "current-user",
				status: "completed",
				user: {
					first_name: "Ada",
					last_name: "Lovelace",
					email: "ada@example.com",
				},
				new_data: {
					format: "xls",
					institution_count: 12,
				},
				meta_info: {
					download_event: true,
					download_type: "institution_export",
					requester_name: "Unknown",
					requester_email: "",
				},
			}),
		];

		render(<ActivityList />);

		expect(screen.getByTestId("activity-row")).toHaveTextContent(
			"Ada Lovelace",
		);
		expect(screen.getByTestId("activity-row")).not.toHaveTextContent("Unknown");
	});

	it("keeps submission review bulk helper audits collapsed into one activity", () => {
		const reviewCorrelationId = "submission:270:review:1777418822127";

		mockState.entityAudits = [
			makeAudit({
				id: 100,
				action: "create",
				entity_type: "submission",
				entity_id: "270",
				status: "approval_pending",
				user: {
					first_name: "Ex",
					last_name: "Am",
					email: "guest@example.de",
				},
				new_data: {
					id: 270,
					type: "create",
					entity_type: "institution",
					status: "approval_pending",
					data: { name: "E2E All Fields 1777418822127" },
				},
				meta_info: null,
			}),
			makeAudit({
				id: 101,
				action: "update",
				entity_type: "submission",
				entity_id: "270",
				status: "approval_pending",
				user: {
					first_name: "Jo",
					last_name: "H",
					email: "admin@example.de",
				},
				old_data: {
					id: 270,
					type: "create",
					entity_type: "institution",
					status: "approval_pending",
					data: { name: "E2E All Fields 1777418822127" },
				},
				new_data: {
					id: 270,
					type: "create",
					entity_type: "institution",
					status: "rejected",
					data: { name: "E2E All Fields 1777418822127" },
				},
				meta_info: {
					correlation_id: reviewCorrelationId,
					root_entity_type: "submission",
					root_entity_id: "270",
					intent: "submission_review_rejected",
				},
			}),
			makeAudit({
				id: 102,
				action: "update",
				entity_type: "submission",
				entity_id: "bulk",
				status: "approval_pending",
				user: {
					first_name: "Jo",
					last_name: "H",
					email: "admin@example.de",
				},
				old_data: [
					{
						id: 270,
						entity_id: 270,
						type: "create",
						entity_type: "institution",
						status: "approval_pending",
						data: { name: "E2E All Fields 1777418822127" },
					},
				],
				new_data: {
					args: { data: { status: "rejected" } },
					result: { count: 1 },
				},
				meta_info: {
					correlation_id: reviewCorrelationId,
					root_entity_type: "submission",
					root_entity_id: "270",
					intent: "submission_review_rejected",
				},
			}),
		];

		render(<ActivityList />);

		const rows = screen.getAllByTestId("activity-row");
		expect(rows).toHaveLength(2);

		const guestRow = rows.find((row) =>
			within(row).queryByText("Ex Am (guest@example.de)"),
		);
		const adminRow = rows.find((row) =>
			within(row).queryByText("Jo H (admin@example.de)"),
		);

		expect(guestRow).toBeDefined();
		expect(adminRow).toBeDefined();
		expect(within(guestRow!).getAllByText("create")).toHaveLength(2);
		expect(within(guestRow!).queryByText("update")).not.toBeInTheDocument();
		expect(within(adminRow!).getByText("update")).toBeInTheDocument();
	});

	it("uses the user entity status for user activities", () => {
		mockState.entityAudits = [
			makeAudit({
				id: 30,
				action: "update",
				status: "completed",
				entity_type: "user",
				entity_id: "7",
				old_data: { status: "approval_pending" },
				new_data: { status: "approved", email: "person@example.com" },
				user: null,
			}),
		];

		render(<ActivityList />);

		expect(screen.getByText("approved")).toBeInTheDocument();
		expect(screen.queryByText("completed")).not.toBeInTheDocument();
	});

	it("shows the user account type after the action when available", () => {
		mockState.entityAudits = [
			makeAudit({
				id: 21,
				entity_type: "user",
				entity_id: "user-21",
				user: null,
				old_data: null,
				new_data: {
					email: "person@example.com",
					account_type: "organization",
				},
			}),
		];

		render(<ActivityList />);

		expect(
			screen.getByText("Nutzer*in (person@example.com)"),
		).toBeInTheDocument();
		expect(
			screen.getByText("update (Mitarbeiter*in einer Organisation)"),
		).toBeInTheDocument();
	});

	it("includes the submission type in submission entity labels", () => {
		mockState.entityAudits = [
			makeAudit({
				id: 22,
				action: "create",
				entity_type: "submission",
				entity_id: "172",
				new_data: {
					type: "create",
					entity_type: "institution",
					data: { name: "Neue Bühne" },
				},
			}),
		];

		render(<ActivityList />);

		expect(
			screen.getByText("submission (create) [institution] #172: Neue Bühne"),
		).toBeInTheDocument();
	});

	it("filters by date presets", () => {
		render(<ActivityList />);

		const dateSelect = screen.getAllByRole("combobox")[4];

		fireEvent.change(dateSelect, { target: { value: "today" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(dateSelect, { target: { value: "last_7_days" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(dateSelect, { target: { value: "last_30_days" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(2);
	});

	it("shows distinct labels for approved and active in the status filter", () => {
		mockState.entityAudits = [
			makeAudit({
				id: 40,
				entity_type: "submission",
				entity_id: "40",
				status: "approved",
				new_data: {
					status: "approved",
					type: "create",
					entity_type: "institution",
					data: { name: "Approved submission" },
				},
			}),
			makeAudit({
				id: 41,
				entity_type: "user",
				entity_id: "user-41",
				status: "completed",
				new_data: {
					status: "active",
					email: "active@example.com",
				},
				user: null,
			}),
		];

		render(<ActivityList />);

		const statusSelect = screen.getAllByRole("combobox")[0];
		const optionLabels = within(statusSelect)
			.getAllByRole("option")
			.map((option) => option.textContent);

		expect(optionLabels).toContain("Approved");
		expect(optionLabels).toContain("Active");
		expect(optionLabels.filter((label) => label === "Approved")).toHaveLength(
			1,
		);
	});

	it("does not link deleted submission activities", () => {
		mockState = {
			currentProfile: {
				id: "current-user",
				email: "current@example.com",
			},
			users: [
				{
					id: "current-user",
					email: "current@example.com",
					role: {
						table_permissions: [
							{ table: "user", action: "read", scope: "all" },
						],
					},
				},
			],
			submissions: [],
			entityAudits: [
				makeAudit({
					id: 10,
					action: "update",
					entity_type: "submission",
					entity_id: "366",
					status: "approved",
				}),
				makeAudit({
					id: 11,
					action: "delete",
					entity_type: "submission",
					entity_id: "366",
					status: "completed",
					user: null,
				}),
			],
		};

		render(<ActivityList />);

		expect(
			screen.queryByTestId("primary-link-audit:10"),
		).not.toBeInTheDocument();
	});

	it("links user activities to the user edit page when the current user can read all users", () => {
		mockState = {
			currentProfile: {
				id: "current-user",
				email: "current@example.com",
			},
			users: [
				{
					id: "current-user",
					email: "current@example.com",
					role: {
						table_permissions: [
							{ table: "user", action: "read", scope: "all" },
						],
					},
				},
			],
			submissions: [],
			entityAudits: [
				makeAudit({
					id: 20,
					entity_type: "user",
					entity_id: "3a6ec09c-712c-42fc-ae0a-28dda26ec42e",
					new_data: { email: "person@example.com" },
					user: null,
				}),
			],
		};

		render(<ActivityList />);

		expect(screen.getByTestId("primary-link-audit:20")).toHaveAttribute(
			"href",
			"/de/account/users/3a6ec09c-712c-42fc-ae0a-28dda26ec42e/edit",
		);
	});

	it("links current user activities to account edit when the current user cannot read all users", () => {
		mockState = {
			currentProfile: {
				id: "current-user",
				email: "current@example.com",
			},
			users: [
				{
					id: "current-user",
					email: "current@example.com",
					role: {
						table_permissions: [],
					},
				},
			],
			submissions: [],
			entityAudits: [
				makeAudit({
					id: 21,
					entity_type: "user",
					entity_id: "current-user",
					new_data: { email: "person@example.com" },
					user: null,
				}),
			],
		};

		render(<ActivityList />);

		expect(screen.getByTestId("primary-link-audit:21")).toHaveAttribute(
			"href",
			"/de/account/edit",
		);
	});

	it("does not append /edit for category submission links even when canCreateInstitutions is true", () => {
		mockState = {
			currentProfile: { id: "current-user", email: "current@example.com" },
			users: [
				{
					id: "current-user",
					email: "current@example.com",
					role: {
						table_permissions: [
							{ table: "user", action: "read", scope: "all" },
						],
					},
				},
			],
			submissions: [{ id: 165 }],
			institutionPermissions: { create: true, update: true },
			entityAudits: [
				makeAudit({
					id: 30,
					action: "create",
					entity_type: "submission",
					entity_id: "165",
					status: "approved",
					new_data: {
						type: "create",
						entity_type: "category",
						data: { key: "musik" },
					},
				}),
			],
		};

		render(<ActivityList />);

		expect(screen.getByTestId("primary-link-audit:30")).toHaveAttribute(
			"href",
			"/de/account/submissions/165",
		);
	});

	it("loads and appends older audits when the scroll sentinel intersects", async () => {
		const now = new Date("2026-05-05T12:00:00.000Z");
		mockState.entityAudits = Array.from({ length: 200 }, (_, index) =>
			makeAudit({
				id: index + 1,
				changed_at: new Date(now.getTime() - index * 60_000),
				new_data: { name: `Audit ${index + 1}` },
				user: {
					first_name: "Loaded",
					last_name: "User",
					email: `loaded-${index + 1}@example.com`,
				},
			}),
		);

		vi.mocked(getEntityAuditsPage).mockResolvedValueOnce({
			audits: [
				makeAudit({
					id: 201,
					changed_at: new Date(now.getTime() - 201 * 60_000),
					new_data: { name: "Older audit" },
					user: {
						first_name: "Older",
						last_name: "User",
						email: "older@example.com",
					},
				}) as never,
			],
			hasMore: false,
		});

		render(<ActivityList />);

		triggerIntersectionObservers();

		await waitFor(() => {
			expect(getEntityAuditsPage).toHaveBeenCalledWith(
				expect.objectContaining({
					beforeId: 200,
					take: 100,
				}),
			);
		});

		await waitFor(() => {
			expect(screen.getAllByTestId("activity-row")).toHaveLength(201);
		});
	});

	it("shows a loading state while older audits are being fetched", async () => {
		const now = new Date("2026-05-05T12:00:00.000Z");
		mockState.entityAudits = Array.from({ length: 200 }, (_, index) =>
			makeAudit({
				id: index + 1,
				changed_at: new Date(now.getTime() - index * 60_000),
			}),
		);

		let resolveFetch:
			| ((value: { audits: never[]; hasMore: boolean }) => void)
			| undefined;
		vi.mocked(getEntityAuditsPage).mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFetch = resolve;
			}),
		);

		render(<ActivityList />);

		triggerIntersectionObservers();

		expect(
			screen.getByText("Weitere Aktivitaeten werden geladen..."),
		).toBeInTheDocument();

		act(() => {
			resolveFetch?.({ audits: [], hasMore: false });
		});

		await waitFor(() => {
			expect(
				screen.queryByText("Weitere Aktivitaeten werden geladen..."),
			).toBeNull();
		});
	});

	it("shows an error state and retries loading older audits", async () => {
		const now = new Date("2026-05-05T12:00:00.000Z");
		mockState.entityAudits = Array.from({ length: 200 }, (_, index) =>
			makeAudit({
				id: index + 1,
				changed_at: new Date(now.getTime() - index * 60_000),
			}),
		);

		vi.mocked(getEntityAuditsPage)
			.mockRejectedValueOnce(new Error("load failed"))
			.mockResolvedValueOnce({ audits: [], hasMore: false });

		render(<ActivityList />);

		triggerIntersectionObservers();

		const retryButton = await screen.findByRole("button", {
			name: "Weitere Aktivitaeten konnten nicht geladen werden.",
		});
		expect(retryButton).toBeInTheDocument();

		fireEvent.click(retryButton);

		await waitFor(() => {
			expect(getEntityAuditsPage).toHaveBeenCalledTimes(2);
		});
	});
});
