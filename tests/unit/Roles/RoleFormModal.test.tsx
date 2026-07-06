import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { RoleFormModal } from "@/components/Roles/RoleFormModal";
import {
	createRole,
	getRoleFieldOrder,
	updateRole,
} from "@/server/actions/roles";
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
		t: (key: string, options?: { defaultValue?: string }) => {
			const translations: Record<string, string> = {
				"content.roleFormModal.permissions.fields.sections.contact_person":
					"Ansprechperson",
				"content.roleFormModal.permissions.fields.sectionShort.contact_person":
					"AP",
				"enumMap.field_names.contact_person_email.label":
					"Ansprechperson E-Mail Adresse",
				"enumMap.field_names.address_suffix.label": "Adresszusatz",
			};
			return translations[key] ?? options?.defaultValue ?? key;
		},
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
	getRoleFieldOrder: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

const mockedCreateRole = vi.mocked(createRole);
const mockedUpdateRole = vi.mocked(updateRole);
const mockedGetRoleFieldOrder = vi.mocked(getRoleFieldOrder);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("RoleFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		refreshMock.mockReset();
		mockedCreateRole.mockReset();
		mockedUpdateRole.mockReset();
		mockedGetRoleFieldOrder.mockReset();
		mockedGetRoleFieldOrder.mockResolvedValue([]);
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

	it("submits field permission sort order", async () => {
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
		await lastFormConfig?.onSubmit({
			name: "Updated role",
			description: "Updated description",
			tablePermissions: {},
			fieldPermissions: {
				name: ["read"],
				email: ["download"],
			},
		});

		await waitFor(() => {
			expect(mockedCreateRole).toHaveBeenCalledWith(
				expect.objectContaining({
					fieldPermissions: expect.arrayContaining([
						expect.objectContaining({
							field: "name",
							action: "read",
						}),
						expect.objectContaining({
							field: "email",
							action: "download",
						}),
					]),
					fieldOrder: expect.objectContaining({
						table: "institution",
						fields: expect.arrayContaining(["name", "email"]),
					}),
				}),
			);
		});
	});

	it("uses the default global order for relation subfields", () => {
		render(<RoleFormModal mode="create" routePath="/account/roles/new" />);

		const fieldPermissionsField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"fieldPermissions",
		) as
			| {
					fieldPermissions?: {
						sections?: {
							fields: {
								key: string;
								label: string;
								relationLabel?: string;
								relationShortLabel?: string;
								isRelationField?: boolean;
							}[];
						}[];
					};
			  }
			| undefined;

		const fields =
			fieldPermissionsField?.fieldPermissions?.sections?.[0]?.fields ?? [];
		const keys = fields.map((field) => field.key);

		expect(keys.slice(0, 12)).toEqual([
			"status",
			"id",
			"name",
			"parent_organization",
			"email",
			"phone",
			"website",
			"address.street",
			"address.address_suffix",
			"address.zipcode",
			"address.city",
			"address.district",
		]);
		expect(fields.find((field) => field.key === "address.street")).toEqual(
			expect.objectContaining({
				isRelationField: true,
				relationLabel: "Address",
			}),
		);
		expect(
			fields.find((field) => field.key === "address.address_suffix"),
		).toEqual(
			expect.objectContaining({
				label: "Adresszusatz",
			}),
		);
		expect(
			fields.find((field) => field.key === "contact_person.email"),
		).toEqual(
			expect.objectContaining({
				label: "Ansprechperson E-Mail Adresse",
				relationLabel: "Ansprechperson",
				relationShortLabel: "AP",
			}),
		);
	});

	it("submits updated global field order after field permission rows are reordered", async () => {
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
		const fieldPermissionsField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"fieldPermissions",
		) as
			| {
					fieldPermissions?: {
						onReorderFields?: (
							sectionId: string,
							fields: { key: string; label: string }[],
						) => void;
					};
			  }
			| undefined;

		await act(async () => {
			fieldPermissionsField?.fieldPermissions?.onReorderFields?.(
				"institution",
				[
					{ key: "email", label: "Email" },
					{ key: "name", label: "Name" },
				],
			);
		});
		await lastFormConfig?.onSubmit({
			name: "Updated role",
			description: "Updated description",
			tablePermissions: {},
			fieldPermissions: {
				name: ["read"],
				email: ["download"],
			},
		});

		await waitFor(() => {
			expect(mockedCreateRole).toHaveBeenCalledWith(
				expect.objectContaining({
					fieldPermissions: expect.arrayContaining([
						expect.objectContaining({
							field: "email",
							action: "download",
						}),
						expect.objectContaining({
							field: "name",
							action: "read",
						}),
					]),
					fieldOrder: expect.objectContaining({
						table: "institution",
						fields: expect.arrayContaining(["email", "name"]),
					}),
				}),
			);
			const submittedFieldOrder =
				mockedCreateRole.mock.calls[0]?.[0]?.fieldOrder?.fields ?? [];
			expect(submittedFieldOrder.indexOf("email")).toBeLessThan(
				submittedFieldOrder.indexOf("name"),
			);
		});
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
