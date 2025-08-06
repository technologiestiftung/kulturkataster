"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import enumMapDE from "@/lib/i18n/translations/de/enumMap.json";
import { useVenueStore } from "@/lib/store/venueStore";
import {
	getCategoriesWithSubcategories,
	getDistricts,
} from "@/lib/supabase/api";
import {
	CategoryWithSubcategories,
	District,
	TransformedCategory,
	TransformedDistrict,
} from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FC, useCallback, useEffect, useState } from "react";

// Transform data utilities
const transformCategories = (
	data: CategoryWithSubcategories[],
): TransformedCategory[] =>
	data.map((category) => ({
		categoryKey: category.key,
		categoryName:
			enumMapDE.category[category.key as keyof typeof enumMapDE.category] ||
			category.key,
		subcategories: category.subcategories.map((sub) => ({
			key: sub.key,
			name:
				enumMapDE.subcategory[sub.key as keyof typeof enumMapDE.subcategory] ||
				sub.key,
		})),
	}));

const transformDistricts = (data: District[]): TransformedDistrict[] =>
	data.map((district) => ({
		key: district.key,
		name:
			enumMapDE.district_id[
				district.key as keyof typeof enumMapDE.district_id
			] ||
			district.name ||
			district.key,
	}));

// Simple hook - fetch once and done
const useFilterData = () => {
	const [categoryGroups, setCategoryGroups] = useState<TransformedCategory[]>(
		[],
	);
	const [districts, setDistricts] = useState<TransformedDistrict[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [categoriesData, districtsData] = await Promise.all([
					getCategoriesWithSubcategories(),
					getDistricts(),
				]);

				setCategoryGroups(transformCategories(categoriesData));
				setDistricts(transformDistricts(districtsData));
			} catch (err) {
				console.error("Error fetching filter data:", err);
				setError("Failed to load filter data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []); // Empty dependency array - run once and that's it

	const retry = useCallback(() => {
		setLoading(true);
		setError(null);
		// Re-run the fetch
		Promise.all([getCategoriesWithSubcategories(), getDistricts()])
			.then(([categoriesData, districtsData]) => {
				setCategoryGroups(transformCategories(categoriesData));
				setDistricts(transformDistricts(districtsData));
			})
			.catch((err) => {
				console.error("Error fetching filter data:", err);
				setError("Failed to load filter data");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { categoryGroups, districts, loading, error, retry };
};

// Sub-components
const DistrictFilter: FC<{
	districts: TransformedDistrict[];
	selectedDistricts: string[];
	onDistrictChange: (key: string, checked: boolean) => void;
}> = ({ districts, selectedDistricts, onDistrictChange }) => (
	<div className="flex flex-wrap gap-2 mb-4">
		{districts.map((district) => {
			const isSelected = selectedDistricts.includes(district.key);
			return (
				<Button
					key={district.key}
					variant={isSelected ? "default" : "outline"}
					size="sm"
					className={`text-xs ${isSelected ? "bg-gray-600 text-white" : ""}`}
					onClick={() => onDistrictChange(district.key, !isSelected)}
				>
					{district.name}
					{isSelected && <span className="ml-1">×</span>}
				</Button>
			);
		})}
	</div>
);

const CategoryFilter: FC<{
	categoryGroups: TransformedCategory[];
	selectedCategories: string[];
	selectedSubcategories: string[];
	openSections: string[];
	onToggleSection: (section: string) => void;
	onCategoryChange: (key: string, checked: boolean) => void;
	onSubcategoryChange: (key: string, checked: boolean) => void;
}> = ({
	categoryGroups,
	selectedCategories,
	selectedSubcategories,
	openSections,
	onToggleSection,
	onCategoryChange,
	onSubcategoryChange,
}) => (
	<div className="space-y-2">
		{categoryGroups.map((group) => (
			<Collapsible
				key={group.categoryKey}
				open={openSections.includes(group.categoryKey)}
				onOpenChange={() => onToggleSection(group.categoryKey)}
			>
				<div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
					<CollapsibleTrigger asChild>
						<button className="flex items-center gap-2">
							{openSections.includes(group.categoryKey) ? (
								<ChevronDown size={16} />
							) : (
								<ChevronUp size={16} />
							)}
							<span className="text-sm font-medium">{group.categoryName}</span>
							<span className="text-xs text-gray-500">
								({group.subcategories.length})
							</span>
						</button>
					</CollapsibleTrigger>

					<Checkbox
						checked={selectedCategories.includes(group.categoryKey)}
						onCheckedChange={(checked) =>
							onCategoryChange(group.categoryKey, Boolean(checked))
						}
					/>
				</div>

				<CollapsibleContent className="pl-6 space-y-1">
					{group.subcategories.map((subcategory) => (
						<div
							key={subcategory.key}
							className="flex items-center justify-between py-1"
						>
							<span className="text-sm text-gray-600">{subcategory.name}</span>
							<Checkbox
								checked={selectedSubcategories.includes(subcategory.key)}
								onCheckedChange={(checked) =>
									onSubcategoryChange(subcategory.key, Boolean(checked))
								}
							/>
						</div>
					))}
				</CollapsibleContent>
			</Collapsible>
		))}
	</div>
);

// Main Filter component
const Filter: FC = () => {
	const { setFilters, filters, applyFilters, initializeVenues } =
		useVenueStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();

	const [openSections, setOpenSections] = useState<string[]>([
		"districts",
		"categories",
	]);

	const toggleSection = useCallback((section: string) => {
		setOpenSections((prev) =>
			prev.includes(section)
				? prev.filter((s) => s !== section)
				: [...prev, section],
		);
	}, []);

	const updateFilters = useCallback(
		(updatedFilters: typeof filters) => {
			if (!filters) return;
			setFilters(updatedFilters);
			applyFilters();
		},
		[filters, setFilters, applyFilters],
	);

	const handleDistrictChange = useCallback(
		(districtKey: string, checked: boolean) => {
			if (!filters) return;
			const updatedDistricts = checked
				? [...filters.districts, districtKey]
				: filters.districts.filter((d) => d !== districtKey);
			updateFilters({ ...filters, districts: updatedDistricts });
		},
		[filters, updateFilters],
	);

	const handleCategoryChange = useCallback(
		(categoryKey: string, checked: boolean) => {
			if (!filters) return;
			const updatedCategories = checked
				? [...filters.categories, categoryKey]
				: filters.categories.filter((c) => c !== categoryKey);
			updateFilters({ ...filters, categories: updatedCategories });
		},
		[filters, updateFilters],
	);

	const handleSubcategoryChange = useCallback(
		(subcategoryKey: string, checked: boolean) => {
			if (!filters) return;
			const updatedSubcategories = checked
				? [...filters.subcategories, subcategoryKey]
				: filters.subcategories.filter((s) => s !== subcategoryKey);
			updateFilters({ ...filters, subcategories: updatedSubcategories });
		},
		[filters, updateFilters],
	);

	const resetFilters = useCallback(() => {
		setFilters({ districts: [], categories: [], subcategories: [] });
		initializeVenues();
	}, [setFilters, initializeVenues]);

	if (loading) {
		return (
			<div className="Filter-root p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
				<div className="flex items-center gap-2 text-sm text-gray-500">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
					Loading filters...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="Filter-root p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
				<div className="text-sm text-red-500 mb-2">{error}</div>
				<Button size="sm" onClick={retry}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="Filter-root p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
			<div className="mb-6">
				<h2 className="text-lg font-semibold mb-2">
					Angezeigte Kulturorte in Berlin
				</h2>
				<div className="space-y-2 text-sm text-purple-600">
					<div className="flex items-center gap-2">
						<span>👁</span>
						<span>Geschlossene Orte ausblenden</span>
					</div>
					<div className="flex items-center gap-2">
						<span>→</span>
						<span>Alle 23 Orte in einer Liste anzeigen</span>
					</div>
				</div>
			</div>

			{/* Districts Section */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Bezirke</h3>
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Filter zurücksetzen
					</Button>
				</div>
				<DistrictFilter
					districts={districts}
					selectedDistricts={filters?.districts || []}
					onDistrictChange={handleDistrictChange}
				/>
			</div>

			{/* Categories Section */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Kulturortkategorien</h3>
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Filter zurücksetzen
					</Button>
				</div>
				<CategoryFilter
					categoryGroups={categoryGroups}
					selectedCategories={filters?.categories || []}
					selectedSubcategories={filters?.subcategories || []}
					openSections={openSections}
					onToggleSection={toggleSection}
					onCategoryChange={handleCategoryChange}
					onSubcategoryChange={handleSubcategoryChange}
				/>
			</div>
		</div>
	);
};

export default Filter;
