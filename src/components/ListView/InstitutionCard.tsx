"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	Address,
	Contact,
	OrganizationInfo,
	FundingInfo,
	FacilityInfo,
	StatusInfo,
	ToggleButton,
} from "@/components/Institution";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { Category, Institution, Subcategory } from "@/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

// Parent organization component
function ParentOrganization({ name }: { name?: string }) {
	if (!name) return null;
	return <p className="body2">{name}</p>;
}

// Categories display component
function CategoriesDisplay({
	categories,
	subCategories,
	tEnum,
}: {
	categories: Category[];
	subCategories: Subcategory[];
	tEnum: (key: string) => string;
}) {
	if (!categories?.length) return null;

	return (
		<div className="flex justify-center gap-2 flex-col">
			{categories.map((category: Category) => {
				const IconComponent = getCategoryIconComponent(category.key);

				return (
					<div key={category.id} className="flex items-center gap-1 flex-wrap">
						<div>
							<IconComponent />
						</div>
						<span className="body2">{tEnum(`category.${category.key}`)}</span>
						<span className="body2">•</span>
						{subCategories?.length
							? subCategories
									.filter((sub) => sub.category_id === category.id)
									.map((sub, index, filteredArray) => (
										<span className="body2" key={sub.id}>
											{tEnum(`subcategory.${sub.key}`)}
											{index < filteredArray.length - 1 && ", "}
										</span>
									))
							: null}
					</div>
				);
			})}
		</div>
	);
}

// Status indicator component
function StatusIndicator({
	status,
	tEnum,
}: {
	status: string;
	tEnum: (key: string) => string;
}) {
	const isInUse = status === "in_use";
	return (
		<div className="flex items-center gap-2 bg-neutral-5 p-2 flex-wrap">
			<div
				className={`w-4 h-4 rounded-full ${isInUse ? "bg-brand-default" : "bg-neutral-20"}`}
			/>
			<span className="body2 font-medium">
				<span className="font-bold">
					{tEnum("field_names.utilization_status")}:{" "}
				</span>
				{tEnum("utilization_status." + status)}
			</span>
		</div>
	);
}

// Left column content
function LeftColumn({
	data,
	tEnum,
}: {
	data: Institution;
	tEnum: (key: string) => string;
}) {
	return (
		<div className="space-y-3">
			<ParentOrganization name={data.parent_organizations?.[0]?.name} />
			<h2 className="h1 font-bold text-foreground">{data.name}</h2>
			<CategoriesDisplay
				categories={data.categories || []}
				subCategories={data.subcategories || []}
				tEnum={tEnum}
			/>
			{data.utilization_status && (
				<StatusIndicator status={data.utilization_status} tEnum={tEnum} />
			)}
			<Address institutionData={data} />
		</div>
	);
}

interface InstitutionCardProps {
	institutionData: Institution;
	onClick?: (institution: Institution) => void;
	isCompact?: boolean;
}

const InstitutionCard = memo(function InstitutionCard({
	institutionData,
	onClick,
	isCompact: _isCompact = false,
}: InstitutionCardProps) {
	const { t: tEnum } = useTranslation("enumMap");
	const { t } = useTranslation("common");
	const [showMore, setShowMore] = useState(false);

	const handleCardClick = () => onClick?.(institutionData);
	const handleToggleInfo = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowMore(!showMore);
	};

	const cardClassName = `w-full rounded-lg overflow-hidden border-none  shadow-sm ${
		onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
	}`;

	return (
		<Card
			className={cardClassName}
			role="listitem"
			tabIndex={onClick ? 0 : undefined}
			onClick={
				onClick
					? (e) => {
							const target = e.target as HTMLElement;
							if (!target.closest("a, button")) {
								handleCardClick();
							}
						}
					: undefined
			}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								const target = e.target as HTMLElement;
								if (target === e.currentTarget) {
									e.preventDefault();
									handleCardClick();
								}
							}
						}
					: undefined
			}
			aria-label={
				onClick
					? `${institutionData.name} - ${t("institution.showDetails")}`
					: undefined
			}
		>
			<CardContent className="p-4 space-y-2 md:space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
					<LeftColumn data={institutionData} tEnum={tEnum} />
					<Contact institutionData={institutionData} />
				</div>

				{showMore && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
						<FundingInfo institutionData={institutionData} />
						<FacilityInfo institutionData={institutionData} />
						<OrganizationInfo institutionData={institutionData} />
						<StatusInfo institutionData={institutionData} />
					</div>
				)}

				<ToggleButton
					showMore={showMore}
					onClick={handleToggleInfo}
					hasInfo={true}
				/>
			</CardContent>
		</Card>
	);
});

export default InstitutionCard;
export { InstitutionCard };
