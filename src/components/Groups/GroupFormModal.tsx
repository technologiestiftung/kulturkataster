"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import { FormWrapperLoadingSkeleton } from "@/components/FormWrapper/FormWrapperLoadingSkeleton";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useInstitutionMultiSelect } from "@/lib/hooks/useInstitutionMultiSelect";
import {
	getSubmitLabel,
	toNumberArray,
	toOptionalText,
	toStringArray,
} from "@/lib/utils/formUtils";
import {
	createGroup,
	deleteGroup,
	getGroupById,
	updateGroup,
} from "@/server/actions/groups";
import type { Group } from "@/types/group";
import { useRouter } from "next/navigation";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";

type GroupFormModalProps = {
	mode: "create" | "edit";
	groupId?: string;
	shouldRefresh?: boolean;
	routePath?: string;
	returnTo?: string;
};

const getInitialValues = (resolvedGroup?: Group) => ({
	name: resolvedGroup?.name ?? "",
	description: resolvedGroup?.description ?? "",
	userIds: resolvedGroup?.users?.map((userItem) => userItem.id) ?? [],
	institutionIds:
		resolvedGroup?.institutions?.map((institution) => String(institution.id)) ??
		[],
});

const translateGroupFormError = (
	t: (key: string) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "nameTaken":
			return t("content.groupFormModal.errors.nameTaken");
		case "notFound":
			return t("content.groupFormModal.errors.notFound");
		case "forbidden":
			return t("content.groupFormModal.errors.forbidden");
		default:
			return t("content.groupFormModal.errors.unexpected");
	}
};

const getDialogTitle = (
	mode: GroupFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("content.groupFormModal.dialog.title.create")
		: t("content.groupFormModal.dialog.title.edit");

const renderDialogBody = (
	isWaitingForGroup: boolean,
	formConfig: FormWrapperConfig,
	resolvedGroup: Group | undefined,
	mode: GroupFormModalProps["mode"],
) => {
	if (isWaitingForGroup) {
		return <FormWrapperLoadingSkeleton />;
	}

	return <FormWrapper key={resolvedGroup?.id ?? mode} config={formConfig} />;
};

type UseResolvedGroupResult = {
	numericGroupId?: number;
	resolvedGroup?: Group;
	isWaitingForGroup: boolean;
	showNotFound: boolean;
};

const useResolvedGroup = (
	mode: GroupFormModalProps["mode"],
	groupId: string | undefined,
	groups: Group[],
): UseResolvedGroupResult => {
	const [fetchedGroup, setFetchedGroup] = useState<Group | null>(null);
	const [isFetchingGroup, setIsFetchingGroup] = useState(false);
	const [hasFetchedGroup, setHasFetchedGroup] = useState(false);

	const numericGroupId = useMemo(() => {
		if (!groupId) return undefined;
		const parsed = Number(groupId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [groupId]);

	const group = useMemo<Group | undefined>(() => {
		if (mode !== "edit" || !numericGroupId) return undefined;
		return groups.find((item) => item.id === numericGroupId);
	}, [mode, numericGroupId, groups]);

	useEffect(() => {
		if (mode !== "edit" || !numericGroupId || group || hasFetchedGroup) return;

		let isMounted = true;
		setIsFetchingGroup(true);
		void getGroupById(numericGroupId)
			.then((result) => {
				if (!isMounted) return;
				setFetchedGroup(result ?? null);
			})
			.catch(() => {
				if (!isMounted) return;
				setFetchedGroup(null);
			})
			.finally(() => {
				if (!isMounted) return;
				setHasFetchedGroup(true);
				setIsFetchingGroup(false);
			});

		return () => {
			isMounted = false;
		};
	}, [mode, numericGroupId, group, hasFetchedGroup]);

	const resolvedGroup = group ?? fetchedGroup ?? undefined;
	const isWaitingForGroup =
		mode === "edit" && !resolvedGroup && (isFetchingGroup || !hasFetchedGroup);
	const showNotFound = mode === "edit" && !isWaitingForGroup && !resolvedGroup;

	return { numericGroupId, resolvedGroup, isWaitingForGroup, showNotFound };
};

const useGroupSubmit = (
	mode: GroupFormModalProps["mode"],
	numericGroupId: number | undefined,
	onClose: () => void,
	onSuccess: (mode: GroupFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
	onError: (message: string) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const addGroup = useAccountStore((state) => state.addGroup);
	const upsertGroup = useAccountStore((state) => state.upsertGroup);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const userIds = toStringArray(data.userIds);
		const institutionIds = toNumberArray(data.institutionIds);
		const description = toOptionalText(data.description);

		try {
			if (mode === "create") {
				const result = await createGroup({
					name: String(data.name ?? ""),
					description,
					userIds: userIds.length > 0 ? userIds : undefined,
					institutionIds:
						institutionIds.length > 0 ? institutionIds : undefined,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				addGroup(result.data);
			} else if (numericGroupId) {
				const result = await updateGroup({
					id: numericGroupId,
					name: String(data.name ?? ""),
					description,
					userIds,
					institutionIds,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				if (result.data) {
					upsertGroup(result.data);
				}
			}

			onSuccess(mode);
			triggerAccountRefresh(["groups", "entityAudits"]);
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

type GroupFormConfigArgs = {
	mode: GroupFormModalProps["mode"];
	t: (key: string) => string;
	userOptions: {
		value: string;
		label: string;
		searchText?: string;
		filterValues?: Record<string, string[]>;
	}[];
	institutionOptions: { value: string; label: string; searchText?: string }[];
	filteredInstitutionOptions: {
		value: string;
		label: string;
		searchText?: string;
	}[];
	filterPanel: React.ReactNode;
	resolvedGroup?: Group;
	submitting: boolean;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
};

const buildGroupFormConfig = ({
	mode,
	t,
	userOptions,
	institutionOptions,
	filteredInstitutionOptions,
	filterPanel,
	resolvedGroup,
	submitting,
	onSubmit,
	onCancel,
}: GroupFormConfigArgs): FormWrapperConfig => {
	return {
		fields: [
			{
				name: "detailsSection",
				type: "section",
				fields: [
					{
						name: "name",
						label: t("content.groupFormModal.form.details.fields.name.label"),
						type: "text",
						required: true,
						placeholder: t(
							"content.groupFormModal.form.details.fields.name.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "description",
						label: t(
							"content.groupFormModal.form.details.fields.description.label",
						),
						type: "textarea",
						placeholder: t(
							"content.groupFormModal.form.details.fields.description.placeholder",
						),
						layout: { span: "full" },
					},
				],
			},
			{
				name: "membersSection",
				type: "section",
				title: t("content.groupFormModal.form.members.title"),
				fields: [
					{
						name: "userIds",
						label: t("content.groupFormModal.form.members.fields.users.label"),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"content.groupFormModal.form.members.fields.users.placeholder",
						),
						searchPlaceholder: t(
							"content.groupFormModal.form.members.fields.users.searchPlaceholder",
						),
						emptyText: t(
							"content.groupFormModal.form.members.fields.users.emptyText",
						),
						previewCount: 3,
						options: userOptions,
						layout: { span: "full" },
					},
					{
						name: "institutionIds",
						label: t(
							"content.groupFormModal.form.members.fields.institutions.label",
						),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"content.groupFormModal.form.members.fields.institutions.placeholder",
						),
						searchPlaceholder: t(
							"content.groupFormModal.form.members.fields.institutions.searchPlaceholder",
						),
						emptyText: t(
							"content.groupFormModal.form.members.fields.institutions.emptyText",
						),
						previewCount: 3,
						options: institutionOptions,
						multiselectFilteredOptions: filteredInstitutionOptions,
						multiselectFilterPanel: filterPanel,
						layout: { span: "full" },
					},
				],
			},
		],

		onSubmit,
		showCancel: true,
		cancelLabel: t("content.groupFormModal.actions.cancel"),
		onCancel,
		submitLabel: getSubmitLabel(mode, submitting, {
			create: {
				default: t("content.groupFormModal.actions.create"),
				loading: t("content.groupFormModal.actions.creating"),
			},
			edit: {
				default: t("content.groupFormModal.actions.save"),
				loading: t("content.groupFormModal.actions.saving"),
			},
		}),
		initialValues: getInitialValues(resolvedGroup),
	};
};

export function GroupFormModal({
	mode,
	groupId,
	shouldRefresh = false,
	routePath,
	returnTo,
}: GroupFormModalProps) {
	const { t } = useTranslation();
	const { t: tEnum, i18n } = useTranslation();
	const groups = useAccountStore((state) => state.groups);
	const users = useAccountStore((state) => state.users);
	const removeGroup = useAccountStore((state) => state.removeGroup);
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
	const userOptions = useMemo(
		() =>
			users.map((userItem) => {
				const displayName =
					userItem.first_name || userItem.last_name
						? `${userItem.first_name ?? ""} ${userItem.last_name ?? ""}`.trim()
						: userItem.email;
				const roleLabel = userItem.role?.name ?? "";
				const searchText = [displayName, userItem.email, roleLabel]
					.filter(Boolean)
					.join(" ");

				return {
					value: userItem.id,
					label:
						displayName === userItem.email
							? userItem.email
							: `${displayName} (${userItem.email})`,
					searchText,
					filterValues: {
						role: userItem.role?.id ? [String(userItem.role.id)] : [],
					},
				};
			}),
		[users],
	);

	const handleClose = useRoutedModalClose({ returnTo });

	const { numericGroupId, resolvedGroup, isWaitingForGroup, showNotFound } =
		useResolvedGroup(mode, groupId, groups);
	const handleSuccess = (nextMode: GroupFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "groupFormModal.feedback.create"
				: "groupFormModal.feedback.update";
		showSuccessToast(
			t(`content.${keyPrefix}.title`),
			t(`content.${keyPrefix}.description`),
		);
	};
	const { handleSubmit, submitting } = useGroupSubmit(
		mode,
		numericGroupId,
		handleClose,
		handleSuccess,
		shouldRefresh,
		(errorCode) => setSubmitError(translateGroupFormError(t, errorCode)),
	);
	const { institutionOptions, filteredInstitutionOptions, filterPanel } =
		useInstitutionMultiSelect({
			institutions,
			categories,
			locale: i18n.language,
			tEnum,
		});

	const formConfig = useMemo(() => {
		const baseConfig = buildGroupFormConfig({
			mode,
			t,
			userOptions,
			institutionOptions,
			filteredInstitutionOptions,
			filterPanel,
			resolvedGroup,
			submitting,
			onSubmit: handleSubmit,
			onCancel: handleClose,
		});
		if (mode !== "edit" || !resolvedGroup) return baseConfig;
		return {
			...baseConfig,
			deleteAction: {
				label: t("content.groupFormModal.delete.button"),
				onClick: () => setShowDeleteDialog(true),
				disabled: isDeleting || submitting,
				className: "p-0!",
			},
		};
	}, [
		mode,
		t,
		userOptions,
		institutionOptions,
		filteredInstitutionOptions,
		filterPanel,
		resolvedGroup,
		submitting,
		isDeleting,
		handleSubmit,
		handleClose,
		handleSuccess,
	]);

	const autoCloseError =
		showNotFound && !isDeleting
			? {
					active: true,
					title: t("content.groupFormModal.dialog.notFound.title"),
					description: t("content.groupFormModal.dialog.notFound.description"),
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
				showDeleteDialog && resolvedGroup
					? {
							open: true,
							status: "warning",
							title: t("content.groupFormModal.delete.confirmTitle", {
								defaultValue: "Delete group?",
							}),
							description: t(
								"content.groupFormModal.delete.confirmDescription",
								{
									defaultValue:
										"This will permanently remove the group. This action cannot be undone.",
								},
							),
							confirmLabel: t("content.groupFormModal.delete.confirm"),
							cancelLabel: t("content.groupFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting) return;
								setIsDeleting(true);
								const result = await deleteGroup(resolvedGroup.id);
								if (!result.ok) {
									setDeleteError({
										title: t("content.groupFormModal.delete.errorTitle", {
											defaultValue: "Delete failed",
										}),
										description: translateGroupFormError(t, result.error),
									});
									setShowDeleteDialog(false);
									setIsDeleting(false);
									return;
								}
								handleClose();
								triggerAccountRefresh(["groups", "entityAudits"]);
								try {
									queueMicrotask(() => {
										removeGroup(resolvedGroup.id);
										showSuccessToast(
											t("content.groupFormModal.feedback.delete.title", {
												defaultValue: "Group deleted",
											}),
											t("content.groupFormModal.feedback.delete.description", {
												defaultValue:
													"The group has been removed successfully.",
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
			<div className="w-full  max-w-3xl mx-auto">
				<div className="px-6 py-8 md:px-10">
					<DialogTitle className="title">{getDialogTitle(mode, t)}</DialogTitle>
				</div>
				{autoCloseError ? null : (
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col">
						{renderDialogBody(
							isWaitingForGroup,
							formConfig,
							resolvedGroup,
							mode,
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
