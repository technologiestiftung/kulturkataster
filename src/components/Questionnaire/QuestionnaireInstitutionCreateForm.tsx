"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";
import { getFieldLabel, getFieldPlaceholder } from "@/lib/i18n/fieldLabels";
import { handleAddressBlur } from "@/lib/utils/formUtils";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import type { Category } from "@/types";

const splitFreeTextList = (value: unknown): string[] =>
	typeof value === "string"
		? Array.from(
				new Set(
					value
						.split(",")
						.map((item) => item.trim())
						.filter((item) => item.length > 0),
				),
			)
		: [];

const hasSelectedOrProposedCategory = (
	value: unknown,
	formData: Record<string, unknown>,
): boolean => {
	const filters = value as
		| { category_keys?: string[]; child_category_keys?: string[] }
		| undefined;
	const hasSelectedCategories =
		(filters?.category_keys?.length ?? 0) > 0 ||
		(filters?.child_category_keys?.length ?? 0) > 0;
	if (hasSelectedCategories) return true;

	return splitFreeTextList(formData.newCategory).length > 0;
};

// A deliberately compact subset of InstitutionFormModal/InstitutionDraftWizardModal's
// full institution form — just enough to identify a venue that isn't in the
// Kulturkataster yet, embedded inline in the questionnaire wizard instead of sending
// respondents to the separate /institution flow. Reuses the same addressMap field
// as the full wizard. Purely a client-side data collector: it does not create any
// Submission itself — the raw form data is handed to the caller, which stores it in
// the draft and only turns it into a real Submission (together with the answers,
// atomically) when the whole questionnaire is submitted. This is what lets an
// abandoned session leave nothing behind in the database.
export function QuestionnaireInstitutionCreateForm({
	categoryGroups,
	initialValues,
	onCreated,
	onBack,
	backLabel,
	submitLabel,
}: {
	categoryGroups: Category[];
	initialValues?: Record<string, unknown>;
	onCreated: (data: Record<string, unknown>) => void;
	onBack: () => void;
	backLabel: string;
	submitLabel: string;
}) {
	const { t } = useTranslation();
	const addressGeocodeState = useRef({ lastQuery: "", inflight: false });
	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress, {
		reverseGeocode,
	});

	const fieldLabel = (key: string) => getFieldLabel(t, key);
	const fieldPlaceholder = (key: string) => getFieldPlaceholder(t, key);

	// District/neighbourhood have no visible field here (they're filled by the map
	// and geocoding), so FormWrapper doesn't restore them from initialValues when
	// the respondent comes back to this step — carry them over explicitly.
	const handleSubmit = (data: Record<string, unknown>) => {
		onCreated({ ...initialValues, ...data });
	};

	const config: FormWrapperConfig = {
		cardVariant: "none",
		initialValues,
		fields: [
			{
				name: "basicSection",
				type: "section",
				cardVariant: "none",
				layout: { columns: 2 },
				fields: [
					{
						name: "name",
						label: fieldLabel("name"),
						type: "text",
						layout: { span: "full" },
						placeholder: fieldPlaceholder("name"),
						required: true,
					},
					{
						name: "address.map",
						fieldMetaKey: "address_map",
						label: fieldLabel("address_map"),
						type: "addressMap",
						layout: { span: "full" },
						addressMap: {
							latField: "address.lat",
							lngField: "address.lng",
							streetField: "address.streetLine",
							cityField: "address.city",
							zipField: "address.zip",
							districtField: "address.district",
							neighbourhoodField: "address.neighbourhood",
						},
					},
					{
						name: "address.streetLine",
						fieldMetaKey: "street",
						label: `${fieldLabel("street")} & ${fieldLabel("street_number")}`,
						type: "text",
						required: true,
						layout: { span: "full" },
						placeholder: fieldPlaceholder("street"),
						onBlur: onAddressBlur,
					},
					{
						name: "address.address_suffix",
						fieldMetaKey: "address_suffix",
						label: fieldLabel("address_suffix"),
						type: "text",
						layout: { span: "full" },
						placeholder: fieldPlaceholder("address_suffix"),
					},
					{
						name: "address.zip",
						fieldMetaKey: "zipcode",
						label: fieldLabel("zipcode"),
						type: "text",
						required: true,
						layout: { span: "half" },
						placeholder: fieldPlaceholder("zipcode"),
						onBlur: onAddressBlur,
					},
					{
						name: "address.city",
						fieldMetaKey: "city",
						label: fieldLabel("city"),
						type: "text",
						required: true,
						layout: { span: "half" },
						placeholder: fieldPlaceholder("city"),
						onBlur: onAddressBlur,
					},
					{
						name: "established_since",
						label:
							"Seit wann befindet sich die Einrichtung am aktuellen Standort?",
						type: "partialDate",
						layout: { span: "full" },
						placeholder:
							fieldPlaceholder("established_since") ||
							"TT.MM.JJJJ, MM.JJJJ oder JJJJ",
					},
				],
			},
			{
				name: "categorySection",
				type: "section",
				cardVariant: "none",
				required: true,
				layout: { span: "full" },
				fields: [
					{
						name: "categoryFilters",
						fieldMetaKey: "categories",
						label: fieldLabel("categories"),
						type: "filterPanel",
						required: true,
						validators: [
							(value, formData) =>
								hasSelectedOrProposedCategory(value, formData)
									? undefined
									: t(
											"content.institutionFormModal.form.category.validation.minSelection",
										),
						],
						layout: { span: "full" },
						filterPanel: {
							categoryGroups,
							districts: [],
							categorySectionMode: "selection",
							parentCategorySelectionBehavior: "last-child-only",
							showSummary: false,
							showDistricts: false,
							showClosedToggle: false,
							selectionEmptyLabel: fieldPlaceholder("categories"),
						},
					},
				],
			},
			{
				name: "newCategorySection",
				type: "section",
				cardVariant: "none",
				layout: { span: "full" },
				fields: [
					{
						name: "newCategory",
						label: t(
							"content.institutionFormModal.form.category.newCategory.label",
						),
						description: t(
							"content.institutionFormModal.form.category.newCategory.description",
						),
						className: "mt-4",
						type: "text",
						placeholder: t(
							"content.institutionFormModal.form.category.newCategory.placeholder",
						),
						layout: { span: "full" },
					},
				],
			},
		],
		onSubmit: handleSubmit,
		onCancel: onBack,
		submitLabel,
		cancelLabel: backLabel,
		showCancel: true,
	};

	return <FormWrapper config={config} />;
}
