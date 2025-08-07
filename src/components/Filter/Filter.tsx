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
import { useVenueStore } from "@/lib/store/venueStore";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import {
	CategoryType,
	FilterState,
	TransformedCategory,
	TransformedDistrict,
} from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FC, useState } from "react";
import { useFilterData } from "./hooks/useFilterData";

// Simple district filter component
const DistrictTags: FC<{
	districts: TransformedDistrict[];
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
	group: TransformedCategory;
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
	const IconComponent = getCategoryIconComponent(
		group.categoryKey as CategoryType,
	);

	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<div className="flex items-center justify-between w-full p-2 rounded">
				<CollapsibleTrigger asChild>
					<button className="flex items-center gap-2">
						{isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
						<div className="w-6 h-6">
							<IconComponent />
						</div>
						<span className="body2 font-bold">{group.categoryName}</span>
						<span className="body2">({group.subcategories.length})</span>
					</button>
				</CollapsibleTrigger>

				<Checkbox
					checked={selectedCategories.includes(group.categoryKey)}
					onCheckedChange={() => onCategoryChange(group.categoryKey)}
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
	const { setFilters, filters, applyFilters, initializeVenues } =
		useVenueStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();

	const [openSections, setOpenSections] = useState<string[]>([]);
	const [hideClosedVenues, setHideClosedVenues] = useState(true);

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
		initializeVenues();
	};

	// Toggle closed venues visibility
	const toggleClosedVenues = () => {
		if (!filters) return;

		const newHideState = !hideClosedVenues;
		setHideClosedVenues(newHideState);

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
						Loading filters...
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
					<div className="body2 text-alert mb-2">{error}</div>
					<Button size="sm" onClick={retry}>
						Retry
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
					Angezeigte Kulturorte in Berlin
				</h2>
				<button
					className="flex items-center gap-2 transition-opacity body2 text-primary-dark"
					onClick={toggleClosedVenues}
				>
					{hideClosedVenues ? <Eye /> : <EyeOff />}
					<span className="body2 font-bold">
						{hideClosedVenues
							? "Geschlossene Orte ausblenden"
							: "Geschlossene Orte einblenden"}
					</span>
				</button>
			</ContentContainer>

			{/* Districts Section */}
			<ContentContainer className="py-6 px-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="body1 font-bold">Bezirke</h3>
					<button className="body2 font-light underline" onClick={resetFilters}>
						Filter zurücksetzen
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
					<h3 className="body1 font-bold">Kulturortkategorien</h3>
					<button className="body2 font-light underline" onClick={resetFilters}>
						Filter zurücksetzen
					</button>
				</div>
				<div className="space-y-2">
					{categoryGroups.map((group) => (
						<CategorySection
							key={group.categoryKey}
							group={group}
							selectedCategories={filters?.category_keys || []}
							selectedSubcategories={filters?.subcategory_keys || []}
							isOpen={openSections.includes(group.categoryKey)}
							onToggle={() => toggleSection(group.categoryKey)}
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
