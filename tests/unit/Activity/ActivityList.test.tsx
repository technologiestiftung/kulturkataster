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
	} | null;
	old_data?: Record<string, unknown> | null;
	new_data?: Record<string, unknown> | null;
	meta_info?: Record<string, unknown> | null;
};

type MockState = {
	entityAudits: MockAudit[];
	submissions: Array<{ id: number }>;
};

let mockState: MockState = {
	entityAudits: [],
	submissions: [],
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
		const actorSelect = filters[2];

		fireEvent.change(statusSelect, { target: { value: "approved" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(statusSelect, { target: { value: "all" } });
		fireEvent.change(typeSelect, { target: { value: "status_change" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(typeSelect, { target: { value: "all" } });
		fireEvent.change(actorSelect, {
			target: { value: "Alice Admin (alice@example.com)" },
		});
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(actorSelect, { target: { value: "all" } });
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "Die Etage" },
		});
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
	});

	it("filters by date presets", () => {
		render(<ActivityList />);

		const dateSelect = screen.getAllByRole("combobox")[3];

		fireEvent.change(dateSelect, { target: { value: "today" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(dateSelect, { target: { value: "last_7_days" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(1);

		fireEvent.change(dateSelect, { target: { value: "last_30_days" } });
		expect(screen.getAllByTestId("activity-row")).toHaveLength(2);
	});

	it("does not link deleted submission activities", () => {
		mockState = {
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
});
