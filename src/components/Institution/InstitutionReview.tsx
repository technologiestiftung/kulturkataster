"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFieldLabel } from "@/lib/hooks/useFieldLabel";
import { InfoWrapper } from "@/components/InfoWrapper";
import {
	additionalInfoConfig,
	contactInfoConfig,
	detailsInfoConfig,
	facilityInfoConfig,
	organizationInfoConfig,
	sharedUseInfoConfig,
} from "@/config/infoConfig/configs";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useAccountStore } from "@/lib/store/accountStore";
import { resolveCategoriesFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";
type InstitutionReviewProps = {
	data: Record<string, unknown>;
	newData?: Record<string, unknown>;
	onEditSection?: (sectionId: string) => void;
};

export function InstitutionReview({
	data,
	newData,
	onEditSection,
}: InstitutionReviewProps) {
	const { t } = useTranslation("content");
	const fieldLabel = useFieldLabel();
	const { isPrivateField } = useInstitutionPrivateFieldResolver();
	const institutionCategories =
		useInstitutionStore((state) => state.categories) ?? [];
	const accountCategories = useAccountStore((state) => state.categories) ?? [];
	const categories =
		institutionCategories.length > 0
			? institutionCategories
			: accountCategories;

	const editConfig = useMemo(
		() => ({
			details: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("details"),
						enabled: true,
					}
				: undefined,
			utilization_status: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("utilization_status"),
						enabled: true,
					}
				: undefined,
			protection_status: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("protection_status"),
						enabled: true,
					}
				: undefined,
			address: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("address"),
						enabled: true,
					}
				: undefined,
			contact: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("contact"),
						enabled: true,
					}
				: undefined,
			organization: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("organization"),
						enabled: true,
					}
				: undefined,
			funding: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("funding"),
						enabled: true,
					}
				: undefined,
			facility: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("facility"),
						enabled: true,
					}
				: undefined,
			sharedUse: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("shared_use_section"),
						enabled: true,
					}
				: undefined,
			additional: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("additional"),
						enabled: true,
					}
				: undefined,
		}),
		[onEditSection],
	);

	const resolveCategoriesForData = useMemo(
		() => (input: Record<string, unknown>) =>
			resolveCategoriesFromDraft(input, categories),
		[categories],
	);

	const resolvedData = useMemo(() => {
		const categoriesForData = resolveCategoriesForData(data);
		return categoriesForData
			? { ...data, categories: categoriesForData }
			: data;
	}, [data, resolveCategoriesForData]);

	const resolvedNewData = useMemo(() => {
		if (!newData) return undefined;
		const categoriesForNewData = resolveCategoriesForData(newData);
		return categoriesForNewData
			? { ...newData, categories: categoriesForNewData }
			: newData;
	}, [newData, resolveCategoriesForData]);

	return (
		<div className="space-y-4 flex flex-col">
			<div className="flex w-full flex-col items-start gap-4 bg-primary-light/50 px-10 py-6 mt-2">
				<p className="w-full body2 text-foreground">
					{t("institutionFormModal.review.previewHint")}
				</p>
			</div>
			<InfoWrapper
				data={resolvedData}
				newData={resolvedNewData}
				config={{
					isPrivateField,
					showPrivateBadge: true,
					fields: [
						{
							type: "section",
							id: "header",
							cardVariant: "none",
							className: "mb-2",
							edit: editConfig.details,
							fields: [
								{
									id: "parent_organization",
									type: "text",
									value: "parent_organization",
								},
								{
									id: "name",
									alwaysShow: true,
									value: "name",
									type: "title",
								},
								{
									id: "categories",
									categoryVariant: "default",
									type: "category",
								},
							],
						},
						{
							id: "utilization_status",
							alwaysShow: true,
							label: fieldLabel("utilization_status"),
							edit: editConfig.utilization_status,
							className: "mb-2",
							type: "status",
							value: "utilization_status",
							enumKey: "utilization_status",
						},
						{
							id: "protection_status",
							alwaysShow: false,
							label: fieldLabel("protection_status"),
							edit: editConfig.protection_status,
							type: "status",
							value: "protection_status",
							enumKey: "protection_status",
						},
						{
							type: "section",
							id: "details",
							layout: {
								columns: 1,
							},
							cardVariant: "none",
							fields: [
								{
									id: "address",
									alwaysShow: true,
									type: "address",
									edit: editConfig.address,
									addressOptions: {
										showMapLink: false,
										showCopy: false,
									},
								},
								{
									type: "section",
									id: "contact",
									edit: editConfig.contact,
									cardVariant: "tertiary",
									fields: contactInfoConfig,
								},
								{
									type: "section",
									id: "organization",
									alwaysShow: false,
									edit: editConfig.organization,
									cardVariant: "tertiary",
									fields: detailsInfoConfig,
								},
								{
									type: "section",
									id: "funding",
									alwaysShow: false,
									edit: editConfig.funding,
									cardVariant: "tertiary",
									fields: organizationInfoConfig,
								},
								{
									type: "section",
									id: "facility",
									edit: editConfig.facility,
									cardVariant: "tertiary",
									fields: facilityInfoConfig,
								},
								{
									type: "section",
									id: "shared_use",
									edit: editConfig.sharedUse,
									cardVariant: "tertiary",
									fields: sharedUseInfoConfig,
								},
								{
									type: "section",
									id: "additional",
									cardVariant: "tertiary",
									fields: additionalInfoConfig,
								},
							],
						},
					],
				}}
			/>
		</div>
	);
}
