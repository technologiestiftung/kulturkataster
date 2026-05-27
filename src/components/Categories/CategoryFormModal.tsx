"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import { FormWrapperLoadingSkeleton } from "@/components/FormWrapper/FormWrapperLoadingSkeleton";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	createCategory,
	deleteCategory,
	getCategoryById,
	getCategoryLocalizedLabels,
	uploadCategoryIcon,
	updateCategory,
} from "@/server/actions/categories";
import type { Category } from "@/types";
import type { CategoryStatus } from "@/generated/prisma";
import {
	getSubmitLabel,
	toOptionalNumber,
	toOptionalText,
} from "@/lib/utils/formUtils";
import { getEligibleParentCategories } from "@/lib/utils/categoryUtils";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";

type CategoryFormModalProps = {
	mode: "create" | "edit";
	categoryId?: string;
	shouldRefresh?: boolean;
	routePath?: string;
	returnTo?: string;
};

const getInitialValues = (
	resolvedCategory?: Category,
	localizedLabels?: Record<string, string>,
) => ({
	key: resolvedCategory?.key ?? "",
	description: resolvedCategory?.description ?? "",
	icon: resolvedCategory?.icon ?? "",
	status: resolvedCategory?.status ?? "active",
	parentCategoryId: resolvedCategory?.parent_category_id
		? String(resolvedCategory.parent_category_id)
		: "none",
	removeIcon: false,
	labelDe: localizedLabels?.de ?? "",
	labelEn: localizedLabels?.en ?? "",
});

const getDialogTitle = (
	mode: CategoryFormModalProps["mode"],
	t: (key: string, options?: { defaultValue?: string }) => string,
) =>
	mode === "create"
		? t("content.categoryFormModal.dialog.title.create", {
				defaultValue: "Create category",
			})
		: t("content.categoryFormModal.dialog.title.edit", {
				defaultValue: "Edit category",
			});

const renderDialogBody = (
	isWaitingForCategory: boolean,
	formConfig: FormWrapperConfig,
	resolvedCategory: Category | undefined,
	mode: CategoryFormModalProps["mode"],
) => {
	if (isWaitingForCategory) {
		return <FormWrapperLoadingSkeleton />;
	}

	return <FormWrapper key={resolvedCategory?.id ?? mode} config={formConfig} />;
};

type UseResolvedCategoryResult = {
	numericCategoryId?: number;
	resolvedCategory?: Category;
	isWaitingForCategory: boolean;
	showNotFound: boolean;
};

const useResolvedCategory = (
	mode: CategoryFormModalProps["mode"],
	categoryId: string | undefined,
	categories: Category[],
): UseResolvedCategoryResult => {
	const [fetchedCategory, setFetchedCategory] = useState<Category | null>(null);
	const [isFetchingCategory, setIsFetchingCategory] = useState(false);
	const [hasFetchedCategory, setHasFetchedCategory] = useState(false);

	const numericCategoryId = useMemo(() => {
		if (!categoryId) return undefined;
		const parsed = Number(categoryId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [categoryId]);

	const resolvedCategory = useMemo<Category | undefined>(() => {
		if (mode !== "edit" || !numericCategoryId) return undefined;
		return categories.find((item) => item.id === numericCategoryId);
	}, [mode, numericCategoryId, categories]);

	useEffect(() => {
		if (
			mode !== "edit" ||
			!numericCategoryId ||
			resolvedCategory ||
			hasFetchedCategory
		) {
			return;
		}
		let active = true;
		setIsFetchingCategory(true);
		void getCategoryById(numericCategoryId)
			.then((result) => {
				if (!active) return;
				setFetchedCategory(result ?? null);
			})
			.catch(() => {
				if (!active) return;
				setFetchedCategory(null);
			})
			.finally(() => {
				if (!active) return;
				setHasFetchedCategory(true);
				setIsFetchingCategory(false);
			});
		return () => {
			active = false;
		};
	}, [mode, numericCategoryId, resolvedCategory, hasFetchedCategory]);

	const resolvedCategoryWithFallback =
		resolvedCategory ?? fetchedCategory ?? undefined;

	const isWaitingForCategory =
		mode === "edit" &&
		!resolvedCategoryWithFallback &&
		(isFetchingCategory || !hasFetchedCategory);
	const showNotFound =
		mode === "edit" && !isWaitingForCategory && !resolvedCategoryWithFallback;

	return {
		numericCategoryId,
		resolvedCategory: resolvedCategoryWithFallback,
		isWaitingForCategory,
		showNotFound,
	};
};

const translateCategoryFormError = (
	t: (key: string, options?: { defaultValue?: string }) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "keyTaken":
			return t("content.categoryFormModal.errors.keyTaken", {
				defaultValue: "A category with this key already exists.",
			});
		case "notFound":
			return t("content.categoryFormModal.errors.notFound", {
				defaultValue: "The selected category no longer exists.",
			});
		case "keyLocked":
			return t("content.categoryFormModal.errors.keyLocked", {
				defaultValue: "The category key cannot be changed.",
			});
		case "selfParent":
			return t("content.categoryFormModal.errors.selfParent", {
				defaultValue: "A category cannot be its own parent.",
			});
		case "hasSubcategories":
			return t("content.categoryFormModal.errors.hasSubcategories", {
				defaultValue:
					"Please remove all subcategories before deleting this category.",
			});
		case "forbidden":
			return t("content.categoryFormModal.errors.forbidden", {
				defaultValue: "You are not allowed to change this category.",
			});
		default:
			return t("content.categoryFormModal.errors.unexpected", {
				defaultValue: "The category could not be saved. Please try again.",
			});
	}
};

const useCategorySubmit = (
	mode: CategoryFormModalProps["mode"],
	numericCategoryId: number | undefined,
	existingIcon: string | null | undefined,
	onClose: () => void,
	onSuccess: (mode: CategoryFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
	onError: (message: string) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const addCategory = useAccountStore((state) => state.addCategory);
	const upsertCategory = useAccountStore((state) => state.upsertCategory);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const description = toOptionalText(data.description);
		let icon =
			mode === "edit"
				? toOptionalText(existingIcon)
				: toOptionalText(data.icon);
		const parentCategoryRaw = data.parentCategoryId;
		const parentCategoryId =
			parentCategoryRaw === "none" ? null : toOptionalNumber(parentCategoryRaw);
		const status = (data.status as CategoryStatus | undefined) ?? "active";
		const removeIcon = data.removeIcon === true;

		try {
			const iconFile = data.iconFile instanceof File ? data.iconFile : null;
			if (iconFile) {
				const key = String(data.key ?? "").trim();
				if (!key) {
					throw new Error("Category key is required before icon upload.");
				}
				const uploadData = new FormData();
				uploadData.append("key", key);
				uploadData.append("file", iconFile);
				if (mode === "edit" && numericCategoryId) {
					uploadData.append("categoryId", String(numericCategoryId));
				}
				icon = await uploadCategoryIcon(uploadData);
			} else if (mode === "edit" && removeIcon) {
				icon = null;
			}

			const localizedLabels = {
				de: toOptionalText(data.labelDe) ?? undefined,
				en: toOptionalText(data.labelEn) ?? undefined,
			};
			if (mode === "create") {
				const result = await createCategory({
					key: String(data.key ?? ""),
					description,
					icon,
					status,
					parentCategoryId: parentCategoryId ?? null,
					localizedLabels,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				addCategory(result.data);
			} else if (numericCategoryId) {
				const result = await updateCategory({
					id: numericCategoryId,
					key: String(data.key ?? ""),
					description,
					icon,
					status,
					parentCategoryId: parentCategoryId ?? null,
					localizedLabels,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				if (result.data) {
					upsertCategory(result.data);
				}
			}

			onSuccess(mode);
			triggerAccountRefresh(["categories", "entityAudits"]);
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

const buildCategoryFormConfig = ({
	mode,
	t,
	statusOptions,
	parentOptions,
	resolvedCategory,
	localizedLabels,
	submitting,
	onSubmit,
	onCancel,
}: {
	mode: CategoryFormModalProps["mode"];
	t: (key: string, options?: { defaultValue?: string }) => string;
	statusOptions: { value: string; label: string }[];
	parentOptions: { value: string; label: string }[];
	resolvedCategory?: Category;
	localizedLabels?: Record<string, string>;
	submitting: boolean;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
}): FormWrapperConfig => ({
	fields: [
		{
			name: "detailsSection",
			type: "section",
			title: t("content.categoryFormModal.form.details.title", {
				defaultValue: "Category details",
			}),
			description: t("content.categoryFormModal.form.details.description", {
				defaultValue: "Define how this category should appear in the system.",
			}),
			layout: { columns: 2 },
			fields: [
				{
					name: "key",
					label: t("content.categoryFormModal.form.details.fields.key.label", {
						defaultValue: "Key",
					}),
					required: true,
					type: "text",
					disabled: mode === "edit",
					placeholder: t(
						"content.categoryFormModal.form.details.fields.key.placeholder",
						{ defaultValue: "e.g. museums" },
					),
					layout: { span: "full" },
				},
				{
					name: "labelDe",
					label: t(
						"content.categoryFormModal.form.details.fields.localizedLabelDe.label",
						{
							defaultValue: "Name (Deutsch)",
						},
					),
					type: "text",
					placeholder: t(
						"content.categoryFormModal.form.details.fields.localizedLabelDe.placeholder",
						{ defaultValue: "z. B. Museen" },
					),
					layout: { span: "half" },
				},
				{
					name: "labelEn",
					label: t(
						"content.categoryFormModal.form.details.fields.localizedLabelEn.label",
						{
							defaultValue: "Name (Englisch)",
						},
					),
					type: "text",
					placeholder: t(
						"content.categoryFormModal.form.details.fields.localizedLabelEn.placeholder",
						{ defaultValue: "e.g. Museums" },
					),
					layout: { span: "half" },
				},
				{
					name: "status",
					label: t(
						"content.categoryFormModal.form.details.fields.status.label",
						{
							defaultValue: "Status",
						},
					),
					type: "select",
					options: statusOptions,
					layout: { span: "half" },
				},

				{
					name: "parentCategoryId",
					label: t(
						"content.categoryFormModal.form.details.fields.parent.label",
						{
							defaultValue: "Parent category",
						},
					),
					type: "select",
					options: parentOptions,
					condition: () => {
						return (
							resolvedCategory?.child_categories?.length === 0 ||
							mode === "create"
						);
					},
					placeholder: t(
						"content.categoryFormModal.form.details.fields.parent.placeholder",
						{ defaultValue: "Select parent (optional)" },
					),
					layout: { span: "half" },
				},
				{
					name: "iconFile",
					label: t(
						"content.categoryFormModal.form.details.fields.iconUpload.label",
						{
							defaultValue: "SVG Icon Upload",
						},
					),
					type: "file",
					accept: ".svg,image/svg+xml",
					fileRemoveOption:
						typeof resolvedCategory?.icon === "string" &&
						resolvedCategory.icon.trim().length > 0
							? {
									fieldName: "removeIcon",
									label: t(
										"content.categoryFormModal.form.details.fields.iconUpload.remove",
										{
											defaultValue: "Icon entfernen",
										},
									),
								}
							: undefined,
					condition: () => {
						return !resolvedCategory?.parent_category_id;
					},
					afterField:
						typeof resolvedCategory?.icon === "string" &&
						resolvedCategory.icon.trim().length > 0 ? (
							<div className="mt-1 body3 text-muted-foreground">
								<a
									href={resolvedCategory.icon}
									target="_blank"
									rel="noreferrer"
									className="underline"
								>
									{t(
										"content.categoryFormModal.form.details.fields.iconUpload.currentFile",
										{
											defaultValue: "Aktuelle Datei ansehen",
										},
									)}
								</a>
							</div>
						) : null,
					layout: { span: "half" },
				},
				{
					name: "description",
					label: t(
						"content.categoryFormModal.form.details.fields.description.label",
						{
							defaultValue: "Description",
						},
					),
					type: "textarea",
					placeholder: t(
						"content.categoryFormModal.form.details.fields.description.placeholder",
						{ defaultValue: "Optional description" },
					),
					layout: { span: "full" },
				},
			],
		},
	],

	initialValues: getInitialValues(resolvedCategory, localizedLabels),
	onSubmit,
	submitLabel: getSubmitLabel(mode, submitting, {
		create: {
			default: t("content.categoryFormModal.actions.create", {
				defaultValue: "Create category",
			}),
			loading: t("content.categoryFormModal.actions.createLoading", {
				defaultValue: "Creating...",
			}),
		},
		edit: {
			default: t("content.categoryFormModal.actions.update", {
				defaultValue: "Update category",
			}),
			loading: t("content.categoryFormModal.actions.updateLoading", {
				defaultValue: "Saving...",
			}),
		},
		default: {
			default: t("content.categoryFormModal.actions.save", {
				defaultValue: "Save",
			}),
			loading: t("content.categoryFormModal.actions.saveLoading", {
				defaultValue: "Saving...",
			}),
		},
	}),
	showCancel: true,
	cancelLabel: t("content.categoryFormModal.actions.cancel", {
		defaultValue: "Cancel",
	}),
	onCancel,
});

export function CategoryFormModal({
	mode,
	categoryId,
	shouldRefresh = false,
	routePath,
	returnTo,
}: CategoryFormModalProps) {
	const { t: tEnum } = useTranslation();
	const { t } = useTranslation();
	const categories = useAccountStore((state) => state.categories);
	const removeCategory = useAccountStore((state) => state.removeCategory);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [localizedLabels, setLocalizedLabels] = useState<
		Record<string, string>
	>({});
	const [hasLoadedLocalizedLabels, setHasLoadedLocalizedLabels] =
		useState(false);
	const [deleteError, setDeleteError] = useState<{
		title: string;
		description: string;
	} | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleClose = useRoutedModalClose({ returnTo });

	const {
		numericCategoryId,
		resolvedCategory,
		isWaitingForCategory,
		showNotFound,
	} = useResolvedCategory(mode, categoryId, categories);

	useEffect(() => {
		if (mode !== "edit" || !resolvedCategory) {
			setLocalizedLabels({});
			setHasLoadedLocalizedLabels(mode !== "edit");
			return;
		}
		let active = true;
		setHasLoadedLocalizedLabels(false);
		void getCategoryLocalizedLabels({
			key: resolvedCategory.key,
			parentCategoryId: resolvedCategory.parent_category_id ?? null,
		})
			.then((result) => {
				if (!active) return;
				setLocalizedLabels(result ?? {});
			})
			.catch(() => {
				if (!active) return;
				setLocalizedLabels({});
			})
			.finally(() => {
				if (!active) return;
				setHasLoadedLocalizedLabels(true);
			});
		return () => {
			active = false;
		};
	}, [mode, resolvedCategory]);

	const statusOptions = useMemo(
		() => [
			{
				value: "active",
				label: t("content.categoryFormModal.status.active", {
					defaultValue: "Active",
				}),
			},
			{
				value: "inactive",
				label: t("content.categoryFormModal.status.inactive", {
					defaultValue: "Inactive",
				}),
			},
		],

		[t],
	);

	const parentOptions = useMemo(() => {
		const eligibleParents = getEligibleParentCategories(
			categories,
			resolvedCategory?.id,
		);
		return [
			{
				value: "none",
				label: t("content.categoryFormModal.form.details.fields.parent.none", {
					defaultValue: "No parent",
				}),
			},
			...eligibleParents.map((category) => ({
				value: String(category.id),
				label: tEnum(`enumMap.category.${category.key}`) || category.key,
			})),
		];
	}, [categories, resolvedCategory, tEnum, t]);

	const handleSuccess = (nextMode: CategoryFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "categoryFormModal.feedback.create"
				: "categoryFormModal.feedback.update";
		showSuccessToast(
			t(`content.${keyPrefix}.title`, {
				defaultValue:
					nextMode === "create" ? "Category created" : "Category updated",
			}),
			t(`content.${keyPrefix}.description`, {
				defaultValue:
					nextMode === "create"
						? "Your category is ready to use."
						: "Your changes have been saved.",
			}),
		);
	};

	const { handleSubmit, submitting } = useCategorySubmit(
		mode,
		numericCategoryId,
		resolvedCategory?.icon,
		handleClose,
		handleSuccess,
		shouldRefresh,
		(errorCode) => setSubmitError(translateCategoryFormError(t, errorCode)),
	);

	const formConfig = useMemo(() => {
		const baseConfig = buildCategoryFormConfig({
			mode,
			t,
			statusOptions,
			parentOptions,
			resolvedCategory,
			localizedLabels,
			submitting,
			onSubmit: handleSubmit,
			onCancel: handleClose,
		});
		if (mode !== "edit" || !resolvedCategory) return baseConfig;
		return {
			...baseConfig,
			deleteAction: {
				label: t("content.categoryFormModal.delete.button", {
					defaultValue: "Delete",
				}),
				onClick: () => setShowDeleteDialog(true),
				disabled: isDeleting || submitting,
				className: "p-0!",
			},
		};
	}, [
		mode,
		t,
		statusOptions,
		parentOptions,
		resolvedCategory,
		localizedLabels,
		submitting,
		isDeleting,
		handleSubmit,
		handleClose,
	]);

	const autoCloseError =
		showNotFound && !isDeleting
			? {
					active: true,
					title: t("content.categoryFormModal.dialog.notFound.title", {
						defaultValue: "Category not found",
					}),
					description: t(
						"content.categoryFormModal.dialog.notFound.description",
						{
							defaultValue: "We couldn't find that category.",
						},
					),
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
				showDeleteDialog && resolvedCategory
					? {
							open: true,
							status: "warning",
							title: t("content.categoryFormModal.delete.confirmTitle", {
								defaultValue: "Delete category?",
							}),
							description: t(
								"content.categoryFormModal.delete.confirmDescription",
								{
									defaultValue:
										"This will permanently remove the category. This action cannot be undone.",
								},
							),
							confirmLabel: t("content.categoryFormModal.delete.confirm"),
							cancelLabel: t("content.categoryFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting) return;
								setIsDeleting(true);
								const result = await deleteCategory(resolvedCategory.id);
								if (!result.ok) {
									setDeleteError({
										title: t("content.categoryFormModal.delete.errorTitle", {
											defaultValue: "Delete failed",
										}),
										description: translateCategoryFormError(t, result.error),
									});
									setShowDeleteDialog(false);
									setIsDeleting(false);
									return;
								}
								handleClose();
								triggerAccountRefresh(["categories", "entityAudits"]);
								try {
									queueMicrotask(() => {
										removeCategory(resolvedCategory.id);
										showSuccessToast(
											t("content.categoryFormModal.feedback.delete.title", {
												defaultValue: "Category deleted",
											}),
											t(
												"content.categoryFormModal.feedback.delete.description",
												{
													defaultValue:
														"The category has been removed successfully.",
												},
											),
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
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col">
						{renderDialogBody(
							isWaitingForCategory ||
								(mode === "edit" && !hasLoadedLocalizedLabels),
							formConfig,
							resolvedCategory,
							mode,
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
