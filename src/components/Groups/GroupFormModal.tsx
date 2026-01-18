"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { Card, CardContent } from "@/components/ui/card";
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
	getGroupById,
	updateGroup,
} from "@/server/actions/groups";
import type { Group } from "@/types/group";
import { useRouter } from "next/navigation";

type GroupFormModalProps = {
	mode: "create" | "edit";
	groupId?: string;
};

const getInitialValues = (resolvedGroup?: Group) => ({
	name: resolvedGroup?.name ?? "",
	description: resolvedGroup?.description ?? "",
	userIds: resolvedGroup?.users?.map((userItem) => userItem.id) ?? [],
	institutionIds:
		resolvedGroup?.institutions?.map((institution) => String(institution.id)) ??
		[],
});

const getDialogTitle = (
	mode: GroupFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("groupFormModal.dialog.title.create")
		: t("groupFormModal.dialog.title.edit");

const renderNotFoundDialog = (t: (key: string) => string) => (
	<AlertDialog
		title={t("groupFormModal.dialog.notFound.title")}
		description={t("groupFormModal.dialog.notFound.description")}
	/>
);

const renderDialogBody = (
	isWaitingForGroup: boolean,
	t: (key: string) => string,
	formConfig: FormWrapperConfig,
	resolvedGroup: Group | undefined,
	mode: GroupFormModalProps["mode"],
) => {
	if (isWaitingForGroup) {
		return (
			<p className="text-foreground">{t("groupFormModal.dialog.loading")}</p>
		);
	}

	return (
		<Card variant="secondary">
			<CardContent>
				<FormWrapper key={resolvedGroup?.id ?? mode} config={formConfig} />
			</CardContent>
		</Card>
	);
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
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const userIds = toStringArray(data.userIds);
		const institutionIds = toNumberArray(data.institutionIds);
		const description = toOptionalText(data.description);

		try {
			if (mode === "create") {
				await createGroup({
					name: String(data.name ?? ""),
					description,
					userIds: userIds.length > 0 ? userIds : undefined,
					institutionIds:
						institutionIds.length > 0 ? institutionIds : undefined,
				});
			} else if (numericGroupId) {
				await updateGroup({
					id: numericGroupId,
					name: String(data.name ?? ""),
					description,
					userIds,
					institutionIds,
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
		sections: [
			{
				id: "details",
				title: t("groupFormModal.form.details.title"),
				description:
					mode === "create"
						? t("groupFormModal.form.details.description.create")
						: t("groupFormModal.form.details.description.edit"),
				fields: [
					{
						name: "name",
						label: t("groupFormModal.form.details.fields.name.label"),
						type: "text",
						required: true,
						placeholder: t(
							"groupFormModal.form.details.fields.name.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "description",
						label: t("groupFormModal.form.details.fields.description.label"),
						type: "textarea",
						placeholder: t(
							"groupFormModal.form.details.fields.description.placeholder",
						),
						gridColumn: "full",
					},
				],
			},
			{
				id: "members",
				title: t("groupFormModal.form.members.title"),
				fields: [
					{
						name: "userIds",
						label: t("groupFormModal.form.members.fields.users.label"),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"groupFormModal.form.members.fields.users.placeholder",
						),
						searchPlaceholder: t(
							"groupFormModal.form.members.fields.users.searchPlaceholder",
						),
						emptyText: t("groupFormModal.form.members.fields.users.emptyText"),
						previewCount: 3,
						options: userOptions,
						gridColumn: "full",
					},
					{
						name: "institutionIds",
						label: t("groupFormModal.form.members.fields.institutions.label"),
						type: "multiselect",
						multiselectVariant: "modal",
						placeholder: t(
							"groupFormModal.form.members.fields.institutions.placeholder",
						),
						searchPlaceholder: t(
							"groupFormModal.form.members.fields.institutions.searchPlaceholder",
						),
						emptyText: t(
							"groupFormModal.form.members.fields.institutions.emptyText",
						),
						previewCount: 3,
						options: institutionOptions,
						multiselectFilteredOptions: filteredInstitutionOptions,
						multiselectFilterPanel: filterPanel,
						gridColumn: "full",
					},
				],
			},
		],
		gridColumns: 2,
		onSubmit,
		showCancel: true,
		cancelLabel: t("groupFormModal.actions.cancel"),
		onCancel,
		submitLabel: getSubmitLabel(mode, submitting, {
			create: {
				default: t("groupFormModal.actions.create"),
				loading: t("groupFormModal.actions.creating"),
			},
			edit: {
				default: t("groupFormModal.actions.save"),
				loading: t("groupFormModal.actions.saving"),
			},
		}),
		initialValues: getInitialValues(resolvedGroup),
	};
};

export function GroupFormModal({ mode, groupId }: GroupFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation("content");
	const { t: tEnum, i18n } = useTranslation("enumMap");
	const groups = useAccountStore((state) => state.groups);
	const users = useAccountStore((state) => state.users);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const institutions =
		useInstitutionStore((state) => state.allInstitutions) ?? [];
	const categories = useInstitutionStore((state) => state.categories) ?? [];
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

	const handleClose = () => {
		router.back();
	};

	const { numericGroupId, resolvedGroup, isWaitingForGroup, showNotFound } =
		useResolvedGroup(mode, groupId, groups);
	const handleSuccess = (nextMode: GroupFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "groupFormModal.feedback.create"
				: "groupFormModal.feedback.update";
		setAlertDialog({
			title: t(`${keyPrefix}.title`),
			description: t(`${keyPrefix}.description`),
		});
	};
	const { handleSubmit, submitting } = useGroupSubmit(
		mode,
		numericGroupId,
		handleClose,
		handleSuccess,
	);
	const { institutionOptions, filteredInstitutionOptions, filterPanel } =
		useInstitutionMultiSelect({
			institutions,
			categories,
			locale: i18n.language,
			tEnum,
		});

	const formConfig = useMemo(
		() =>
			buildGroupFormConfig({
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
			}),
		[
			mode,
			t,
			userOptions,
			institutionOptions,
			filteredInstitutionOptions,
			filterPanel,
			resolvedGroup,
			submitting,
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
							isWaitingForGroup,
							t,
							formConfig,
							resolvedGroup,
							mode,
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
