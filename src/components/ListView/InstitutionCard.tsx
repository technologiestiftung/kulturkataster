"use client";

import {
	detailsInfoConfig,
	organizationInfoConfig,
	facilityInfoConfig,
	sharedUseInfoConfig,
	contactInfoConfig,
	additionalInfoConfig,
	cultureIndexInfoConfig,
	hasCultureIndex,
} from "@/components/Institution";
import { Institution } from "@/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useFieldLabel } from "@/lib/hooks/useFieldLabel";
import { InfoWrapper } from "../InfoWrapper";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";

interface InstitutionCardProps {
	institutionData: Institution;
	onClick?: (institution: Institution) => void;
	isCompact?: boolean;
	isSelected?: boolean;
	openDetails?: boolean;
}

const InstitutionCard = memo(function InstitutionCard({
	institutionData,
	onClick,
	isCompact: _isCompact = false,
	isSelected = false,
	openDetails = false,
}: InstitutionCardProps) {
	const { t } = useTranslation();
	const fieldLabel = useFieldLabel();
	const { isPrivateField } = useInstitutionPrivateFieldResolver();

	const titleId = `institution-card-title-${institutionData.id}`;
	const cardClassName = `relative hover:scale-102 transition duration-500 ease-out transform-gpu will-change-transform w-full rounded-lg overflow-hidden text-left has-[>button:focus-visible]:ring-2 has-[>button:focus-visible]:ring-interaction-dark ${
		isSelected
			? "shadow-md ring-2 ring-primary border border-primary"
			: "shadow-sm border border-transparent"
	} ${onClick ? "cursor-pointer hover:shadow-md" : ""}`;

	// The whole card is clickable through a full-size button behind the
	// content; links and buttons inside the card stay separately operable.
	return (
		<article
			className={cardClassName}
			data-institution-card-id={String(institutionData.id)}
			data-selected={isSelected || undefined}
			aria-labelledby={titleId}
		>
			{onClick && (
				<button
					type="button"
					className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none"
					aria-label={`${institutionData.name} - ${t("common.institution.showDetails")}`}
					aria-current={isSelected || undefined}
					onClick={() => onClick(institutionData)}
				/>
			)}
			<div
				className={
					onClick
						? "relative z-10 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_[role=button]]:pointer-events-auto"
						: undefined
				}
			>
				<InfoWrapper
					key={`${institutionData.id}-${openDetails ? "open" : "closed"}`}
					data={institutionData}
					config={{
						className: "bg-background p-4",
						isPrivateField,
						showPrivateBadge: true,
						fields: [
							{
								type: "section",
								cardVariant: "none",
								layout: {
									columns: 2,
									span: "half",
								},
								fields: [
									{
										type: "section",
										id: "overview",
										layout: { span: "half" },
										cardVariant: "none",
										fields: [
											{
												id: "parent_organization",
												alwaysShow: false,
												value: "parent_organization",
												type: "text",
											},
											{
												id: "name",
												value: "name",
												type: "title",
											},
											{
												id: "categories",
												label: fieldLabel("categories"),
												type: "category",
											},
											{
												id: "status_group",
												alwaysShow: false,
												type: "statusGroup",
											},
											{
												id: "address",
												type: "address",
												value: "address",
											},
										],
									},
									{
										type: "section",
										id: "contact",
										layout: { span: "half" },
										cardVariant: "tertiary",
										fields: contactInfoConfig,
									},
								],
							},
							{
								type: "section",
								id: "details",
								layout: {
									columns: 2,
								},
								collapsible: true,
								defaultOpen: openDetails,
								accordionVariant: "secondary",
								title: (
									<>
										<span className="group-data-[state=open]:hidden">
											{t("common.institution.moreInfo")}
										</span>
										<span className="group-data-[state=closed]:hidden">
											{t("common.institution.lessInfo")}
										</span>
									</>
								),

								className: "pt-4",
								cardVariant: "none",
								fields: [
									{
										type: "section",
										id: "culture_index_section",
										layout: { span: "half" },
										cardVariant: "muted",
										condition: hasCultureIndex,
										fields: cultureIndexInfoConfig,
									},
									{
										type: "section",
										id: "funding",
										layout: { span: "half" },
										cardVariant: "muted",
										fields: organizationInfoConfig,
									},
									{
										type: "section",
										id: "facility",
										layout: { span: "half" },
										cardVariant: "muted",
										fields: facilityInfoConfig,
									},
									{
										type: "section",
										id: "shared_use",
										layout: { span: "half" },
										cardVariant: "muted",
										fields: sharedUseInfoConfig,
									},
									{
										type: "section",
										id: "organization",
										layout: { span: "half" },
										cardVariant: "muted",
										fields: detailsInfoConfig,
									},
									{
										type: "section",
										id: "additional",
										layout: { span: "half" },
										cardVariant: "muted",
										fields: additionalInfoConfig,
									},
								],
							},
						],
					}}
				/>
			</div>
		</article>
	);
});

export default InstitutionCard;
export { InstitutionCard };
