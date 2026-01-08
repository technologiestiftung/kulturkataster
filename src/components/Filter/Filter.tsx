/* eslint-disable complexity */
"use client";

import ContentContainer from "@/components/Content/ContentContainer";
import { CategorySection } from "@/components/Filter/CategorySection/CategorySection";
import DistrictTags from "@/components/Filter/DistrictTags/DistrictTags";
import { Button } from "@/components/ui/button";
import EyeOff from "@/icons/eye-off.svg";
import Eye from "@/icons/eye.svg";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getSortedCategories } from "@/lib/utils/filterUtils";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterData } from "./hooks/useFilterData";
import { Subcategory, FilterState } from "@/types";
import { Loading } from "../ui/loading";

// Main Filter Component
const Filter: FC = () => {
	const { setFilters, filters, filteredInstitutions } = useInstitutionStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();
	const { t, i18n } = useTranslation(["content", "common"]);
	const { t: tEnum } = useTranslation(["enumMap"]);
	const [openSections, setOpenSections] = useState<string[]>([]);

	const collator = useMemo(
		() =>
			new Intl.Collator(i18n.language, { numeric: true, sensitivity: "base" }),
		[i18n.language],
	);

	const updateFilters = async (newFilters: FilterState) => {
		setFilters(newFilters);
	};

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
		const selectedSubcategoriesInGroup = (
			categoryGroup.subcategory ?? []
		).filter((subcategory: Subcategory) =>
			filters.subcategory_keys.includes(subcategory.key),
		);
		const allSubcategoriesSelected =
			selectedSubcategoriesInGroup.length ===
			(categoryGroup.subcategory ?? []).length;

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
				(s) =>
					!(categoryGroup.subcategory ?? []).some(
						(subcategory: Subcategory) => subcategory.key === s,
					),
			);

			updateFilters({
				...filters,
				category_keys: newCategories,
				subcategory_keys: newSubcategories,
			});
		} else {
			const subcategoryKeysToAdd = (categoryGroup.subcategory ?? []).map(
				(subcategory: Subcategory) => subcategory.key,
			);
			const newSubcategories = [
				...filters.subcategory_keys.filter(
					(s) =>
						!(categoryGroup.subcategory ?? []).some(
							(subcategory: Subcategory) => subcategory.key === s,
						),
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
			(group.subcategory ?? []).some(
				(subcategory: Subcategory) => subcategory.key === subcategoryKey,
			),
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

		updateFilters({
			...filters,
			include_closed: !filters.include_closed,
		});
	};

	const resetDistrictFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			district_keys: [],
		});
	};

	const setAllDistrictFilters = () => {
		if (!filters) return;
		if (districts.length === 0) return;

		updateFilters({
			...filters,
			district_keys: districts,
		});
	};

	const resetCategoryFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			category_keys: [],
			subcategory_keys: [],
		});
		// Collapse all expanded category sections when resetting
		setOpenSections([]);
	};

	const setAllCategoryFilters = () => {
		if (!filters) return;
		const allCategoryKeys = categoryGroups.map((group) => group.key);
		const allSubcategoryKeys = categoryGroups.flatMap((group) =>
			(group.subcategory ?? []).map((sub) => sub.key),
		);
		updateFilters({
			...filters,
			category_keys: allCategoryKeys,
			subcategory_keys: allSubcategoryKeys,
		});
	};

	const hasActiveDistrictFilters = () => {
		return filters?.district_keys && filters.district_keys.length > 0;
	};

	const hasActiveCategoryFilters = () => {
		return (
			(filters?.category_keys && filters.category_keys.length > 0) ||
			(filters?.subcategory_keys && filters.subcategory_keys.length > 0)
		);
	};

	if (loading) {
		return (
			<div className="Filter-root h-full w-full p-4 flex justify-center items-center">
				<Loading size="md" />
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
		<div className="Filter-root p-2 md:p-4 h-full flex flex-col gap-2">
			<ContentContainer className="p-6">
				<h2 className="body2 font-bold mb-3 pl-2">
					{t("filter.displayedInstitutions", {
						ns: "content",
						count: filteredInstitutions?.length ?? 0,
					})}
				</h2>
				<button
					className="flex items-center gap-2 transition-opacity body2 text-primary-dark"
					onClick={toggleClosedInstitutions}
				>
					{filters?.include_closed ? <EyeOff /> : <Eye />}
					<strong className="body2 font-bold">
						{filters?.include_closed
							? t("filter.hideClosed", { ns: "content" })
							: t("filter.showClosed", { ns: "content" })}
					</strong>
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
						onClick={
							hasActiveDistrictFilters()
								? resetDistrictFilters
								: setAllDistrictFilters
						}
					>
						{hasActiveDistrictFilters()
							? t("filter.districts.resetFilters", { ns: "content" })
							: t("filter.districts.setAllFilters", { ns: "content" })}
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
						onClick={
							hasActiveCategoryFilters()
								? resetCategoryFilters
								: setAllCategoryFilters
						}
					>
						{hasActiveCategoryFilters()
							? t("filter.categories.resetFilters", { ns: "content" })
							: t("filter.categories.setAllFilters", { ns: "content" })}
					</button>
				</div>
				<div className="space-y-2">
					{getSortedCategories(categoryGroups, collator, tEnum).map(
						(category) => (
							<CategorySection
								key={category.key}
								group={category}
								selectedCategories={filters?.category_keys || []}
								selectedSubcategories={filters?.subcategory_keys || []}
								isOpen={openSections.includes(category.key)}
								onToggle={() => toggleSection(category.key)}
								onCategoryChange={toggleCategory}
								onSubcategoryChange={toggleSubcategory}
							/>
						),
					)}
				</div>
			</ContentContainer>
		</div>
	);
};

export default Filter;
