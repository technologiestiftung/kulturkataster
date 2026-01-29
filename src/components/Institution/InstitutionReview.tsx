"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { InfoWrapper } from "@/components/InfoWrapper";
import {
	additionalInfoConfig,
	contactInfoConfig,
	facilityInfoConfig,
	fundingInfoConfig,
	organizationInfoConfig,
	statusInfoConfig,
} from "@/components/Institution/configs";

type InstitutionReviewProps = {
	data: Record<string, unknown>;
	onEditSection?: (sectionId: "details" | "contact") => void;
};

export function InstitutionReview({
	data,
	onEditSection,
}: InstitutionReviewProps) {
	const { t } = useTranslation("content");

	const editConfig = useMemo(
		() => ({
			details: onEditSection
				? {
						ariaLabel: "Edit",
						onClick: () => onEditSection("details"),
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
		}),
		[onEditSection],
	);

	return (
		<InfoWrapper
			data={data}
			config={{
				fields: [
					{
						type: "section",
						id: "header",
						cardVariant: "none",
						className: "mb-0",
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
								alwaysShow: true,
								categoryVariant: "default",
								type: "category",
							},
						],
					},
					{
						id: "utilization_status",
						alwaysShow: true,
						label: t("institution.utilizationStatus"),
						className: "mb-0",
						type: "status",
						value: "utilization_status",
						enumKey: "utilization_status",
					},
					{
						id: "protection_status",
						alwaysShow: false,
						label: t("institution.protectionStatus"),
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
								cardVariant: "tertiary",
								fields: organizationInfoConfig,
							},
							{
								type: "section",
								id: "funding",
								alwaysShow: false,
								cardVariant: "tertiary",
								fields: fundingInfoConfig,
							},
							{
								type: "section",
								id: "facility",
								cardVariant: "tertiary",
								fields: facilityInfoConfig,
							},
							{
								type: "section",
								id: "status",
								cardVariant: "tertiary",
								fields: statusInfoConfig,
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
	);
}
