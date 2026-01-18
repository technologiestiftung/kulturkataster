"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountStore } from "@/lib/store/accountStore";
import { createRole, getRoleById, updateRole } from "@/server/actions/roles";
import type { Role } from "@/types/role";
import { INSTITUTION_PERMISSION_FIELDS } from "@/types/institution";
import type { Action } from "@/generated/prisma";
import { getSubmitLabel, toOptionalText } from "@/lib/utils/formUtils";

type RoleFormModalProps = {
	mode: "create" | "edit";
	roleId?: string;
};

const INSTITUTION_FIELDS = INSTITUTION_PERMISSION_FIELDS;

const formatFieldLabel = (value: string) =>
	value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDialogTitle = (
	mode: RoleFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("roleFormModal.dialog.title.create")
		: t("roleFormModal.dialog.title.edit");

const renderNotFoundDialog = (t: (key: string) => string) => (
	<AlertDialog
		title={t("roleFormModal.dialog.notFound.title")}
		description={t("roleFormModal.dialog.notFound.description")}
	/>
);

const buildPermissionSnapshot = (
	resolvedRole: Role | undefined,
	tableTargets: { key: string; label: string }[],
) => {
	const tablePermissions = resolvedRole?.table_permissions ?? [];
	const fieldPermissions = resolvedRole?.field_permissions ?? [];
	const allowedTables = new Set(tableTargets.map((table) => table.key));

	const tableValue: Record<string, Action[]> = {};
	const fieldValue: Record<string, Action[]> = {};
	for (const permission of tablePermissions) {
		if (!allowedTables.has(permission.table)) continue;
		if (!tableValue[permission.table]) {
			tableValue[permission.table] = [];
		}
		if (!tableValue[permission.table].includes(permission.action)) {
			tableValue[permission.table].push(permission.action);
		}
	}

	for (const permission of fieldPermissions) {
		if (!fieldValue[permission.field]) {
			fieldValue[permission.field] = [];
		}
		if (!fieldValue[permission.field].includes(permission.action)) {
			fieldValue[permission.field].push(permission.action);
		}
	}
	return { tableValue, fieldValue };
};

const getTableTargets = (t: (key: string) => string) => [
	{
		key: "institution",
		label: t("roleFormModal.permissions.tables.institution"),
	},
	{ key: "user", label: t("roleFormModal.permissions.tables.user") },
	{ key: "group", label: t("roleFormModal.permissions.tables.group") },
	{ key: "role", label: t("roleFormModal.permissions.tables.role") },
	{ key: "address", label: t("roleFormModal.permissions.tables.address") },
	{
		key: "category",
		label: t("roleFormModal.permissions.tables.category"),
	},
];

const getActionLabels = (
	t: (key: string, options?: { ns?: string }) => string,
) => ({
	read: t("institution_action.read", { ns: "enumMap" }),
	create: t("institution_action.create", { ns: "enumMap" }),
	update: t("institution_action.update", { ns: "enumMap" }),
	delete: t("institution_action.delete", { ns: "enumMap" }),
});

const buildFieldSections = (
	t: (key: string, options?: { ns?: string; defaultValue?: string }) => string,
) => [
	{
		id: "institution",
		title: t("roleFormModal.permissions.fields.sections.institution"),
		fields: INSTITUTION_FIELDS.map((field) => ({
			key: field,
			label: t(`field_names.${field}`, {
				ns: "enumMap",
				defaultValue: formatFieldLabel(field),
			}),
		})),
	},
];

type UseResolvedRoleResult = {
	numericRoleId?: number;
	resolvedRole?: Role;
	isWaitingForRole: boolean;
	showNotFound: boolean;
};

const useResolvedRole = (
	mode: RoleFormModalProps["mode"],
	roleId: string | undefined,
	roles: Role[],
): UseResolvedRoleResult => {
	const [fetchedRole, setFetchedRole] = useState<Role | null>(null);
	const [isFetchingRole, setIsFetchingRole] = useState(false);
	const [hasFetchedRole, setHasFetchedRole] = useState(false);

	const numericRoleId = useMemo(() => {
		if (!roleId) return undefined;
		const parsed = Number(roleId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [roleId]);

	const role = useMemo<Role | undefined>(() => {
		if (mode !== "edit" || !numericRoleId) return undefined;
		return roles.find((item) => item.id === numericRoleId);
	}, [mode, numericRoleId, roles]);

	useEffect(() => {
		if (mode !== "edit" || !numericRoleId || role || hasFetchedRole) return;

		let isMounted = true;
		setIsFetchingRole(true);
		void getRoleById(numericRoleId)
			.then((result) => {
				if (!isMounted) return;
				setFetchedRole(result ?? null);
			})
			.catch(() => {
				if (!isMounted) return;
				setFetchedRole(null);
			})
			.finally(() => {
				if (!isMounted) return;
				setHasFetchedRole(true);
				setIsFetchingRole(false);
			});

		return () => {
			isMounted = false;
		};
	}, [mode, numericRoleId, role, hasFetchedRole]);

	const resolvedRole = role ?? fetchedRole ?? undefined;
	const isWaitingForRole =
		mode === "edit" && !resolvedRole && (isFetchingRole || !hasFetchedRole);
	const showNotFound = mode === "edit" && !isWaitingForRole && !resolvedRole;

	return { numericRoleId, resolvedRole, isWaitingForRole, showNotFound };
};

const buildPermissionInputs = (data: Record<string, unknown>) => {
	const tablePermissionsValue =
		(data.tablePermissions as Record<string, Action[]>) ?? {};
	const fieldPermissionsValue =
		(data.fieldPermissions as Record<string, Action[]>) ?? {};
	const tablePermissionsInput = Object.entries(tablePermissionsValue).flatMap(
		([table, actions]) => actions.map((action) => ({ table, action })),
	);
	const fieldPermissionsInput = [
		...Object.entries(fieldPermissionsValue).flatMap(([field, actions]) =>
			actions.map((action) => ({
				table: "institution",
				field,
				action,
			})),
		),
	];
	return { tablePermissionsInput, fieldPermissionsInput };
};

const useRoleSubmit = (
	mode: RoleFormModalProps["mode"],
	numericRoleId: number | undefined,
	onClose: () => void,
	onSuccess: (mode: RoleFormModalProps["mode"]) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const description = toOptionalText(data.description);
		const { tablePermissionsInput, fieldPermissionsInput } =
			buildPermissionInputs(data);

		try {
			if (mode === "create") {
				await createRole({
					name: String(data.name ?? ""),
					description,
					tablePermissions: tablePermissionsInput,
					fieldPermissions: fieldPermissionsInput,
				});
			} else if (numericRoleId) {
				await updateRole({
					id: numericRoleId,
					name: String(data.name ?? ""),
					description,
					tablePermissions: tablePermissionsInput,
					fieldPermissions: fieldPermissionsInput,
				});
			}

			onSuccess(mode);
			router.refresh();
			onClose();
		} finally {
			setSubmitting(false);
		}
	};

	return { handleSubmit, submitting };
};

const buildRoleFormConfig = ({
	mode,
	t,
	resolvedRole,
	submitting,
	permissionSnapshot,
	onSubmit,
	onCancel,
}: {
	mode: RoleFormModalProps["mode"];
	t: (key: string) => string;
	resolvedRole?: Role;
	submitting: boolean;
	permissionSnapshot: {
		tableValue: Record<string, Action[]>;
		fieldValue: Record<string, Action[]>;
	};
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
}): FormWrapperConfig => ({
	sections: [
		{
			id: "details",
			title: t("roleFormModal.form.details.title"),
			description:
				mode === "create"
					? t("roleFormModal.form.details.description.create")
					: t("roleFormModal.form.details.description.edit"),
			fields: [
				{
					name: "name",
					label: t("roleFormModal.form.details.fields.name.label"),
					type: "text",
					required: true,
					placeholder: t("roleFormModal.form.details.fields.name.placeholder"),
					gridColumn: "full",
				},
				{
					name: "description",
					label: t("roleFormModal.form.details.fields.description.label"),
					type: "textarea",
					placeholder: t(
						"roleFormModal.form.details.fields.description.placeholder",
					),
					gridColumn: "full",
				},
			],
		},
	],
	gridColumns: 2,
	onSubmit,
	showCancel: true,
	cancelLabel: t("roleFormModal.actions.cancel"),
	onCancel,
	submitLabel: getSubmitLabel(mode, submitting, {
		create: {
			default: t("roleFormModal.actions.create"),
			loading: t("roleFormModal.actions.creating"),
		},
		edit: {
			default: t("roleFormModal.actions.save"),
			loading: t("roleFormModal.actions.saving"),
		},
	}),
	initialValues: {
		name: resolvedRole?.name ?? "",
		description: resolvedRole?.description ?? "",
		tablePermissions: permissionSnapshot.tableValue,
		fieldPermissions: permissionSnapshot.fieldValue,
	},
});

const renderDialogBody = (
	isWaitingForRole: boolean,
	t: (key: string) => string,
	formConfig: FormWrapperConfig,
	resolvedRole: Role | undefined,
	mode: RoleFormModalProps["mode"],
	tableTargets: { key: string; label: string }[],
	actionLabels: Record<string, string>,
	fieldSections: {
		id: string;
		title: string;
		fields: { key: string; label: string }[];
	}[],
	isSystemRole: boolean,
) => {
	if (isWaitingForRole) {
		return (
			<p className="text-foreground">{t("roleFormModal.dialog.loading")}</p>
		);
	}

	return (
		<Card variant="secondary">
			<CardContent>
				<FormWrapper
					key={resolvedRole?.id ?? mode}
					config={{
						...formConfig,
						sections: [
							...formConfig.sections!,
							{
								id: "permissions",
								title: t("roleFormModal.permissions.title"),
								fields: [
									{
										name: "tablePermissions",
										label: t("roleFormModal.permissions.table.title"),
										description: t(
											"roleFormModal.permissions.table.description",
										),
										type: "tablePermissions",
										disabled: isSystemRole,
										tablePermissions: {
											tables: tableTargets,
											actionLabels,
										},
										gridColumn: "full",
									},
									{
										name: "fieldPermissions",
										label: t("roleFormModal.permissions.fields.title"),
										description: t(
											"roleFormModal.permissions.fields.description",
										),
										type: "fieldPermissions",
										fieldPermissions: {
											sections: fieldSections,
											actionLabels,
											fieldLabel: t(
												"roleFormModal.permissions.fields.columnLabel",
											),
										},
										gridColumn: "full",
									},
								],
							},
						],
					}}
				/>
			</CardContent>
		</Card>
	);
};

export function RoleFormModal({ mode, roleId }: RoleFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation(["content", "enumMap"]);
	const roles = useAccountStore((state) => state.roles);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);

	const handleClose = () => {
		router.back();
	};

	const { numericRoleId, resolvedRole, isWaitingForRole, showNotFound } =
		useResolvedRole(mode, roleId, roles);
	const handleSuccess = (nextMode: RoleFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "roleFormModal.feedback.create"
				: "roleFormModal.feedback.update";
		setAlertDialog({
			title: t(`${keyPrefix}.title`),
			description: t(`${keyPrefix}.description`),
		});
	};
	const { handleSubmit, submitting } = useRoleSubmit(
		mode,
		numericRoleId,
		handleClose,
		handleSuccess,
	);

	const tableTargets = useMemo(() => getTableTargets(t), [t]);
	const actionLabels = useMemo(() => getActionLabels(t), [t]);
	const fieldSections = useMemo(() => buildFieldSections(t), [t]);
	const isSystemRole = resolvedRole?.is_system ?? false;
	const permissionSnapshot = useMemo(
		() => buildPermissionSnapshot(resolvedRole, tableTargets),
		[resolvedRole, tableTargets],
	);

	const formConfig = useMemo(
		() =>
			buildRoleFormConfig({
				mode,
				t,
				resolvedRole,
				submitting,
				permissionSnapshot,
				onSubmit: handleSubmit,
				onCancel: handleClose,
			}),
		[
			mode,
			t,
			resolvedRole,
			submitting,
			permissionSnapshot,
			handleSubmit,
			handleClose,
			handleSuccess,
		],
	);

	if (showNotFound) {
		return renderNotFoundDialog(t);
	}

	return (
		<Dialog open>
			<DialogContent
				variant="entityEdit"
				showBackButton={false}
				className="p-0"
			>
				<div className="flex h-full flex-col">
					<div className="px-6 py-8 md:px-10">
						<DialogTitle className="title">
							{getDialogTitle(mode, t)}
						</DialogTitle>
					</div>
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
						{renderDialogBody(
							isWaitingForRole,
							t,
							formConfig,
							resolvedRole,
							mode,
							tableTargets,
							actionLabels,
							fieldSections,
							isSystemRole,
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
