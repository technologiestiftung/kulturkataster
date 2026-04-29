vi.mock("@/icons/send.svg", () => ({ default: () => null }));
vi.mock("@/icons/edit.svg", () => ({ default: () => null }));
vi.mock("@/icons/filter.svg", () => ({ default: () => null }));
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ActivityList } from "@/components/Activity/ActivityList";

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
});
