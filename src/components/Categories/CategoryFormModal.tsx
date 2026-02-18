"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	createCategory,
	deleteCategory,
	getCategoryById,
	updateCategory,
} from "@/server/actions/categories";
import type { Category } from "@/types";
import type { CategoryStatus } from "@/generated/prisma";
import {
	getSubmitLabel,
	toOptionalNumber,
	toOptionalText,
} from "@/lib/utils/formUtils";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

type CategoryFormModalProps = {
	mode: "create" | "edit";
	categoryId?: string;
	shouldRefresh?: boolean;
	routePath?: string;
	returnTo?: string;
};

const getInitialValues = (resolvedCategory?: Category) => ({
	key: resolvedCategory?.key ?? "",
	description: resolvedCategory?.description ?? "",
	icon: resolvedCategory?.icon ?? "",
	status: resolvedCategory?.status ?? "active",
	parentCategoryId: resolvedCategory?.parent_category_id
		? String(resolvedCategory.parent_category_id)
		: "none",
});

const getDialogTitle = (
	mode: CategoryFormModalProps["mode"],
	t: (key: string, options?: { defaultValue?: string }) => string,
) =>
	mode === "create"
		? t("categoryFormModal.dialog.title.create", {
				defaultValue: "Create category",
			})
		: t("categoryFormModal.dialog.title.edit", {
				defaultValue: "Edit category",
			});

const renderDialogBody = (
	isWaitingForCategory: boolean,
	t: (key: string, options?: { defaultValue?: string }) => string,
	formConfig: FormWrapperConfig,
	resolvedCategory: Category | undefined,
	mode: CategoryFormModalProps["mode"],
) => {
	if (isWaitingForCategory) {
		return (
			<p className="text-foreground">
				{t("categoryFormModal.dialog.loading", {
					defaultValue: "Loading category...",
				})}
			</p>
		);
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

const useCategorySubmit = (
	mode: CategoryFormModalProps["mode"],
	numericCategoryId: number | undefined,
	onClose: () => void,
	onSuccess: (mode: CategoryFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const addCategory = useAccountStore((state) => state.addCategory);
	const upsertCategory = useAccountStore((state) => state.upsertCategory);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const description = toOptionalText(data.description);
		const icon = toOptionalText(data.icon);
		const parentCategoryRaw = data.parentCategoryId;
		const parentCategoryId =
			parentCategoryRaw === "none" ? null : toOptionalNumber(parentCategoryRaw);
		const status = (data.status as CategoryStatus | undefined) ?? "active";

		try {
			if (mode === "create") {
				const created = await createCategory({
					key: String(data.key ?? ""),
					description,
					icon,
					status,
					parentCategoryId: parentCategoryId ?? null,
				});
				addCategory(created);
			} else if (numericCategoryId) {
				const updated = await updateCategory({
					id: numericCategoryId,
					key: String(data.key ?? ""),
					description,
					icon,
					status,
					parentCategoryId: parentCategoryId ?? null,
				});
				if (updated) {
					upsertCategory(updated);
				}
			}

			onSuccess(mode);
			if (shouldRefresh) {
				router.refresh();
			}
			onClose();
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
	submitting,
	onSubmit,
	onCancel,
}: {
	mode: CategoryFormModalProps["mode"];
	t: (key: string, options?: { defaultValue?: string }) => string;
	statusOptions: { value: string; label: string }[];
	parentOptions: { value: string; label: string }[];
	resolvedCategory?: Category;
	submitting: boolean;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
}): FormWrapperConfig => ({
	fields: [
		{
			name: "detailsSection",
			type: "section",
			title: t("categoryFormModal.form.details.title", {
				defaultValue: "Category details",
			}),
			description: t("categoryFormModal.form.details.description", {
				defaultValue: "Define how this category should appear in the system.",
			}),
			layout: { columns: 2 },
			fields: [
				{
					name: "key",
					label: t("categoryFormModal.form.details.fields.key.label", {
						defaultValue: "Key",
					}),
					required: true,
					type: "text",
					placeholder: t(
						"categoryFormModal.form.details.fields.key.placeholder",
						{ defaultValue: "e.g. museums" },
					),
					layout: { span: "half" },
				},
				{
					name: "status",
					label: t("categoryFormModal.form.details.fields.status.label", {
						defaultValue: "Status",
					}),
					type: "select",
					options: statusOptions,
					layout: { span: "half" },
				},
				{
					name: "description",
					label: t("categoryFormModal.form.details.fields.description.label", {
						defaultValue: "Description",
					}),
					type: "textarea",
					placeholder: t(
						"categoryFormModal.form.details.fields.description.placeholder",
						{ defaultValue: "Optional description" },
					),
					layout: { span: "full" },
				},
				{
					name: "icon",
					label: t("categoryFormModal.form.details.fields.icon.label", {
						defaultValue: "Icon",
					}),
					type: "text",
					placeholder: t(
						"categoryFormModal.form.details.fields.icon.placeholder",
						{ defaultValue: "Optional icon name" },
					),
					layout: { span: "half" },
				},
				{
					name: "parentCategoryId",
					label: t("categoryFormModal.form.details.fields.parent.label", {
						defaultValue: "Parent category",
					}),
					type: "select",
					options: parentOptions,
					placeholder: t(
						"categoryFormModal.form.details.fields.parent.placeholder",
						{ defaultValue: "Select parent (optional)" },
					),
					layout: { span: "half" },
				},
			],
		},
	],
	initialValues: getInitialValues(resolvedCategory),
	onSubmit,
	submitLabel: getSubmitLabel(mode, submitting, {
		create: {
			default: t("categoryFormModal.actions.create", {
				defaultValue: "Create category",
			}),
			loading: t("categoryFormModal.actions.createLoading", {
				defaultValue: "Creating...",
			}),
		},
		edit: {
			default: t("categoryFormModal.actions.update", {
				defaultValue: "Update category",
			}),
			loading: t("categoryFormModal.actions.updateLoading", {
				defaultValue: "Saving...",
			}),
		},
		default: {
			default: t("categoryFormModal.actions.save", {
				defaultValue: "Save",
			}),
			loading: t("categoryFormModal.actions.saveLoading", {
				defaultValue: "Saving...",
			}),
		},
	}),
	showCancel: true,
	cancelLabel: t("categoryFormModal.actions.cancel", {
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
	const { t: tEnum } = useTranslation("enumMap");
	const { t } = useTranslation();
	const categories = useAccountStore((state) => state.categories);
	const removeCategory = useAccountStore((state) => state.removeCategory);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteError, setDeleteError] = useState<{
		title: string;
		description: string;
	} | null>(null);

	const handleClose = useRoutedModalClose({ returnTo });

	const {
		numericCategoryId,
		resolvedCategory,
		isWaitingForCategory,
		showNotFound,
	} = useResolvedCategory(mode, categoryId, categories);

	const statusOptions = useMemo(
		() => [
			{
				value: "active",
				label: t("categoryFormModal.status.active", {
					defaultValue: "Active",
				}),
			},
			{
				value: "inactive",
				label: t("categoryFormModal.status.inactive", {
					defaultValue: "Inactive",
				}),
			},
		],
		[t],
	);

	const parentOptions = useMemo(() => {
		const eligibleParents = categories.filter(
			(category) => !resolvedCategory || category.id !== resolvedCategory.id,
		);
		return [
			{
				value: "none",
				label: t("categoryFormModal.form.details.fields.parent.none", {
					defaultValue: "No parent",
				}),
			},
			...eligibleParents.map((category) => ({
				value: String(category.id),
				label: tEnum(`category.${category.key}`) || category.key,
			})),
		];
	}, [categories, resolvedCategory, tEnum, t]);

	const handleSuccess = (nextMode: CategoryFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "categoryFormModal.feedback.create"
				: "categoryFormModal.feedback.update";
		showSuccessToast(
			t(`${keyPrefix}.title`, {
				defaultValue:
					nextMode === "create" ? "Category created" : "Category updated",
			}),
			t(`${keyPrefix}.description`, {
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
		handleClose,
		handleSuccess,
		shouldRefresh,
	);

	const formConfig = useMemo(() => {
		const baseConfig = buildCategoryFormConfig({
			mode,
			t,
			statusOptions,
			parentOptions,
			resolvedCategory,
			submitting,
			onSubmit: handleSubmit,
			onCancel: handleClose,
		});
		if (mode !== "edit" || !resolvedCategory) return baseConfig;
		return {
			...baseConfig,
			deleteAction: {
				label: t("categoryFormModal.delete.button"),
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
		submitting,
		isDeleting,
		handleSubmit,
		handleClose,
	]);

	const autoCloseError =
		showNotFound && !isDeleting
			? {
					active: true,
					title: t("categoryFormModal.dialog.notFound.title", {
						defaultValue: "Category not found",
					}),
					description: t("categoryFormModal.dialog.notFound.description", {
						defaultValue: "We couldn't find that category.",
					}),
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
			loadingState={{
				active: isWaitingForCategory,
				label: t("categoryFormModal.dialog.loading", {
					defaultValue: "Loading category...",
				}),
			}}
			confirmDialog={
				showDeleteDialog && resolvedCategory
					? {
							open: true,
							status: "warning",
							title: t("categoryFormModal.delete.confirmTitle", {
								defaultValue: "Delete category?",
							}),
							description: t("categoryFormModal.delete.confirmDescription", {
								defaultValue:
									"This will permanently remove the category. This action cannot be undone.",
							}),
							confirmLabel: t("categoryFormModal.delete.confirm"),
							cancelLabel: t("categoryFormModal.delete.cancel", {
								defaultValue: "Cancel",
							}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: async () => {
								if (isDeleting) return;
								setIsDeleting(true);
								try {
									handleClose();
									await deleteCategory(resolvedCategory.id);
									queueMicrotask(() => {
										removeCategory(resolvedCategory.id);
										showSuccessToast(
											t("categoryFormModal.feedback.delete.title", {
												defaultValue: "Category deleted",
											}),
											t("categoryFormModal.feedback.delete.description", {
												defaultValue:
													"The category has been removed successfully.",
											}),
										);
									});
								} catch {
									setDeleteError({
										title: t("categoryFormModal.delete.errorTitle", {
											defaultValue: "Delete failed",
										}),
										description: t(
											"categoryFormModal.delete.errorDescription",
											{
												defaultValue:
													"Please try again or remove any subcategories first.",
											},
										),
									});
									setShowDeleteDialog(false);
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
				deleteError
					? {
							open: true,
							title: deleteError.title,
							description: deleteError.description,
							confirmLabel: t("close"),
							onConfirm: () => setDeleteError(null),
							onOpenChange: (open) => {
								if (!open) setDeleteError(null);
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
					<div className="flex-1 overflow-auto flex flex-col">
						{renderDialogBody(
							isWaitingForCategory,
							t,
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
