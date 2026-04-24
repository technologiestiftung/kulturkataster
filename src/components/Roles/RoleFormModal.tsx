"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import { FormWrapperLoadingSkeleton } from "@/components/FormWrapper/FormWrapperLoadingSkeleton";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	createRole,
	deleteRole,
	getRoleById,
	updateRole,
} from "@/server/actions/roles";
import type {
	Role,
	RoleActionErrorCode,
	RoleTablePermissionInput,
} from "@/types/role";
import { INSTITUTION_PERMISSION_FIELDS } from "@/types/institution";
import type { Action } from "@/generated/prisma";
import type {
	PermissionAction,
	PermissionScope,
	TablePermissionValue,
} from "@/components/FormWrapper/types";
import { getSubmitLabel, toOptionalText } from "@/lib/utils/formUtils";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";

type RoleFormModalProps = {
	mode: "create" | "edit";
	roleId?: string;
	shouldRefresh?: boolean;
	routePath?: string;
	returnTo?: string;
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

const buildPermissionSnapshot = (
	resolvedRole: Role | undefined,
	tableTargets: { key: string; label: string }[],
) => {
	const tablePermissions = resolvedRole?.table_permissions ?? [];
	const fieldPermissions = resolvedRole?.field_permissions ?? [];
	const allowedTables = new Set(tableTargets.map((table) => table.key));

	const tableValue: Record<string, TablePermissionValue> = {};
	const tableMeta: Record<
		string,
		{ actions: Set<Action>; hasAll: boolean; hasOwn: boolean }
	> = {};
	const fieldValue: Record<string, Action[]> = {};
	for (const permission of tablePermissions) {
		if (!allowedTables.has(permission.table)) continue;
		if (!tableMeta[permission.table]) {
			tableMeta[permission.table] = {
				actions: new Set(),
				hasAll: false,
				hasOwn: false,
			};
		}
		const meta = tableMeta[permission.table];
		meta.actions.add(permission.action);
		if ((permission.scope ?? "own") === "all") {
			meta.hasAll = true;
		} else {
			meta.hasOwn = true;
		}
	}

	Object.entries(tableMeta).forEach(([table, meta]) => {
		tableValue[table] = {
			actions: Array.from(meta.actions) as PermissionAction[],
			scope: meta.hasAll && !meta.hasOwn ? "all" : "own",
		};
	});

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
	{
		key: "submission",
		label: t("roleFormModal.permissions.tables.submission"),
	},
	{
		key: "entity_audit",
		label: t("roleFormModal.permissions.tables.entity_audit"),
		actions: ["read"] as PermissionAction[],
	},
	{ key: "user", label: t("roleFormModal.permissions.tables.user") },
	{ key: "group", label: t("roleFormModal.permissions.tables.group") },
	{ key: "role", label: t("roleFormModal.permissions.tables.role") },
	{
		key: "address",
		label: t("roleFormModal.permissions.tables.address"),
		actions: ["read"] as PermissionAction[],
	},
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
			label: t(`field_names.${field}.label`, {
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
		(data.tablePermissions as Record<
			string,
			TablePermissionValue | Action[]
		>) ?? {};
	const fieldPermissionsValue =
		(data.fieldPermissions as Record<string, Action[]>) ?? {};
	const normalizeScope = (value: unknown): PermissionScope =>
		value === "all" ? "all" : "own";
	const tablePermissionsInput: RoleTablePermissionInput[] = [];
	const defaultScope: PermissionScope = "own";
	Object.entries(tablePermissionsValue).forEach(([table, entry]) => {
		if (Array.isArray(entry)) {
			entry.forEach((action) => {
				tablePermissionsInput.push({
					table,
					action,
					scope: defaultScope,
				});
			});
			return;
		}
		entry.actions.forEach((action) => {
			tablePermissionsInput.push({
				table,
				action,
				scope: normalizeScope(entry.scope),
			});
		});
	});
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

const translateRoleFormError = (
	t: (key: string, options?: { defaultValue?: string }) => string,
	errorCode: RoleActionErrorCode,
) => {
	switch (errorCode) {
		case "nameTaken":
			return t("roleFormModal.errors.nameTaken");
		case "notFound":
			return t("roleFormModal.errors.notFound");
		case "forbidden":
			return t("roleFormModal.errors.forbidden", {
				defaultValue: "You are not allowed to change this role.",
			});
		case "systemRole":
			return t("roleFormModal.errors.systemRole", {
				defaultValue: "System roles cannot be deleted.",
			});
		default:
			return t("roleFormModal.errors.unexpected");
	}
};

const useRoleSubmit = (
	mode: RoleFormModalProps["mode"],
	numericRoleId: number | undefined,
	onClose: () => void,
	onSuccess: (mode: RoleFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
	onError: (errorCode: RoleActionErrorCode) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const addRole = useAccountStore((state) => state.addRole);
	const upsertRole = useAccountStore((state) => state.upsertRole);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const description = toOptionalText(data.description);
		const { tablePermissionsInput, fieldPermissionsInput } =
			buildPermissionInputs(data);

		try {
			if (mode === "create") {
				const result = await createRole({
					name: String(data.name ?? ""),
					description,
					tablePermissions: tablePermissionsInput,
					fieldPermissions: fieldPermissionsInput,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				addRole(result.data);
			} else if (numericRoleId) {
				const result = await updateRole({
					id: numericRoleId,
					name: String(data.name ?? ""),
					description,
					tablePermissions: tablePermissionsInput,
					fieldPermissions: fieldPermissionsInput,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				if (result.data) {
					upsertRole(result.data);
				}
			}

			onSuccess(mode);
			triggerAccountRefresh(["roles", "entityAudits"]);
			if (shouldRefresh) {
				router.refresh();
			}
			onClose();
		} catch {
			onError("unexpected");
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
		tableValue: Record<string, TablePermissionValue>;
		fieldValue: Record<string, Action[]>;
	};
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
}): FormWrapperConfig => ({
	fields: [
		{
			name: "detailsSection",
			type: "section",
			fields: [
				{
					name: "name",
					label: t("roleFormModal.form.details.fields.name.label"),
					type: "text",
					required: true,
					placeholder: t("roleFormModal.form.details.fields.name.placeholder"),
					layout: { span: "full" },
				},
				{
					name: "description",
					label: t("roleFormModal.form.details.fields.description.label"),
					type: "textarea",
					placeholder: t(
						"roleFormModal.form.details.fields.description.placeholder",
					),
					layout: { span: "full" },
				},
			],
		},
	],
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
		return <FormWrapperLoadingSkeleton />;
	}

	return (
		<FormWrapper
			key={resolvedRole?.id ?? mode}
			config={{
				...formConfig,
				fields: [
					...formConfig.fields,
					{
						name: "permissionsSection",
						type: "section",
						title: t("roleFormModal.permissions.title"),
						fields: [
							{
								name: "tablePermissions",
								label: t("roleFormModal.permissions.table.title"),
								description: t("roleFormModal.permissions.table.description"),
								type: "tablePermissions",
								disabled: isSystemRole,
								tablePermissions: {
									tables: tableTargets,
									actionLabels,
									scopeLabel: t("roleFormModal.permissions.scope.label"),
									scopeDescription: t(
										"roleFormModal.permissions.scope.description",
									),
									scopeOptions: [
										{
											value: "own",
											label: t("roleFormModal.permissions.scope.own"),
										},
										{
											value: "all",
											label: t("roleFormModal.permissions.scope.all"),
										},
									],
								},
								layout: { span: "full" },
							},
							{
								name: "fieldPermissions",
								label: t("roleFormModal.permissions.fields.title"),
								description: t("roleFormModal.permissions.fields.description"),
								type: "fieldPermissions",
								fieldPermissions: {
									sections: fieldSections,
									actionLabels,
									fieldLabel: t("roleFormModal.permissions.fields.columnLabel"),
								},
								layout: { span: "full" },
							},
						],
					},
				],
			}}
		/>
	);
};

export function RoleFormModal({
	mode,
	roleId,
	shouldRefresh = false,
	routePath,
	returnTo,
}: RoleFormModalProps) {
	const { t } = useTranslation(["content", "enumMap"]);
	const roles = useAccountStore((state) => state.roles);
	const removeRoleFromStore = useAccountStore((state) => state.removeRole);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteError, setDeleteError] = useState<{
		title: string;
		description: string;
	} | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleClose = useRoutedModalClose({ returnTo });

	const { numericRoleId, resolvedRole, isWaitingForRole, showNotFound } =
		useResolvedRole(mode, roleId, roles);
	const handleSuccess = (nextMode: RoleFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "roleFormModal.feedback.create"
				: "roleFormModal.feedback.update";
		showSuccessToast(t(`${keyPrefix}.title`), t(`${keyPrefix}.description`));
	};
	const { handleSubmit, submitting } = useRoleSubmit(
		mode,
		numericRoleId,
		handleClose,
		handleSuccess,
		shouldRefresh,
		(errorCode) => setSubmitError(translateRoleFormError(t, errorCode)),
	);

	const tableTargets = useMemo(() => getTableTargets(t), [t]);
	const actionLabels = useMemo(() => getActionLabels(t), [t]);
	const fieldSections = useMemo(() => buildFieldSections(t), [t]);
	const isSystemRole = resolvedRole?.is_system ?? false;
	const permissionSnapshot = useMemo(
		() => buildPermissionSnapshot(resolvedRole, tableTargets),
		[resolvedRole, tableTargets],
	);

	const formConfig = useMemo(() => {
		const baseConfig = buildRoleFormConfig({
			mode,
			t,
			resolvedRole,
			submitting,
			permissionSnapshot,
			onSubmit: handleSubmit,
			onCancel: handleClose,
		});
		if (mode !== "edit" || !resolvedRole) return baseConfig;
		return {
			...baseConfig,
			deleteAction: {
				label: t("roleFormModal.delete.button"),
				onClick: () => setShowDeleteDialog(true),
				disabled: isDeleting || submitting || isSystemRole,
				className: "p-0!",
			},
		};
	}, [
		mode,
		t,
		resolvedRole,
		submitting,
		isDeleting,
		permissionSnapshot,
		handleSubmit,
		handleClose,
		handleSuccess,
	]);

	const autoCloseError =
		showNotFound && !isDeleting
			? {
					active: true,
					title: t("roleFormModal.dialog.notFound.title"),
					description: t("roleFormModal.dialog.notFound.description"),
				}
			: undefined;

	return (
		<Modal
			title={getDialogTitle(mode, t)}
			variant="editor"
			hasFooter={false}
			routePath={routePath}
			returnTo={returnTo}
			autoCloseError={autoCloseError}
			confirmDialog={
				showDeleteDialog && resolvedRole
					? {
							open: true,
							status: "warning",
							title: t("roleFormModal.delete.confirmTitle", {
								defaultValue: "Delete role?",
							}),
							description: t("roleFormModal.delete.confirmDescription", {
								defaultValue:
									"This will permanently remove the role. This action cannot be undone.",
							}),
							confirmLabel: t("roleFormModal.delete.confirm"),
							cancelLabel: t("roleFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting || isSystemRole) return;
								setIsDeleting(true);
								const result = await deleteRole(resolvedRole.id);
								if (!result.ok) {
									setDeleteError({
										title: t("roleFormModal.delete.errorTitle", {
											defaultValue: "Delete failed",
										}),
										description: translateRoleFormError(t, result.error),
									});
									setShowDeleteDialog(false);
									setIsDeleting(false);
									return;
								}
								handleClose();
								triggerAccountRefresh(["roles", "entityAudits"]);
								try {
									queueMicrotask(() => {
										removeRoleFromStore(resolvedRole.id);
										showSuccessToast(
											t("roleFormModal.feedback.delete.title", {
												defaultValue: "Role deleted",
											}),
											t("roleFormModal.feedback.delete.description", {
												defaultValue: "The role has been removed successfully.",
											}),
										);
									});
								} finally {
									setIsDeleting(false);
								}
							},
							onOpenChange: (open) => {
								if (!open) setShowDeleteDialog(false);
							},
						}
					: undefined
			}
			errorDialog={
				deleteError || submitError
					? {
							open: true,
							title: deleteError ? deleteError.title : t("error"),
							description: deleteError?.description ?? submitError ?? "",
							confirmLabel: t("close"),
							onConfirm: () => {
								setDeleteError(null);
								setSubmitError(null);
							},
							onOpenChange: (open) => {
								if (!open) {
									setDeleteError(null);
									setSubmitError(null);
								}
							},
						}
					: undefined
			}
		>
			<div className="flex h-full flex-col">
				<div className="px-6 py-8 md:px-10">
					<DialogTitle className="title">{getDialogTitle(mode, t)}</DialogTitle>
				</div>
				{autoCloseError ? null : (
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col">
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
				)}
			</div>
		</Modal>
	);
}
