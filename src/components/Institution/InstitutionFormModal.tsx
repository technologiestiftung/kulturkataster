"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import {
	buildStreetLine,
	getSubmitLabel,
	handleAddressBlur,
	handleLatLngBlur,
	splitStreetLine,
	toOptionalText,
	toOptionalNumber,
	toNumberArray,
} from "@/lib/utils/formUtils";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import type { Category, FilterState } from "@/types";
import type { Institution } from "@/types/institution";
import { useRouter } from "next/navigation";
import { resolveCategoryIdsFromFilters } from "@/lib/utils/filterUtils";
type InstitutionFormModalProps = {
	mode: "create" | "edit";
	institution?: Institution | null;
	returnTo?: string;
	onSubmit?: (args: {
		data: Record<string, unknown>;
		institution?: Institution;
		mode: InstitutionFormModalProps["mode"];
	}) => void | Promise<void>;
	initialValues?: Record<string, unknown>;
	formKey?: string;
	submitLabel?: string;
	submitting?: boolean;
	closeOnSubmit?: boolean;
	shouldRefresh?: boolean;
};

const buildCategoryFilterState = (
	categories: Category[] | undefined,
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
	console.log(resolvedInstitution);
	return {
		name: resolvedInstitution?.name ?? "",
		internal_notes: resolvedInstitution?.internal_notes ?? "",
		"address.streetLine": buildStreetLine(
			address?.street,
			address?.street_number,
		),
		"address.city": address?.city ?? "",
		"address.zip": address?.zipcode ?? "",
		"address.address_suffix": address?.address_suffix ?? "",
		"address.neighbourhood": address?.neighbourhood ?? "",
		"address.cultural_area": address?.cultural_area ?? "",
		"address.lat": address?.lat ?? null,
		"address.lng": address?.lng ?? null,
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
	formConfig: FormWrapperConfig,
	formKey: string | number,
) => <FormWrapper key={formKey} config={formConfig} />;

const useInstitutionSubmit = (
	mode: InstitutionFormModalProps["mode"],
	institutionId: number | undefined,
	addressId: number | undefined,
	categoryGroups: Category[],
	onClose: () => void,
	onSuccess: (mode: InstitutionFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
) => {
	const [submitting, setSubmitting] = useState(false);
	const addInstitution = useAccountStore((state) => state.addInstitution);
	const upsertInstitution = useAccountStore((state) => state.upsertInstitution);
	const router = useRouter();

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const categoryFilters = data.categoryFilters as FilterState | undefined;
		const categoryIds =
			categoryFilters !== undefined
				? resolveCategoryIdsFromFilters(categoryFilters, categoryGroups)
				: toNumberArray(data.categoryIds);
		const streetLine = toOptionalText(data["address.streetLine"]) ?? "";
		const city = toOptionalText(data["address.city"]);
		const zipcode = toOptionalText(data["address.zip"]);
		const lat = toOptionalNumber(data["address.lat"]);
		const lng = toOptionalNumber(data["address.lng"]);
		const address_suffix = toOptionalText(data["address.address_suffix"]);
		const neighbourhood = toOptionalText(data["address.neighbourhood"]);
		const cultural_area = toOptionalText(data["address.cultural_area"]);

		const address = (() => {
			const { street, streetNumber } = splitStreetLine(streetLine);
			const nextAddress = {
				street,
				street_number: streetNumber,
				city,
				zipcode,
				lat,
				lng,
				address_suffix,
				neighbourhood,
				cultural_area,
			};
			if (addressId) {
				return { ...nextAddress, id: addressId };
			}
			return nextAddress;
		})();
		const website = toOptionalText(data.website);
		const email = toOptionalText(data.email);
		const phone = toOptionalText(data.phone);

		try {
			if (mode === "create") {
				const created = await createInstitution({
					name: String(data.name ?? ""),
					address,
					categoryIds: categoryIds.length > 0 ? categoryIds : [],
					website,
					email,
					phone,
				});
				addInstitution(created);
			} else if (institutionId) {
				const updated = await updateInstitution({
					id: institutionId,
					name: String(data.name ?? ""),
					address,
					categoryIds,
					website,
					email,
					phone,
				});
				if (updated) {
					upsertInstitution(updated);
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

type InstitutionFormConfigArgs = {
	mode: InstitutionFormModalProps["mode"];
	t: (key: string) => string;
	tEnum: (key: string) => string;
	categoryGroups: Category[];
	resolvedInstitution?: Institution;
	initialValues?: Record<string, unknown>;
	submitting: boolean;
	submitLabel?: string;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onCancel: () => void;
	onAddressBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
	onLatLngBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
};

const buildInstitutionFormConfig = ({
	mode,
	t,
	tEnum,
	categoryGroups,
	resolvedInstitution,
	initialValues,
	submitting,
	submitLabel,
	onSubmit,
	onCancel,
	onAddressBlur,
	onLatLngBlur,
}: InstitutionFormConfigArgs): FormWrapperConfig => {
	const fieldLabel = (key: string, fallback: string) => {
		const translated = tEnum(`field_names.${key}`);
		return translated === `field_names.${key}` ? fallback : translated;
	};

	return {
		fields: [
			{
				name: "details",
				type: "section",
				title: t("institutionFormModal.form.details.title"),
				description:
					mode === "create"
						? t("institutionFormModal.form.details.description.create")
						: t("institutionFormModal.form.details.description.edit"),
				layout: { columns: 2 },
				fields: [
					{
						name: "parent_organization",
						label: fieldLabel("parent_organization", "Parent Organization"),
						type: "text",
						description: t(
							"institutionFormModal.form.details.fields.parentOrganization.description",
						),
						placeholder: t(
							"institutionFormModal.form.details.fields.parentOrganization.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "name",
						label: fieldLabel("name", "Name"),
						type: "text",
						required: true,
						placeholder: t(
							"institutionFormModal.form.details.fields.name.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "categoryFilters",
						label: "Categories",
						type: "filterPanel",
						layout: { span: "full" },
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
						type: "select",
						placeholder: tEnum("utilization_status.placeholder"),
						layout: { span: "full" },
						options: [
							{
								value: "in_use",
								label: tEnum("utilization_status.in_use"),
							},
							{
								value: "permanently_closed",
								label: tEnum("utilization_status.permanently_closed"),
							},
							{
								value: "planned_use",
								label: tEnum("utilization_status.planned_use"),
							},
							{
								value: "potential_space",
								label: tEnum("utilization_status.potential_space"),
							},
							{
								value: "temporarily_closed",
								label: tEnum("utilization_status.temporarily_closed"),
							},
							{
								value: "unknown",
								label: tEnum("utilization_status.unknown"),
							},
						],
					},
					{
						name: "address.map",
						label: `${fieldLabel("address", "Address")} Map`,
						type: "addressMap",
						layout: { span: "full" },
						addressMap: {
							latField: "address.lat",
							lngField: "address.lng",
							streetField: "address.streetLine",
							cityField: "address.city",
							zipField: "address.zip",
						},
					},

					{
						name: "address.lat",
						label: fieldLabel("lat", "Breitengrad"),
						type: "number",
						layout: { span: "half" },
						onBlur: onLatLngBlur,
					},
					{
						name: "address.lng",
						label: fieldLabel("lng", "Längengrad"),
						type: "number",
						layout: { span: "half" },
						onBlur: onLatLngBlur,
					},
					{
						name: "address.streetLine",
						label: `${fieldLabel("street", "Street")} & ${fieldLabel(
							"street_number",
							"Number",
						)}`,
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.streetLine.placeholder",
						),
						onBlur: onAddressBlur,
					},
					{
						name: "address.zip",
						label: fieldLabel("address.zip", "ZIP Code"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.zip.placeholder",
						),
						onBlur: onAddressBlur,
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
						name: "address.neighbourhood",
						label: fieldLabel("address.neighbourhood", "Neighbourhood"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.neighbourhood.placeholder",
						),
					},
					{
						name: "address.city",
						label: fieldLabel("address.city", "City"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.city.placeholder",
						),
						onBlur: onAddressBlur,
					},
					{
						name: "address.cultural_area",
						label: fieldLabel("address.cultural_area", "Cultural Area"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.cultural_areal.placeholder",
						),
					},
				],
			},
			{
				name: "contact",
				type: "section",
				title: t("institutionFormModal.form.contact.title"),
				fields: [
					{
						name: "website",
						label: fieldLabel("website", "Website"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.contact.fields.website.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "email",
						label: fieldLabel("email", "Email"),
						type: "email",
						placeholder: t(
							"institutionFormModal.form.contact.fields.email.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "phone",
						label: fieldLabel("phone", "Phone"),
						type: "tel",
						placeholder: t(
							"institutionFormModal.form.contact.fields.phone.placeholder",
						),
						layout: { span: "full" },
					},
				],
			},
		],
		onSubmit,
		showCancel: true,
		cancelLabel: t("institutionFormModal.actions.cancel"),
		onCancel,
		submitLabel:
			submitLabel ??
			getSubmitLabel(mode, submitting, {
				create: {
					default: t("institutionFormModal.actions.create"),
					loading: t("institutionFormModal.actions.creating"),
				},
				edit: {
					default: t("institutionFormModal.actions.save"),
					loading: t("institutionFormModal.actions.saving"),
				},
			}),
		initialValues: initialValues ?? getInitialValues(resolvedInstitution),
	};
};

export function InstitutionFormModal({
	mode,
	institution,
	returnTo,
	onSubmit,
	initialValues,
	formKey,
	submitLabel,
	submitting: submittingProp,
	closeOnSubmit,
	shouldRefresh = true,
}: InstitutionFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const addressGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});
	const latLngGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});

	useEffect(() => {
		const hash = window.location.hash.slice(1); // Remove the '#'
		if (hash) {
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}, 100);
		}
	}, []);

	const handleClose = () => {
		if (returnTo) {
			router.replace(returnTo);
			return;
		}
		router.back();
	};

	const resolvedInstitutionWithFallback = institution ?? undefined;
	const showNotFoundWithFallback =
		mode === "edit" && !resolvedInstitutionWithFallback;

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

	const {
		handleSubmit: handleInstitutionSubmit,
		submitting: defaultSubmitting,
	} = useInstitutionSubmit(
		mode,
		resolvedInstitutionWithFallback?.id,
		resolvedInstitutionWithFallback?.address?.id,
		categories,
		handleClose,
		handleSuccess,
		shouldRefresh,
	);

	const handleCustomSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const maybePromise = onSubmit?.({
				data,
				institution: resolvedInstitutionWithFallback,
				mode,
			});
			if (closeOnSubmit ?? true) {
				Promise.resolve(maybePromise).then(() => handleClose());
			}
		},
		[
			closeOnSubmit,
			handleClose,
			mode,
			onSubmit,
			resolvedInstitutionWithFallback,
		],
	);

	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress);
	const onLatLngBlur = handleLatLngBlur(latLngGeocodeState, reverseGeocode);
	const resolvedSubmitting =
		onSubmit !== undefined ? (submittingProp ?? false) : defaultSubmitting;
	const resolvedSubmitHandler =
		onSubmit !== undefined ? handleCustomSubmit : handleInstitutionSubmit;

	const formConfig = useMemo(
		() =>
			buildInstitutionFormConfig({
				mode,
				t,
				tEnum,
				categoryGroups: categories,
				resolvedInstitution: resolvedInstitutionWithFallback,
				initialValues,
				submitting: resolvedSubmitting,
				submitLabel,
				onSubmit: resolvedSubmitHandler,
				onCancel: handleClose,
				onAddressBlur,
				onLatLngBlur,
			}),
		[
			mode,
			t,
			tEnum,
			categories,
			resolvedInstitutionWithFallback,
			initialValues,
			resolvedSubmitting,
			submitLabel,
			resolvedSubmitHandler,
			handleClose,
			onAddressBlur,
			onLatLngBlur,
		],
	);

	if (showNotFoundWithFallback) {
		return renderNotFoundDialog(t);
	}

	const formKeyValue = formKey ?? resolvedInstitutionWithFallback?.id ?? mode;

	return (
		<Dialog open>
			<DialogContent variant="editor" showBackButton={false} className="p-0">
				<div className="flex h-full flex-col">
					<div className="px-6 py-8 md:px-10">
						<DialogTitle className="title">
							{getDialogTitle(mode, t)}
						</DialogTitle>
					</div>
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
						{renderDialogBody(formConfig, formKeyValue)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
