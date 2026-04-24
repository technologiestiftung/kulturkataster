import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RoleFormModal } from "@/components/Roles/RoleFormModal";
import { createRole, updateRole } from "@/server/actions/roles";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { useAccountStore } from "@/lib/store/accountStore";

const closeModalMock = vi.fn();
const refreshMock = vi.fn();
let lastFormConfig: {
	fields?: Array<Record<string, unknown>>;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
} | null = null;

const findFieldByName = (
	fields: Array<Record<string, unknown>> | undefined,
	name: string,
): Record<string, unknown> | undefined => {
	if (!fields) return undefined;
	for (const field of fields) {
		if (field.name === name) return field;
		const nested = Array.isArray(field.fields)
			? findFieldByName(field.fields as Array<Record<string, unknown>>, name)
			: undefined;
		if (nested) return nested;
	}
	return undefined;
};

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({
		config,
	}: {
		config: {
			fields?: Array<Record<string, unknown>>;
			onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
		};
	}) => {
		lastFormConfig = config;
		return (
			<div>
				<button
					type="button"
					onClick={() =>
						void config.onSubmit({
							name: "Updated role",
							description: "Updated description",
							tablePermissions: {},
							fieldPermissions: {},
						})
					}
				>
					Submit
				</button>
			</div>
		);
	},
}));

vi.mock("@/server/actions/roles", () => ({
	createRole: vi.fn(),
	updateRole: vi.fn(),
	deleteRole: vi.fn(),
	getRoleById: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

const mockedCreateRole = vi.mocked(createRole);
const mockedUpdateRole = vi.mocked(updateRole);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("RoleFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		refreshMock.mockReset();
		mockedCreateRole.mockReset();
		mockedUpdateRole.mockReset();
		mockedShowSuccessToast.mockReset();
		lastFormConfig = null;
		useAccountStore.setState({
			roles: [
				{
					id: 12,
					name: "Existing role",
					description: "Desc",
					is_system: false,
					created_at: new Date("2025-01-01"),
					updated_at: new Date("2025-01-01"),
					table_permissions: [],
					field_permissions: [],
					users: [],
				},
			],
		} as never);
	});

	it("creates a role in create mode", async () => {
		mockedCreateRole.mockResolvedValueOnce({
			ok: true,
			data: {
				id: 99,
				name: "Updated role",
				description: "Updated description",
				is_system: false,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
				table_permissions: [],
				field_permissions: [],
				users: [],
			},
		} as never);

		render(<RoleFormModal mode="create" routePath="/account/roles/new" />);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedCreateRole).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Updated role",
					description: "Updated description",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("updates an existing role in edit mode", async () => {
		mockedUpdateRole.mockResolvedValueOnce({
			ok: true,
			data: {
				id: 12,
				name: "Updated role",
				description: "Updated description",
				is_system: false,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-02"),
				table_permissions: [],
				field_permissions: [],
				users: [],
			},
		} as never);

		render(
			<RoleFormModal
				mode="edit"
				roleId="12"
				routePath="/account/roles/12/edit"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedUpdateRole).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 12,
					name: "Updated role",
					description: "Updated description",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("limits address and audit permissions to read only", () => {
		render(<RoleFormModal mode="create" routePath="/account/roles/new" />);

		const tablePermissionsField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"tablePermissions",
		) as
			| {
					tablePermissions?: {
						tables?: Array<{
							key: string;
							actions?: string[];
						}>;
					};
			  }
			| undefined;

		const addressTable = tablePermissionsField?.tablePermissions?.tables?.find(
			(table) => table.key === "address",
		);
		const entityAuditTable =
			tablePermissionsField?.tablePermissions?.tables?.find(
				(table) => table.key === "entity_audit",
			);

		expect(addressTable?.actions).toEqual(["read"]);
		expect(entityAuditTable?.actions).toEqual(["read"]);
	});
});
