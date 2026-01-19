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
import {
	buildStreetLine,
	getSubmitLabel,
	splitStreetLine,
	toOptionalText,
	toNumberArray,
} from "@/lib/utils/formUtils";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import type { Category, FilterState } from "@/types";
import type { Institution } from "@/types/institution";
import { useRouter } from "next/navigation";
import { resolveCategoryIdsFromFilters } from "@/lib/utils/filterUtils";

type InstitutionFormModalProps = {
	mode: "create" | "edit";
	institutionId?: string;
};

const buildCategoryFilterState = (
	categories: Institution["categories"] | undefined,
): FilterState => {
	const category_keys: string[] = [];
	const subcategory_keys: string[] = [];

	(categories ?? []).forEach((category) => {
		if (category.parent_category_id) {
			subcategory_keys.push(category.key);
		} else {
			category_keys.push(category.key);
		}
	});

	return {
		district_keys: [],
		category_keys,
		subcategory_keys,
		include_closed: false,
		status: undefined,
	};
};

const getInitialValues = (resolvedInstitution?: Institution) => {
	const address = resolvedInstitution?.address;

	return {
		name: resolvedInstitution?.name ?? "",
		internal_notes: resolvedInstitution?.internal_notes ?? "",
		"address.streetLine": buildStreetLine(
			address?.street,
			address?.street_number,
		),
		"address.city": address?.city ?? "",
		"address.zip": address?.zipcode ?? "",
		categoryIds:
			resolvedInstitution?.categories?.map((category) => String(category.id)) ??
			[],
		categoryFilters: buildCategoryFilterState(resolvedInstitution?.categories),
		website: resolvedInstitution?.website ?? "",
		email: resolvedInstitution?.email ?? "",
		phone: resolvedInstitution?.phone ?? "",
	};
};

const getDialogTitle = (
	mode: InstitutionFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("institutionFormModal.dialog.title.create")
		: t("institutionFormModal.dialog.title.edit");

const renderNotFoundDialog = (t: (key: string) => string) => (
	<AlertDialog
		title={t("institutionFormModal.dialog.notFound.title")}
		description={t("institutionFormModal.dialog.notFound.description")}
	/>
);

const renderDialogBody = (
	t: (key: string) => string,
	formConfig: FormWrapperConfig,
	resolvedInstitution: Institution | undefined,
	mode: InstitutionFormModalProps["mode"],
) => {
	return (
		<Card variant="secondary">
			<CardContent>
				<FormWrapper
					key={resolvedInstitution?.id ?? mode}
					config={formConfig}
				/>
			</CardContent>
		</Card>
	);
};

const useResolvedInstitution = (
	mode: InstitutionFormModalProps["mode"],
	institutionId: string | undefined,
	institutions: Institution[],
) => {
	const numericInstitutionId = useMemo(() => {
		if (!institutionId) return undefined;
		const parsed = Number(institutionId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [institutionId]);

	const resolvedInstitution = useMemo<Institution | undefined>(() => {
		if (mode !== "edit" || !numericInstitutionId) return undefined;
		return institutions.find((item) => item.id === numericInstitutionId);
	}, [mode, numericInstitutionId, institutions]);

	const showNotFound = mode === "edit" && !resolvedInstitution;

	return {
		numericInstitutionId,
		resolvedInstitution,
		showNotFound,
	};
};

const useInstitutionSubmit = (
	mode: InstitutionFormModalProps["mode"],
	numericInstitutionId: number | undefined,
	addressId: number | undefined,
	categoryGroups: Category[],
	onClose: () => void,
	onSuccess: (mode: InstitutionFormModalProps["mode"]) => void,
) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const categoryFilters = data.categoryFilters as FilterState | undefined;
		const categoryIds =
			categoryFilters !== undefined
				? resolveCategoryIdsFromFilters(categoryFilters, categoryGroups)
				: toNumberArray(data.categoryIds);
		const streetLine = toOptionalText(data["address.streetLine"]);
		const city = toOptionalText(data["address.city"]);
		const zipcode = toOptionalText(data["address.zip"]);
		const address = streetLine
			? (() => {
					const { street, streetNumber } = splitStreetLine(streetLine);
					const nextAddress = {
						street,
						street_number: streetNumber ? streetNumber : null,
						city,
						zipcode,
					};
					if (addressId) {
						return { ...nextAddress, id: addressId };
					}
					return nextAddress;
				})()
			: undefined;
		const website = toOptionalText(data.website);
		const email = toOptionalText(data.email);
		const phone = toOptionalText(data.phone);

		try {
			if (mode === "create") {
				await createInstitution({
					name: String(data.name ?? ""),
					address,
					categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
					website,
					email,
					phone,
				});
			} else if (numericInstitutionId) {
				await updateInstitution({
					id: numericInstitutionId,
					name: String(data.name ?? ""),
					address,
					categoryIds,
					website,
					email,
					phone,
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

type InstitutionFormConfigArgs = {
	mode: InstitutionFormModalProps["mode"];
	t: (key: string) => string;
	tEnum: (key: string) => string;
	categoryGroups: Category[];
	resolvedInstitution?: Institution;
	submitting: boolean;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
};

const buildInstitutionFormConfig = ({
	mode,
	t,
	tEnum,
	categoryGroups,
	resolvedInstitution,
	submitting,
	onSubmit,
	onCancel,
}: InstitutionFormConfigArgs): FormWrapperConfig => {
	const fieldLabel = (key: string, fallback: string) => {
		const translated = tEnum(`field_names.${key}`);
		return translated === `field_names.${key}` ? fallback : translated;
	};

	return {
		sections: [
			{
				id: "details",
				title: t("institutionFormModal.form.details.title"),
				description:
					mode === "create"
						? t("institutionFormModal.form.details.description.create")
						: t("institutionFormModal.form.details.description.edit"),
				fields: [
					{
						name: "parentOrganization",
						label: fieldLabel("parent_organization", "Parent Organization"),
						type: "text",
						description: t(
							"institutionFormModal.form.details.fields.parentOrganization.description",
						),
						required: true,
						placeholder: t(
							"institutionFormModal.form.details.fields.parentOrganization.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "name",
						label: fieldLabel("name", "Name"),
						type: "text",
						required: true,
						placeholder: t(
							"institutionFormModal.form.details.fields.name.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "categoryFilters",
						label: "Categories",
						type: "filterPanel",
						gridColumn: "full",
						filterPanel: {
							categoryGroups,
							districts: [],
							collapsible: true,
							defaultCollapsed: true,
							categorySectionMode: "selection",
							showSummary: false,
							showDistricts: false,
							showClosedToggle: false,
							selectionEmptyLabel: t(
								"institutionFormModal.form.details.fields.categories.placeholder",
							),
						},
					},
					{
						name: "utilization_status",
						label: fieldLabel("utilization_status", "Utilization Status"),
						type: "text",
						required: true,
						placeholder: t(
							"institutionFormModal.form.details.fields.utilization_status.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "address.streetLine",
						label: `${fieldLabel("street", "Street")} & ${fieldLabel(
							"street_number",
							"Number",
						)}`,
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.streetLine.placeholder",
						),
					},
					{
						name: "address.address_suffix",
						label: fieldLabel("address.address_suffix", "Address Suffix"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.address_suffix.placeholder",
						),
					},
					{
						name: "address.zip",
						label: fieldLabel("address.zip", "ZIP Code"),
						type: "text",
						gridColumn: "half",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.zip.placeholder",
						),
					},
					{
						name: "address.city",
						label: fieldLabel("address.city", "City"),
						type: "text",
						gridColumn: "half",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.city.placeholder",
						),
					},
					{
						name: "address.cultural_areal",
						label: fieldLabel("address.cultural_areal", "Cultural Areal"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.cultural_areal.placeholder",
						),
					},
				],
			},
			{
				id: "contact",
				title: t("institutionFormModal.form.contact.title"),
				fields: [
					{
						name: "website",
						label: fieldLabel("website", "Website"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.contact.fields.website.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "email",
						label: fieldLabel("email", "Email"),
						type: "email",
						placeholder: t(
							"institutionFormModal.form.contact.fields.email.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "phone",
						label: fieldLabel("phone", "Phone"),
						type: "tel",
						placeholder: t(
							"institutionFormModal.form.contact.fields.phone.placeholder",
						),
						gridColumn: "full",
					},
				],
			},
		],
		gridColumns: 2,
		onSubmit,
		showCancel: true,
		cancelLabel: t("institutionFormModal.actions.cancel"),
		onCancel,
		submitLabel: getSubmitLabel(mode, submitting, {
			create: {
				default: t("institutionFormModal.actions.create"),
				loading: t("institutionFormModal.actions.creating"),
			},
			edit: {
				default: t("institutionFormModal.actions.save"),
				loading: t("institutionFormModal.actions.saving"),
			},
		}),
		initialValues: getInitialValues(resolvedInstitution),
	};
};

export function InstitutionFormModal({
	mode,
	institutionId,
}: InstitutionFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const institutions = useAccountStore((state) => state.institutions);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const categories = useInstitutionStore((state) => state.categories) ?? [];

	const categoryOptions = useMemo(
		() =>
			categories.map((category) => ({
				value: String(category.id),
				label: tEnum(`category.${category.key}`),
			})),
		[categories, tEnum],
	);

	const handleClose = () => {
		router.back();
	};

	const { numericInstitutionId, resolvedInstitution, showNotFound } =
		useResolvedInstitution(mode, institutionId, institutions);

	const handleSuccess = (nextMode: InstitutionFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "institutionFormModal.feedback.create"
				: "institutionFormModal.feedback.update";
		setAlertDialog({
			title: t(`${keyPrefix}.title`),
			description: t(`${keyPrefix}.description`),
		});
	};

	const { handleSubmit, submitting } = useInstitutionSubmit(
		mode,
		numericInstitutionId,
		resolvedInstitution?.address?.id,
		categories,
		handleClose,
		handleSuccess,
	);

	const formConfig = useMemo(
		() =>
			buildInstitutionFormConfig({
				mode,
				t,
				tEnum,
				categoryGroups: categories,
				resolvedInstitution,
				submitting,
				onSubmit: handleSubmit,
				onCancel: handleClose,
			}),
		[
			mode,
			t,
			tEnum,
			categoryOptions,
			categories,
			resolvedInstitution,
			submitting,
			handleSubmit,
			handleClose,
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
				<div className="flex h-full flex-col bg-background">
					<div className="px-6 py-8 md:px-10">
						<DialogTitle className="title">
							{getDialogTitle(mode, t)}
						</DialogTitle>
					</div>
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
						{renderDialogBody(t, formConfig, resolvedInstitution, mode)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
