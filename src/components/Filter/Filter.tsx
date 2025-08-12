"use client";

import ContentContainer from "@/components/Content/ContentContainer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Close from "@/icons/close.svg";
import EyeOff from "@/icons/eye-off.svg";
import Eye from "@/icons/eye.svg";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import {
	CategoryType,
	CategoryWithSubcategories,
	District,
	FilterState,
} from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterData } from "./hooks/useFilterData";

// Simple district filter component
const DistrictTags: FC<{
	districts: District[];
	selected: string[];
	onChange: (key: string) => void;
}> = ({ districts, selected, onChange }) => (
	<div className="flex flex-wrap gap-2 mb-4">
		{districts.map((district) => {
			const isSelected = selected.includes(district.key);
			return (
				<Button
					key={district.key}
					variant="tag"
					size="tag"
					className={isSelected ? "bg-neutral-80 text-white" : ""}
					onClick={() => onChange(district.key)}
				>
					{district.name}
					{isSelected && (
						<span className="ml-0 w-full">
							<Close size={4} viewBox="0 0 24 24" />
						</span>
					)}
				</Button>
			);
		})}
	</div>
);

// Category section with collapsible subcategories
const CategorySection: FC<{
	group: CategoryWithSubcategories;
	selectedCategories: string[];
	selectedSubcategories: string[];
	isOpen: boolean;
	onToggle: () => void;
	onCategoryChange: (key: string) => void;
	onSubcategoryChange: (key: string) => void;
}> = ({
	group,
	selectedCategories,
	selectedSubcategories,
	isOpen,
	onToggle,
	onCategoryChange,
	onSubcategoryChange,
}) => {
	const IconComponent = getCategoryIconComponent(group.key as CategoryType);

	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<div className="flex items-center justify-between w-full p-2 rounded">
				<CollapsibleTrigger asChild>
					<button className="flex items-center gap-2">
						{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						<div className="w-6 h-6">
							<IconComponent />
						</div>
						<span className="body2 font-bold">{group.name}</span>
						<span className="body2">({group.subcategories.length})</span>
					</button>
				</CollapsibleTrigger>

				<Checkbox
					checked={selectedCategories.includes(group.key)}
					onCheckedChange={() => onCategoryChange(group.key)}
				/>
			</div>

			<CollapsibleContent className="pl-16 pr-2 space-y-1">
				{group.subcategories.map((subcategory) => (
					<div
						key={subcategory.key}
						className="flex items-center justify-between py-1"
					>
						<span className="body2">{subcategory.name}</span>
						<Checkbox
							checked={selectedSubcategories.includes(subcategory.key)}
							onCheckedChange={() => onSubcategoryChange(subcategory.key)}
						/>
					</div>
				))}
			</CollapsibleContent>
		</Collapsible>
	);
};

// Main Filter Component
const Filter: FC = () => {
	const { setFilters, filters, applyFilters, initializeInstitutions } =
		useInstitutionStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();
	const { t } = useTranslation(["content", "common"]);

	const [openSections, setOpenSections] = useState<string[]>([]);
	const [hideClosedInstitutions, setHideClosedInstitutions] = useState(true);

	// Update filters and apply changes
	const updateFilters = (newFilters: FilterState) => {
		setFilters(newFilters);
		applyFilters();
	};

	// Toggle district selection
	const toggleDistrict = (districtKey: string) => {
		if (!filters) return;

		const isSelected = filters.district_keys.includes(districtKey);
		const newDistricts = isSelected
			? filters.district_keys.filter((d) => d !== districtKey)
			: [...filters.district_keys, districtKey];

		updateFilters({ ...filters, district_keys: newDistricts });
	};

	// Toggle category selection
	const toggleCategory = (categoryKey: string) => {
		if (!filters) return;

		const isSelected = filters.category_keys.includes(categoryKey);
		const newCategories = isSelected
			? filters.category_keys.filter((c) => c !== categoryKey)
			: [...filters.category_keys, categoryKey];

		updateFilters({ ...filters, category_keys: newCategories });
	};

	// Toggle subcategory selection
	const toggleSubcategory = (subcategoryKey: string) => {
		if (!filters) return;

		const isSelected = filters.subcategory_keys.includes(subcategoryKey);
		const newSubcategories = isSelected
			? filters.subcategory_keys.filter((s) => s !== subcategoryKey)
			: [...filters.subcategory_keys, subcategoryKey];

		updateFilters({ ...filters, subcategory_keys: newSubcategories });
	};

	// Toggle category section open/closed
	const toggleSection = (sectionKey: string) => {
		setOpenSections((prev) =>
			prev.includes(sectionKey)
				? prev.filter((s) => s !== sectionKey)
				: [...prev, sectionKey],
		);
	};

	// Reset all filters
	const resetFilters = () => {
		setFilters({ district_keys: [], category_keys: [], subcategory_keys: [] });
		initializeInstitutions();
	};

	// Toggle closed institutions visibility
	const toggleClosedInstitutions = () => {
		if (!filters) return;

		const newHideState = !hideClosedInstitutions;
		setHideClosedInstitutions(newHideState);

		if (newHideState) {
			updateFilters({ ...filters, status: "open" as const });
		} else {
			const { status: _status, ...filtersWithoutStatus } = filters;
			updateFilters(filtersWithoutStatus);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="Filter-root p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
				<ContentContainer>
					<div className="flex items-center gap-2 body2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
						{t("filter.loading", { ns: "content" })}
					</div>
				</ContentContainer>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="Filter-root p-4 h-full">
				<ContentContainer>
					<div className="body2 text-alert mb-2">
						{t("filter.error", { ns: "content" })}
					</div>
					<Button size="sm" onClick={retry}>
						{t("filter.retry", { ns: "content" })}
					</Button>
				</ContentContainer>
			</div>
		);
	}

	return (
		<div className="Filter-root p-4 h-full flex flex-col gap-2">
			{/* Header Section */}
			<ContentContainer className="p-6">
				<h2 className="body2 font-bold mb-3 pl-2">
					{t("filter.displayedInstitutions", { ns: "content" })}
				</h2>
				<button
					className="flex items-center gap-2 transition-opacity body2 text-primary-dark"
					onClick={toggleClosedInstitutions}
				>
					{hideClosedInstitutions ? <Eye /> : <EyeOff />}
					<span className="body2 font-bold">
						{hideClosedInstitutions
							? t("filter.hideClosed", { ns: "content" })
							: t("filter.showClosed", { ns: "content" })}
					</span>
				</button>
			</ContentContainer>

			{/* Districts Section */}
			<ContentContainer className="py-6 px-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="body1 font-bold">
						{t("filter.districts.title", { ns: "content" })}
					</h3>
					<button className="body2 font-light underline" onClick={resetFilters}>
						{t("filter.districts.resetFilters", { ns: "content" })}
					</button>
				</div>
				<DistrictTags
					districts={districts}
					selected={filters?.district_keys || []}
					onChange={toggleDistrict}
				/>
			</ContentContainer>

			{/* Categories Section */}
			<ContentContainer className="py-6 px-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="body1 font-bold">
						{t("filter.categories.title", { ns: "content" })}
					</h3>
					<button className="body2 font-light underline" onClick={resetFilters}>
						{t("filter.categories.resetFilters", { ns: "content" })}
					</button>
				</div>
				<div className="space-y-2">
					{categoryGroups.map((group) => (
						<CategorySection
							key={group.key}
							group={group}
							selectedCategories={filters?.category_keys || []}
							selectedSubcategories={filters?.subcategory_keys || []}
							isOpen={openSections.includes(group.key)}
							onToggle={() => toggleSection(group.key)}
							onCategoryChange={toggleCategory}
							onSubcategoryChange={toggleSubcategory}
						/>
					))}
				</div>
			</ContentContainer>
		</div>
	);
};

export default Filter;
