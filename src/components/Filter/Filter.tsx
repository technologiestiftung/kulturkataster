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
	InstitutionProperties,
} from "@/types";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { FC, useMemo, useState } from "react";
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
	getCategoryCount: (key: string) => number;
	getSubcategoryCount: (key: string) => number;
}> = ({
	group,
	selectedCategories,
	selectedSubcategories,
	isOpen,
	onToggle,
	onCategoryChange,
	onSubcategoryChange,
	getCategoryCount,
	getSubcategoryCount,
}) => {
	const IconComponent = getCategoryIconComponent(group.key as CategoryType);

	// Determine checkbox state for category
	const selectedSubcategoriesInGroup = group.subcategories.filter((sub) =>
		selectedSubcategories.includes(sub.key),
	);
	const allSubcategoriesSelected =
		selectedSubcategoriesInGroup.length === group.subcategories.length;
	const someSubcategoriesSelected = selectedSubcategoriesInGroup.length > 0;
	const categorySelected = selectedCategories.includes(group.key);

	const isChecked = categorySelected || allSubcategoriesSelected;
	const isIndeterminate =
		!categorySelected && someSubcategoriesSelected && !allSubcategoriesSelected;

	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<div className="flex items-center gap-2 justify-between w-full p-2 rounded">
				<CollapsibleTrigger asChild>
					<button className="flex items-center gap-2 w-full">
						{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						<div className="w-6 h-6">
							<IconComponent />
						</div>
						<div className="body2 text-left">
							<span className="font-bold">{group.name}</span>
							<span className="pl-2">({getCategoryCount(group.key)})</span>
						</div>
					</button>
				</CollapsibleTrigger>

				<div className="relative w-6 h-6 flex items-center justify-center">
					<Checkbox
						checked={isChecked}
						onCheckedChange={() => onCategoryChange(group.key)}
						className={`w-4 h-4 ${isIndeterminate ? "border-primary-dark" : ""}`}
					/>
					{isIndeterminate && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<Minus size={10} className="text-primary-dark" />
						</div>
					)}
				</div>
			</div>

			<CollapsibleContent className="pl-16 pr-2 space-y-1">
				{group.subcategories.map((subcategory) => (
					<div
						key={subcategory.key}
						className="flex items-center gap-2 justify-between py-1 w-full"
					>
						<span className="body2 w-full">
							{subcategory.name} ({getSubcategoryCount(subcategory.key)})
						</span>

						<div className="relative w-6 h-6 flex items-center justify-center">
							<Checkbox
								checked={selectedSubcategories.includes(subcategory.key)}
								onCheckedChange={() => onSubcategoryChange(subcategory.key)}
							/>
						</div>
					</div>
				))}
			</CollapsibleContent>
		</Collapsible>
	);
};

// Main Filter Component
const Filter: FC = () => {
	const {
		setFilters,
		filters,
		filterInstitutionsFrontend,
		originalInstitutions,
	} = useInstitutionStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();
	const { t } = useTranslation(["content", "common"]);
	const [openSections, setOpenSections] = useState<string[]>([]);

	const districtIdToKeyMap = useMemo(() => {
		const map = new Map<number, string>();
		districts.forEach((district: District) => {
			map.set(district.id, district.key);
		});
		return map;
	}, [districts]);

	const matchesDistrictFilter = (
		properties: InstitutionProperties,
		districtKeys: string[],
	): boolean => {
		if (districtKeys.length === 0) return true;
		if (!properties.district_id) return false;

		const districtKey = districtIdToKeyMap.get(properties.district_id);
		if (!districtKey) return false;

		return districtKeys.includes(districtKey);
	};

	const getCategoryCount = (categoryKey: string): number => {
		if (!originalInstitutions?.features || !filters) return 0;

		return originalInstitutions.features.filter((feature) => {
			const properties = feature.properties as InstitutionProperties;
			if (!properties) return false;

			const matchesCategory = properties.categories?.some(
				(cat: { key: string }) => cat.key === categoryKey,
			);
			if (!matchesCategory) return false;

			if (!matchesDistrictFilter(properties, filters.district_keys)) {
				return false;
			}

			if (!filters.include_closed && properties.status === "closed") {
				return false;
			}

			return true;
		}).length;
	};

	const getSubcategoryCount = (subcategoryKey: string): number => {
		if (!originalInstitutions?.features || !filters) return 0;

		return originalInstitutions.features.filter((feature) => {
			const properties = feature.properties as InstitutionProperties;
			if (!properties) return false;

			const matchesSubcategory = properties.subcategories?.some(
				(subcat: { key: string }) => subcat.key === subcategoryKey,
			);
			if (!matchesSubcategory) return false;

			if (!matchesDistrictFilter(properties, filters.district_keys)) {
				return false;
			}

			if (!filters.include_closed && properties.status === "closed") {
				return false;
			}

			return true;
		}).length;
	};

	const updateFilters = async (newFilters: FilterState) => {
		setFilters(newFilters);
		await filterInstitutionsFrontend(newFilters);
	};

	// BE Filter to bring back:
	// const updateFilters = (newFilters: FilterState) => {
	// 	setFilters(newFilters);
	// 	applyFilters();
	// };

	const toggleDistrict = (districtKey: string) => {
		if (!filters) return;

		const isSelected = filters.district_keys.includes(districtKey);
		const newDistricts = isSelected
			? filters.district_keys.filter((d) => d !== districtKey)
			: [...filters.district_keys, districtKey];

		updateFilters({ ...filters, district_keys: newDistricts });
	};

	const toggleCategory = (categoryKey: string) => {
		if (!filters) return;

		const categoryGroup = categoryGroups.find(
			(group) => group.key === categoryKey,
		);
		if (!categoryGroup) return;

		const isCategorySelected = filters.category_keys.includes(categoryKey);
		const selectedSubcategoriesInGroup = categoryGroup.subcategories.filter(
			(sub) => filters.subcategory_keys.includes(sub.key),
		);
		const allSubcategoriesSelected =
			selectedSubcategoriesInGroup.length ===
			categoryGroup.subcategories.length;

		if (
			!(isCategorySelected || allSubcategoriesSelected) &&
			!openSections.includes(categoryKey)
		) {
			toggleSection(categoryKey);
		}

		if (isCategorySelected || allSubcategoriesSelected) {
			const newCategories = filters.category_keys.filter(
				(c) => c !== categoryKey,
			);
			const newSubcategories = filters.subcategory_keys.filter(
				(s) => !categoryGroup.subcategories.some((sub) => sub.key === s),
			);

			updateFilters({
				...filters,
				category_keys: newCategories,
				subcategory_keys: newSubcategories,
			});
		} else {
			// If category is not selected, select all subcategories (but not the category itself)
			const subcategoryKeysToAdd = categoryGroup.subcategories.map(
				(sub) => sub.key,
			);
			const newSubcategories = [
				...filters.subcategory_keys.filter(
					(s) => !categoryGroup.subcategories.some((sub) => sub.key === s),
				),
				...subcategoryKeysToAdd,
			];

			updateFilters({
				...filters,
				subcategory_keys: newSubcategories,
			});
		}
	};

	const toggleSubcategory = (subcategoryKey: string) => {
		if (!filters) return;

		const isSelected = filters.subcategory_keys.includes(subcategoryKey);
		const newSubcategories = isSelected
			? filters.subcategory_keys.filter((s) => s !== subcategoryKey)
			: [...filters.subcategory_keys, subcategoryKey];

		const parentCategory = categoryGroups.find((group) =>
			group.subcategories.some((sub) => sub.key === subcategoryKey),
		);

		let newCategories = filters.category_keys;

		if (parentCategory) {
			if (isSelected && filters.category_keys.includes(parentCategory.key)) {
				newCategories = filters.category_keys.filter(
					(c) => c !== parentCategory.key,
				);
			}
		}

		updateFilters({
			...filters,
			category_keys: newCategories,
			subcategory_keys: newSubcategories,
		});
	};

	const toggleSection = (sectionKey: string) => {
		setOpenSections((prev) =>
			prev.includes(sectionKey)
				? prev.filter((s) => s !== sectionKey)
				: [...prev, sectionKey],
		);
	};

	const toggleClosedInstitutions = () => {
		if (!filters) return;
		const newState = !filters.include_closed;

		updateFilters({ ...filters, include_closed: newState });
	};

	const resetDistrictFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			district_keys: [],
		});
	};

	const resetCategoryFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			category_keys: [],
			subcategory_keys: [],
		});
	};

	if (loading) {
		return (
			<div className="Filter-root p-4 bg-background border-r border-gray-200 h-full overflow-y-auto">
				<ContentContainer>
					<div className="flex items-center gap-2 body2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
						{t("filter.loading", { ns: "content" })}
					</div>
				</ContentContainer>
			</div>
		);
	}

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
					{filters?.include_closed ? <Eye /> : <EyeOff />}
					<span className="body2 font-bold">
						{filters?.include_closed
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
					<button
						className="body2 font-light underline"
						onClick={resetDistrictFilters}
					>
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
					<button
						className="body2 font-light underline"
						onClick={resetCategoryFilters}
					>
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
							getCategoryCount={getCategoryCount}
							getSubcategoryCount={getSubcategoryCount}
						/>
					))}
				</div>
			</ContentContainer>
		</div>
	);
};

export default Filter;
