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
import { FC, useEffect, useMemo, useState } from "react";

// Simple in-memory cache
const filterDataCache: {
	categories: CategoryWithSubcategories[] | null;
	districts: District[] | null;
	timestamp: number | null;
	CACHE_DURATION: number;
	isValid: () => boolean;
	set: (categories: CategoryWithSubcategories[], districts: District[]) => void;
	get: () => {
		categories: CategoryWithSubcategories[];
		districts: District[];
	} | null;
	clear: () => void;
} = {
	categories: null,
	districts: null,
	timestamp: null,
	CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

	isValid() {
		return (
			this.timestamp !== null &&
			this.categories !== null &&
			this.districts !== null &&
			Date.now() - this.timestamp < this.CACHE_DURATION
		);
	},

	set(categories: CategoryWithSubcategories[], districts: District[]) {
		this.categories = categories;
		this.districts = districts;
		this.timestamp = Date.now();
	},

	get() {
		return this.isValid()
			? {
					categories: this.categories as CategoryWithSubcategories[],
					districts: this.districts as District[],
				}
			: null;
	},

	clear() {
		this.categories = null;
		this.districts = null;
		this.timestamp = null;
	},
};

const Filter: FC = () => {
	const setFilters = useVenueStore((state) => state.setFilters);
	const filters = useVenueStore((state) => state.filters);
	const applyFilters = useVenueStore((state) => state.applyFilters);
	const initializeVenues = useVenueStore((state) => state.initializeVenues);

	const [openSections, setOpenSections] = useState<string[]>([
		"districts",
		"categories",
	]);

	const [categoryGroups, setCategoryGroups] = useState<TransformedCategory[]>(
		[],
	);
	const [districts, setDistricts] = useState<TransformedDistrict[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const transformCategories = useMemo(
		() =>
			(categoriesData: CategoryWithSubcategories[]): TransformedCategory[] => {
				return categoriesData.map((category) => ({
					categoryKey: category.key,
					categoryName:
						enumMapDE.category[
							category.key as keyof typeof enumMapDE.category
						] || category.key,
					subcategories: category.subcategories.map((sub) => ({
						key: sub.key,
						name:
							enumMapDE.subcategory[
								sub.key as keyof typeof enumMapDE.subcategory
							] || sub.key,
					})),
				}));
			},
		[],
	);

	const transformDistricts = useMemo(
		() =>
			(districtsData: District[]): TransformedDistrict[] => {
				return districtsData.map((district) => ({
					key: district.key,
					name:
						enumMapDE.district_id[
							district.key as keyof typeof enumMapDE.district_id
						] ||
						district.name ||
						district.key,
				}));
			},
		[],
	);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const cachedData = filterDataCache.get();
				if (cachedData) {
					console.log("[Filter] Using cached data");
					setCategoryGroups(transformCategories(cachedData.categories));
					setDistricts(transformDistricts(cachedData.districts));
					setLoading(false);
					return;
				}

				console.log("[Filter] Fetching fresh data from API");
				const [categoriesData, districtsData] = await Promise.all([
					getCategoriesWithSubcategories(),
					getDistricts(),
				]);

				filterDataCache.set(categoriesData, districtsData);

				setCategoryGroups(transformCategories(categoriesData));
				setDistricts(transformDistricts(districtsData));
			} catch (fetchError) {
				console.error("[Filter] Error fetching data:", fetchError);
				setError("Failed to load filter data. Please try again.");

				filterDataCache.clear();

				setCategoryGroups([]);
				setDistricts([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [transformCategories, transformDistricts]);

	const refreshData = async () => {
		filterDataCache.clear();
		setLoading(true);
		window.location.reload();
	};

	const toggleSection = (section: string) => {
		setOpenSections((prev) =>
			prev.includes(section)
				? prev.filter((s) => s !== section)
				: [...prev, section],
		);
	};

	const handleDistrictChange = (districtKey: string, checked: boolean) => {
		if (!filters) return;

		const updatedDistricts = checked
			? [...filters.districts, districtKey]
			: filters.districts.filter((d) => d !== districtKey);

		const newFilters = { ...filters, districts: updatedDistricts };
		setFilters(newFilters);
		applyFilters();
	};

	const handleCategoryChange = (categoryKey: string, checked: boolean) => {
		if (!filters) return;

		const updatedCategories = checked
			? [...filters.categories, categoryKey]
			: filters.categories.filter((c) => c !== categoryKey);

		const newFilters = { ...filters, categories: updatedCategories };
		setFilters(newFilters);
		applyFilters();
	};

	const handleSubcategoryChange = (
		subcategoryKey: string,
		checked: boolean,
	) => {
		if (!filters) return;

		const updatedSubcategories = checked
			? [...filters.subcategories, subcategoryKey]
			: filters.subcategories.filter((s) => s !== subcategoryKey);

		const newFilters = { ...filters, subcategories: updatedSubcategories };
		setFilters(newFilters);
		applyFilters();
	};

	const resetFilters = () => {
		setFilters({
			districts: [],
			categories: [],
			subcategories: [],
		});
		initializeVenues();
	};

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
				<Button size="sm" onClick={refreshData}>
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

				<div className="flex flex-wrap gap-2 mb-4">
					{districts.map((district) => {
						const isSelected = filters?.districts.includes(district.key);
						return (
							<Button
								key={district.key}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								className={`text-xs ${isSelected ? "bg-gray-600 text-white" : ""}`}
								onClick={() => handleDistrictChange(district.key, !isSelected)}
							>
								{district.name}
								{isSelected && <span className="ml-1">×</span>}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Categories Section */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Kulturortkategorien</h3>
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Filter zurücksetzen
					</Button>
				</div>

				<div className="space-y-2">
					{categoryGroups.map((group) => (
						<Collapsible
							key={group.categoryKey}
							open={openSections.includes(group.categoryKey)}
							onOpenChange={() => toggleSection(group.categoryKey)}
						>
							<div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
								<CollapsibleTrigger asChild>
									<button className="flex items-center gap-2">
										{openSections.includes(group.categoryKey) ? (
											<ChevronDown size={16} />
										) : (
											<ChevronUp size={16} />
										)}
										<span className="text-sm font-medium">
											{group.categoryName}
										</span>
										<span className="text-xs text-gray-500">
											({group.subcategories.length})
										</span>
									</button>
								</CollapsibleTrigger>

								<Checkbox
									checked={filters?.categories.includes(group.categoryKey)}
									onCheckedChange={(checked) =>
										handleCategoryChange(group.categoryKey, Boolean(checked))
									}
								/>
							</div>

							<CollapsibleContent className="pl-6 space-y-1">
								{group.subcategories.map((subcategory) => (
									<div
										key={subcategory.key}
										className="flex items-center justify-between py-1"
									>
										<span className="text-sm text-gray-600">
											{subcategory.name}
										</span>
										<Checkbox
											checked={filters?.subcategories.includes(subcategory.key)}
											onCheckedChange={(checked) => {
												handleSubcategoryChange(
													subcategory.key,
													Boolean(checked),
												);
											}}
										/>
									</div>
								))}
							</CollapsibleContent>
						</Collapsible>
					))}
				</div>
			</div>
		</div>
	);
};

export default Filter;
