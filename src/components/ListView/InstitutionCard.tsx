"use client";

import {
	detailsInfoConfig,
	organizationInfoConfig,
	facilityInfoConfig,
	sharedUseInfoConfig,
	contactInfoConfig,
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

	const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
		// Don't trigger card click if clicking on interactive elements inside
		const target = e.target as HTMLElement;
		const currentTarget = e.currentTarget as HTMLElement;
		const interactiveAncestor = target.closest(
			"button, a, [role='button']",
		) as HTMLElement | null;
		if (interactiveAncestor && interactiveAncestor !== currentTarget) {
			return;
		}
		onClick?.(institutionData);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleCardClick(e);
		}
	};

	const cardClassName = `tab-ring hover:scale-102 transition duration-500 ease-out transform-gpu will-change-transform w-full rounded-lg overflow-hidden text-left ${
		isSelected
			? "shadow-md ring-2 ring-primary border border-primary"
			: "shadow-sm border border-transparent"
	} ${onClick ? "cursor-pointer hover:shadow-md" : ""}`;

	return (
		<div
			className={cardClassName}
			role={onClick ? "button" : "listitem"}
			tabIndex={onClick ? 0 : undefined}
			data-institution-card-id={String(institutionData.id)}
			aria-selected={isSelected || undefined}
			onClick={onClick ? handleCardClick : undefined}
			onKeyDown={onClick ? handleKeyDown : undefined}
			aria-label={
				onClick
					? `${institutionData.name} - ${t("common.institution.showDetails")}`
					: undefined
			}
		>
			<div className="">
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
												id: "utilization_status",
												type: "status",
												label: fieldLabel("utilization_status"),
												statusVariant: "plain",
												value: "utilization_status",
												enumKey: "utilization_status",
											},
											{
												id: "protection_status",
												type: "status",
												label: fieldLabel("protection_status"),
												statusVariant: "plain",
												value: "protection_status",
												enumKey: "protection_status",
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
										id: "funding",
										layout: { span: "half" },
										cardVariant: "tertiary",
										fields: organizationInfoConfig,
									},
									{
										type: "section",
										id: "facility",
										layout: { span: "half" },
										cardVariant: "tertiary",
										fields: facilityInfoConfig,
									},
									{
										type: "section",
										id: "shared_use",
										layout: { span: "half" },
										cardVariant: "tertiary",
										fields: sharedUseInfoConfig,
									},
									{
										type: "section",
										id: "organization",
										layout: { span: "half" },
										cardVariant: "tertiary",
										fields: detailsInfoConfig,
									},
								],
							},
						],
					}}
				/>
			</div>
		</div>
	);
});

export default InstitutionCard;
export { InstitutionCard };
