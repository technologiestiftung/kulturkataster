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
	getUserEmailTemplateOptions,
	sendPasswordReset,
	sendUserEmailTemplate,
	updateUser,
	type UserEmailTemplateOption,
} from "@/server/actions/users";
import type { UserStatus } from "@/generated/prisma";
import type { User } from "@/types/user";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import Mail from "@/icons/mail.svg";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { showErrorToast, showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { AlertDialog } from "@/components/ui/alert-dialog";

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
			return t("userFormModal.errors.emailTaken");
		case "notFound":
			return t("userFormModal.errors.notFound");
		case "forbidden":
			return t("userFormModal.errors.forbidden");
		case "invalidInput":
			return t("userFormModal.errors.invalidInput");
		default:
			return t("userFormModal.errors.unexpected");
	}
};

const translateUserPasswordResetError = (
	t: (key: string) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "notFound":
			return t("userFormModal.errors.notFound");
		case "forbidden":
			return t("userFormModal.errors.forbidden");
		default:
			return t("userFormModal.passwordReset.error");
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
						label: t("userFormModal.form.identity.fields.email.label"),
						type: "email",
						required: true,
						placeholder: t(
							"userFormModal.form.identity.fields.email.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "first_name",
						label: t("userFormModal.form.identity.fields.firstName.label"),
						type: "text",
						placeholder: t(
							"userFormModal.form.identity.fields.firstName.placeholder",
						),
						layout: { span: "half" },
					},
					{
						name: "last_name",
						label: t("userFormModal.form.identity.fields.lastName.label"),
						type: "text",
						placeholder: t(
							"userFormModal.form.identity.fields.lastName.placeholder",
						),
						layout: { span: "half" },
					},
					{
						name: "status",
						label: t("userFormModal.form.identity.fields.status.label"),
						type: "select",
						layout: { span: "half" },
						options: statusOptions,
					},
					{
						name: "account_type",
						label: t("userFormModal.form.identity.fields.accountType.label"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"userFormModal.form.identity.fields.accountType.placeholder",
						),
					},
					{
						name: "meta_info",
						label: t("userFormModal.form.identity.fields.metaInfo.label"),
						type: "keyValue",
						layout: { span: "full" },
						keyValue: {
							valuePlaceholder: t("userFormModal.form.identity.fields.metaInfo.valuePlaceholder"),
							allowAdd: false,
							keyReadOnly: true,
							keyLabels: {
								organizationName: tCommon("auth.register.organizationName"),
								organizationPhone: tCommon("auth.register.organizationPhone"),
								organizationPosition: tCommon("auth.register.organizationPosition"),
								districtName: tCommon("auth.register.districtName"),
								districtOffice: tCommon("auth.register.districtOffice"),
								districtPhone: tCommon("auth.register.districtPhone"),
								districtPosition: tCommon("auth.register.districtPosition"),
								administrationName: tCommon("auth.register.administrationName"),
								administrationPhone: tCommon("auth.register.administrationPhone"),
								administrationPosition: tCommon("auth.register.administrationPosition"),
							},
						},
					},
				],
			},
			{
				name: "accessSection",
				type: "section",
				title: t("userFormModal.form.access.title"),
				fields: [
					{
						name: "roleId",
						label: t("userFormModal.form.access.fields.role.label"),
						type: "select",
						required: true,
						placeholder: t("userFormModal.form.access.fields.role.placeholder"),
						options: roles.map((role) => ({
							value: String(role.id),
							label: role.name,
						})),
						layout: { span: "full" },
					},
					{
						name: "groupIds",
						label: t("userFormModal.form.access.fields.groups.label"),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"userFormModal.form.access.fields.groups.placeholder",
						),
						searchPlaceholder: t(
							"userFormModal.form.access.fields.groups.searchPlaceholder",
						),
						emptyText: t("userFormModal.form.access.fields.groups.emptyText"),
						options: groups.map((group) => ({
							value: String(group.id),
							label: group.name,
						})),
						layout: { span: "full" },
					},
					{
						name: "institutionIds",
						label: t("userFormModal.form.access.fields.institutions.label"),
						type: "multiselect",
						afterField: resolvedUser ? (
							<UserTemplateEmailPanel
								key="template-email-panel"
								user={resolvedUser}
								t={t}
							/>
						) : undefined,
						multiselectVariant: "modal",
						placeholder: t(
							"userFormModal.form.access.fields.institutions.placeholder",
						),
						searchPlaceholder: t(
							"userFormModal.form.access.fields.institutions.searchPlaceholder",
						),
						emptyText: t(
							"userFormModal.form.access.fields.institutions.emptyText",
						),
						previewCount: 3,
						options: institutionOptions,
						multiselectFilteredOptions: filteredInstitutionOptions,
						multiselectFilterPanel: institutionFilterPanel,
						layout: { span: "full" },
					},
					{
						name: "passwordReset",
						label: "",
						type: "actionPanel",
						layout: { span: "full" },
						condition: accessCondition,
						actionPanel: {
							title: t("userFormModal.passwordReset.title"),
							description: t("userFormModal.passwordReset.description"),
							actionLabel: t("userFormModal.passwordReset.send"),
							actionLabelLoading: t("userFormModal.passwordReset.sending"),
							errorFallback: t("userFormModal.passwordReset.error"),
							icon: <Mail className="h-5 w-5 text-primary-dark" />,
							onAction: async () => {
								if (!resolvedUser) return null;
								const result = await sendPasswordReset(resolvedUser.email);
								if (!result.ok) {
									throw new Error(
										translateUserPasswordResetError(t, result.error),
									);
								}
								return t("userFormModal.passwordReset.success");
							},
						},
					},
				],
			},
		],
		onSubmit,
		showCancel: true,
		cancelLabel: t("userFormModal.actions.cancel"),
		onCancel,
		submitLabel: getSubmitLabel(mode, submitting, {
			create: {
				default: t("userFormModal.actions.create"),
				loading: t("userFormModal.actions.creating"),
			},
			edit: {
				default: t("userFormModal.actions.save"),
				loading: t("userFormModal.actions.saving"),
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
		? t("userFormModal.dialog.title.create")
		: t("userFormModal.dialog.title.edit");

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

function UserTemplateEmailPanel({
	user,
	t,
}: {
	user: User;
	t: (key: string) => string;
}) {
	const [templates, setTemplates] = useState<UserEmailTemplateOption[]>([]);
	const [selectedTemplatePath, setSelectedTemplatePath] = useState("");
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	useEffect(() => {
		let isMounted = true;
		setIsLoadingTemplates(true);
		void getUserEmailTemplateOptions()
			.then((result) => {
				if (!isMounted) return;
				if (!result.ok) {
					showErrorToast(
						t("userFormModal.templateEmail.title"),
						t("userFormModal.templateEmail.loadError"),
					);
					setTemplates([]);
					return;
				}
				setTemplates(result.data);
				setSelectedTemplatePath(
					(current) => current || result.data[0]?.path || "",
				);
			})
			.catch(() => {
				if (!isMounted) return;
				showErrorToast(
					t("userFormModal.templateEmail.title"),
					t("userFormModal.templateEmail.loadError"),
				);
			})
			.finally(() => {
				if (!isMounted) return;
				setIsLoadingTemplates(false);
			});

		return () => {
			isMounted = false;
		};
	}, [t]);

	const handleSendTemplate = async () => {
		if (!selectedTemplatePath || isSending) return;
		setIsSending(true);
		try {
			const result = await sendUserEmailTemplate({
				userId: user.id,
				templatePath: selectedTemplatePath,
			});
			if (!result.ok) {
				showErrorToast(
					t("userFormModal.templateEmail.title"),
					t("userFormModal.templateEmail.error"),
				);
				return;
			}
			showSuccessToast(
				t("userFormModal.templateEmail.title"),
				t("userFormModal.templateEmail.success"),
			);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="rounded-sm border border-border bg-background p-4 mt-4">
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary-dark" />
					<Label className="body2">
						{t("userFormModal.templateEmail.title")}
					</Label>
				</div>
				<p className="body2 text-neutral-80">
					{t("userFormModal.templateEmail.description")}
				</p>
				<div className="flex flex-col gap-2 ">
					<div className="flex-1 space-y-1">
						<Select
							value={selectedTemplatePath}
							onValueChange={setSelectedTemplatePath}
							disabled={
								isLoadingTemplates || templates.length === 0 || isSending
							}
						>
							<SelectTrigger id="user-email-template">
								<SelectValue
									placeholder={
										isLoadingTemplates
											? t("userFormModal.templateEmail.loading")
											: t("userFormModal.templateEmail.placeholder")
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{templates.map((template) => (
									<SelectItem key={template.path} value={template.path}>
										{t(
											`userFormModal.templateEmail.templates.${template.key}`,
										) ||
											(template.name ?? template.key)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={!selectedTemplatePath || isLoadingTemplates}
							onClick={() => {
								if (!selectedTemplatePath) return;
								window.open(`/api/emails/${selectedTemplatePath}`, "_blank");
							}}
						>
							{t("userFormModal.templateEmail.preview")}
						</Button>
						<Button
							type="button"
							disabled={
								!selectedTemplatePath || isLoadingTemplates || isSending
							}
							onClick={() => setShowConfirm(true)}
						>
							{t("userFormModal.templateEmail.send")}
						</Button>
					</div>
				</div>
			</div>
			{showConfirm && (
				<AlertDialog
					open
					status="warning"
					title={t("userFormModal.templateEmail.confirmTitle")}
					description={t("userFormModal.templateEmail.confirmDescription", {
						email: user.email,
					} as never)}
					confirmLabel={t("userFormModal.templateEmail.confirmSend")}
					cancelLabel={t("userFormModal.templateEmail.confirmCancel")}
					onConfirm={() => {
						setShowConfirm(false);
						void handleSendTemplate();
					}}
					onCancel={() => setShowConfirm(false)}
					onOpenChange={(open) => {
						if (!open) setShowConfirm(false);
					}}
				/>
			)}
		</div>
	);
}

export function UserFormModal({
	mode,
	userId,
	shouldRefresh = false,
	routePath,
	returnTo,
}: UserFormModalProps) {
	const { t } = useTranslation("content");
	const { t: tCommon } = useTranslation("common");
	const { t: tEnum, i18n } = useTranslation("enumMap");
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
		showSuccessToast(t(`${keyPrefix}.title`), t(`${keyPrefix}.description`));
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
				label: t("userFormModal.status.approvalPending"),
			},
			{ value: "active", label: t("userFormModal.status.active") },
			{ value: "banned", label: t("userFormModal.status.banned") },
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
				label: t("userFormModal.delete.button"),
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
					title: t("userFormModal.dialog.notFound.title"),
					description: t("userFormModal.dialog.notFound.description"),
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
							title: t("userFormModal.delete.confirmTitle", {
								defaultValue: "Delete user?",
							}),
							description: t("userFormModal.delete.confirmDescription", {
								defaultValue:
									"This will permanently remove the user. This action cannot be undone.",
							}),
							confirmLabel: t("userFormModal.delete.confirm"),
							cancelLabel: t("userFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting) return;
								setIsDeleting(true);
								const result = await deleteUser(resolvedUser.id);
								if (!result.ok) {
									setDeleteError({
										title: t("userFormModal.delete.errorTitle", {
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
											t("userFormModal.feedback.delete.title", {
												defaultValue: "User deleted",
											}),
											t("userFormModal.feedback.delete.description", {
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
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col gap-4">
						{renderDialogBody(isWaitingForUser, formConfig, resolvedUser, mode)}
					</div>
				)}
			</div>
		</Modal>
	);
}
