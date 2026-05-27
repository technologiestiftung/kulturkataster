"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import { FormWrapperLoadingSkeleton } from "@/components/FormWrapper/FormWrapperLoadingSkeleton";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionMultiSelect } from "@/lib/hooks/useInstitutionMultiSelect";
import {
	getSubmitLabel,
	toNumberArray,
	toOptionalNumber,
} from "@/lib/utils/formUtils";
import {
	createUser,
	getUserById,
	deleteUser,
	sendPasswordReset,
	updateUser,
} from "@/server/actions/users";
import type { UserStatus } from "@/generated/prisma";
import type { User } from "@/types/user";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import Mail from "@/icons/mail.svg";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { UserTemplateEmailPanel } from "./UserTemplateEmailPanel";

type UserFormModalProps = {
	mode: "create" | "edit";
	userId?: string;
	shouldRefresh?: boolean;
	routePath?: string;
	returnTo?: string;
};

const getInitialValues = (resolvedUser?: User) => ({
	email: resolvedUser?.email ?? "",
	first_name: resolvedUser?.first_name ?? "",
	last_name: resolvedUser?.last_name ?? "",
	status: resolvedUser?.status ?? "approval_pending",
	account_type: resolvedUser?.account_type ?? "",
	meta_info: resolvedUser?.meta_info ?? {},
	compliance: resolvedUser?.compliance ?? false,
	roleId: resolvedUser?.role?.id ? String(resolvedUser.role.id) : "",
	groupIds: resolvedUser?.groups?.map((group) => String(group.id)) ?? [],
	institutionIds:
		resolvedUser?.institutions?.map((institution) => String(institution.id)) ??
		[],
});

type UserFormConfigArgs = {
	mode: UserFormModalProps["mode"];
	t: (key: string) => string;
	tCommon: (key: string) => string;
	statusOptions: { value: string; label: string }[];
	roles: { id: number; name: string }[];
	groups: { id: number; name: string }[];
	institutionOptions: { value: string; label: string; searchText?: string }[];
	filteredInstitutionOptions: {
		value: string;
		label: string;
		searchText?: string;
	}[];
	institutionFilterPanel: ReactNode;
	resolvedUser?: User;
	submitting: boolean;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
};

type UseResolvedUserResult = {
	resolvedUser?: User;
	isWaitingForUser: boolean;
	showNotFound: boolean;
};

const useResolvedUser = (
	mode: UserFormModalProps["mode"],
	userId: string | undefined,
	users: User[],
): UseResolvedUserResult => {
	const [fetchedUser, setFetchedUser] = useState<User | null>(null);
	const [isFetchingUser, setIsFetchingUser] = useState(false);
	const [hasFetchedUser, setHasFetchedUser] = useState(false);

	const user = useMemo<User | undefined>(() => {
		if (mode !== "edit" || !userId) return undefined;
		return users.find((item) => item.id === userId);
	}, [mode, userId, users]);

	useEffect(() => {
		if (mode !== "edit" || !userId || user || hasFetchedUser) return;

		let isMounted = true;
		setIsFetchingUser(true);
		void getUserById(userId)
			.then((result) => {
				if (!isMounted) return;
				setFetchedUser(result ?? null);
			})
			.catch(() => {
				if (!isMounted) return;
				setFetchedUser(null);
			})
			.finally(() => {
				if (!isMounted) return;
				setHasFetchedUser(true);
				setIsFetchingUser(false);
			});

		return () => {
			isMounted = false;
		};
	}, [mode, userId, user, hasFetchedUser]);

	const resolvedUser = user ?? fetchedUser ?? undefined;
	const isWaitingForUser =
		mode === "edit" && !resolvedUser && (isFetchingUser || !hasFetchedUser);
	const showNotFound = mode === "edit" && !isWaitingForUser && !resolvedUser;

	return { resolvedUser, isWaitingForUser, showNotFound };
};

const translateUserFormError = (
	t: (key: string) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "emailTaken":
			return t("content.userFormModal.errors.emailTaken");
		case "notFound":
			return t("content.userFormModal.errors.notFound");
		case "forbidden":
			return t("content.userFormModal.errors.forbidden");
		case "invalidInput":
			return t("content.userFormModal.errors.invalidInput");
		default:
			return t("content.userFormModal.errors.unexpected");
	}
};

const translateUserPasswordResetError = (
	t: (key: string) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "notFound":
			return t("content.userFormModal.errors.notFound");
		case "forbidden":
			return t("content.userFormModal.errors.forbidden");
		default:
			return t("content.userFormModal.passwordReset.error");
	}
};

const useUserSubmit = (
	mode: UserFormModalProps["mode"],
	userId: string | undefined,
	onClose: () => void,
	onSuccess: (mode: UserFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
	onError: (message: string) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const addUser = useAccountStore((state) => state.addUser);
	const upsertUser = useAccountStore((state) => state.upsertUser);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const groupIds = toNumberArray(data.groupIds);
		const institutionIds = toNumberArray(data.institutionIds);
		const roleId = toOptionalNumber(data.roleId);
		const rawMetaInfo =
			data.meta_info && typeof data.meta_info === "object"
				? JSON.stringify(data.meta_info)
				: undefined;
		const status = (data.status || undefined) as UserStatus | undefined;

		try {
			if (mode === "create") {
				const result = await createUser({
					email: String(data.email ?? ""),
					first_name: String(data.first_name ?? ""),
					last_name: String(data.last_name ?? ""),
					status,
					compliance: Boolean(data.compliance),
					account_type:
						typeof data.account_type === "string"
							? data.account_type
							: undefined,
					meta_info: rawMetaInfo,
					roleId,
					groupIds: groupIds.length > 0 ? groupIds : undefined,
					institutionIds:
						institutionIds.length > 0 ? institutionIds : undefined,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				addUser(result.data);
			} else if (userId) {
				const result = await updateUser({
					id: userId,
					email: String(data.email ?? ""),
					first_name: String(data.first_name ?? ""),
					last_name: String(data.last_name ?? ""),
					status,
					compliance: Boolean(data.compliance),
					account_type:
						typeof data.account_type === "string"
							? data.account_type
							: undefined,
					meta_info: rawMetaInfo,
					roleId,
					groupIds,
					institutionIds,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				if (result.data) {
					upsertUser(result.data);
				}
			}

			onSuccess(mode);
			triggerAccountRefresh(["users", "entityAudits"]);
			if (shouldRefresh) {
				router.refresh();
			}
			onClose();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred. Please try again.";
			onError(message);
		} finally {
			setSubmitting(false);
		}
	};

	return { handleSubmit, submitting };
};

const buildUserFormConfig = ({
	mode,
	t,
	tCommon,
	statusOptions,
	roles,
	groups,
	institutionOptions,
	filteredInstitutionOptions,
	institutionFilterPanel,
	resolvedUser,
	submitting,
	onSubmit,
	onCancel,
}: UserFormConfigArgs): FormWrapperConfig => {
	const accessCondition = () => mode === "edit" && Boolean(resolvedUser);

	return {
		fields: [
			{
				name: "identitySection",
				type: "section",
				layout: { columns: 2 },
				fields: [
					{
						name: "email",
						label: t("content.userFormModal.form.identity.fields.email.label"),
						type: "email",
						required: true,
						placeholder: t(
							"content.userFormModal.form.identity.fields.email.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "first_name",
						label: t(
							"content.userFormModal.form.identity.fields.firstName.label",
						),
						type: "text",
						placeholder: t(
							"content.userFormModal.form.identity.fields.firstName.placeholder",
						),
						layout: { span: "half" },
					},
					{
						name: "last_name",
						label: t(
							"content.userFormModal.form.identity.fields.lastName.label",
						),
						type: "text",
						placeholder: t(
							"content.userFormModal.form.identity.fields.lastName.placeholder",
						),
						layout: { span: "half" },
					},
					{
						name: "status",
						label: t("content.userFormModal.form.identity.fields.status.label"),
						type: "select",
						layout: { span: "half" },
						options: statusOptions,
					},
					{
						name: "account_type",
						label: t(
							"content.userFormModal.form.identity.fields.accountType.label",
						),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"content.userFormModal.form.identity.fields.accountType.placeholder",
						),
					},
					{
						name: "meta_info",
						label:
							resolvedUser?.meta_info &&
							typeof resolvedUser.meta_info === "object" &&
							Object.keys(resolvedUser.meta_info).length > 0
								? t("content.userFormModal.form.identity.fields.metaInfo.label")
								: null,
						type: "keyValue",
						layout: { span: "full" },
						keyValue: {
							valuePlaceholder: t(
								"content.userFormModal.form.identity.fields.metaInfo.valuePlaceholder",
							),
							allowAdd: false,
							keyReadOnly: true,
							keyLabels: {
								organizationName: tCommon(
									"common.auth.register.organizationName",
								),
								organizationPhone: tCommon(
									"common.auth.register.organizationPhone",
								),
								organizationPosition: tCommon(
									"common.auth.register.organizationPosition",
								),
								districtName: tCommon("common.auth.register.districtName"),
								districtOffice: tCommon("common.auth.register.districtOffice"),
								districtPhone: tCommon("common.auth.register.districtPhone"),
								districtPosition: tCommon(
									"common.auth.register.districtPosition",
								),
								administrationName: tCommon(
									"common.auth.register.administrationName",
								),
								administrationPhone: tCommon(
									"common.auth.register.administrationPhone",
								),
								administrationPosition: tCommon(
									"common.auth.register.administrationPosition",
								),
							},
						},
					},
				],
			},
			{
				name: "accessSection",
				type: "section",
				title: t("content.userFormModal.form.access.title"),
				fields: [
					{
						name: "roleId",
						label: t("content.userFormModal.form.access.fields.role.label"),
						type: "select",
						required: true,
						placeholder: t(
							"content.userFormModal.form.access.fields.role.placeholder",
						),
						options: roles.map((role) => ({
							value: String(role.id),
							label: role.name,
						})),
						layout: { span: "full" },
					},
					{
						name: "groupIds",
						label: t("content.userFormModal.form.access.fields.groups.label"),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"content.userFormModal.form.access.fields.groups.placeholder",
						),
						searchPlaceholder: t(
							"content.userFormModal.form.access.fields.groups.searchPlaceholder",
						),
						emptyText: t(
							"content.userFormModal.form.access.fields.groups.emptyText",
						),
						options: groups.map((group) => ({
							value: String(group.id),
							label: group.name,
						})),
						layout: { span: "full" },
					},
					{
						name: "institutionIds",
						label: t(
							"content.userFormModal.form.access.fields.institutions.label",
						),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"content.userFormModal.form.access.fields.institutions.placeholder",
						),
						searchPlaceholder: t(
							"content.userFormModal.form.access.fields.institutions.searchPlaceholder",
						),
						emptyText: t(
							"content.userFormModal.form.access.fields.institutions.emptyText",
						),
						previewCount: 3,
						options: institutionOptions,
						multiselectFilteredOptions: filteredInstitutionOptions,
						multiselectFilterPanel: institutionFilterPanel,
						layout: { span: "full" },
					},
					{
						name: "templateEmailPanel",
						type: "custom",
						layout: { span: "full" },
						condition: accessCondition,
						customField: resolvedUser ? (
							<UserTemplateEmailPanel user={resolvedUser} t={t} />
						) : null,
					},
					{
						name: "passwordReset",
						label: "",
						type: "actionPanel",
						layout: { span: "full" },
						condition: accessCondition,
						actionPanel: {
							title: t("content.userFormModal.passwordReset.title"),
							description: t("content.userFormModal.passwordReset.description"),
							actionLabel: t("content.userFormModal.passwordReset.send"),
							actionLabelLoading: t(
								"content.userFormModal.passwordReset.sending",
							),
							errorFallback: t("content.userFormModal.passwordReset.error"),
							icon: <Mail className="h-5 w-5 text-primary-dark" />,
							onAction: async () => {
								if (!resolvedUser) return null;
								const result = await sendPasswordReset(resolvedUser.email);
								if (!result.ok) {
									throw new Error(
										translateUserPasswordResetError(t, result.error),
									);
								}
								return t("content.userFormModal.passwordReset.success");
							},
						},
					},
				],
			},
		],

		onSubmit,
		showCancel: true,
		cancelLabel: t("content.userFormModal.actions.cancel"),
		onCancel,
		submitLabel: getSubmitLabel(mode, submitting, {
			create: {
				default: t("content.userFormModal.actions.create"),
				loading: t("content.userFormModal.actions.creating"),
			},
			edit: {
				default: t("content.userFormModal.actions.save"),
				loading: t("content.userFormModal.actions.saving"),
			},
		}),
		initialValues: getInitialValues(resolvedUser),
	};
};

const getDialogTitle = (
	mode: UserFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("content.userFormModal.dialog.title.create")
		: t("content.userFormModal.dialog.title.edit");

const renderDialogBody = (
	isWaitingForUser: boolean,
	formConfig: FormWrapperConfig,
	resolvedUser: User | undefined,
	mode: UserFormModalProps["mode"],
) => {
	if (isWaitingForUser) {
		return <FormWrapperLoadingSkeleton />;
	}
	return <FormWrapper key={resolvedUser?.id ?? mode} config={formConfig} />;
};

export function UserFormModal({
	mode,
	userId,
	shouldRefresh = false,
	routePath,
	returnTo,
}: UserFormModalProps) {
	const { t } = useTranslation();
	const { t: tCommon } = useTranslation();
	const { t: tEnum, i18n } = useTranslation();
	const users = useAccountStore((state) => state.users);
	const roles = useAccountStore((state) => state.roles);
	const groups = useAccountStore((state) => state.groups);
	const removeUser = useAccountStore((state) => state.removeUser);
	const institutions =
		useInstitutionStore((state) => state.allInstitutions) ?? [];
	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteError, setDeleteError] = useState<{
		title: string;
		description: string;
	} | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const handleClose = useRoutedModalClose({
		returnTo,
	});

	const { resolvedUser, isWaitingForUser, showNotFound } = useResolvedUser(
		mode,
		userId,
		users,
	);

	const handleSuccess = (nextMode: UserFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "userFormModal.feedback.create"
				: "userFormModal.feedback.update";
		showSuccessToast(
			t(`content.${keyPrefix}.title`),
			t(`content.${keyPrefix}.description`),
		);
	};
	const { handleSubmit, submitting } = useUserSubmit(
		mode,
		userId,
		handleClose,
		handleSuccess,
		shouldRefresh,
		(errorCode) => setSubmitError(translateUserFormError(t, errorCode)),
	);

	const statusOptions = useMemo(
		() => [
			{
				value: "approval_pending",
				label: t("content.userFormModal.status.approvalPending"),
			},
			{ value: "active", label: t("content.userFormModal.status.active") },
			{ value: "banned", label: t("content.userFormModal.status.banned") },
		],

		[t],
	);
	const { institutionOptions, filteredInstitutionOptions, filterPanel } =
		useInstitutionMultiSelect({
			institutions,
			categories,
			locale: i18n.language,
			tEnum,
		});

	const formConfig = useMemo(() => {
		const baseConfig = buildUserFormConfig({
			mode,
			t,
			tCommon,
			statusOptions,
			roles,
			groups,
			institutionOptions,
			filteredInstitutionOptions,
			institutionFilterPanel: filterPanel,
			resolvedUser,
			submitting,
			onSubmit: handleSubmit,
			onCancel: handleClose,
		});
		if (mode !== "edit" || !resolvedUser) return baseConfig;
		return {
			...baseConfig,
			deleteAction: {
				label: t("content.userFormModal.delete.button"),
				onClick: () => setShowDeleteDialog(true),
				disabled: isDeleting || submitting,
				className: "p-0!",
			},
		};
	}, [
		mode,
		t,
		tCommon,
		statusOptions,
		roles,
		groups,
		institutionOptions,
		filteredInstitutionOptions,
		filterPanel,
		resolvedUser,
		submitting,
		isDeleting,
		handleSubmit,
		handleClose,
	]);

	const autoCloseError =
		showNotFound && !isDeleting
			? {
					active: true,
					title: t("content.userFormModal.dialog.notFound.title"),
					description: t("content.userFormModal.dialog.notFound.description"),
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
				showDeleteDialog && resolvedUser
					? {
							open: true,
							status: "warning",
							title: t("content.userFormModal.delete.confirmTitle", {
								defaultValue: "Delete user?",
							}),
							description: t(
								"content.userFormModal.delete.confirmDescription",
								{
									defaultValue:
										"This will permanently remove the user. This action cannot be undone.",
								},
							),
							confirmLabel: t("content.userFormModal.delete.confirm"),
							cancelLabel: t("content.userFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting) return;
								setIsDeleting(true);
								const result = await deleteUser(resolvedUser.id);
								if (!result.ok) {
									setDeleteError({
										title: t("content.userFormModal.delete.errorTitle", {
											defaultValue: "Delete failed",
										}),
										description: translateUserFormError(t, result.error),
									});
									setShowDeleteDialog(false);
									setIsDeleting(false);
									return;
								}
								handleClose();
								triggerAccountRefresh(["users", "entityAudits"]);
								try {
									queueMicrotask(() => {
										removeUser(resolvedUser.id);
										showSuccessToast(
											t("content.userFormModal.feedback.delete.title", {
												defaultValue: "User deleted",
											}),
											t("content.userFormModal.feedback.delete.description", {
												defaultValue: "The user has been removed successfully.",
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
							title: deleteError ? deleteError.title : t("content.error"),
							description: deleteError?.description ?? submitError ?? "",
							confirmLabel: t("content.close"),
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
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col gap-4">
						{renderDialogBody(isWaitingForUser, formConfig, resolvedUser, mode)}
					</div>
				)}
			</div>
		</Modal>
	);
}
