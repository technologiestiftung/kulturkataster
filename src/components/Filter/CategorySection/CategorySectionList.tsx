"use client";

import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ContentContainer from "@/components/Content/ContentContainer";
import { CategorySection } from "@/components/Filter/CategorySection/CategorySection";
import ChevronDown from "@/icons/chevron-down.svg";
import ChevronUp from "@/icons/chevron-up.svg";
import { getSortedCategories } from "@/lib/utils/filterUtils";
import type { Category, FilterState, Subcategory } from "@/types";

export type CategorySectionListProps = {
	filters: FilterState | null;
	categoryGroups: Category[];
	categoryCounts?: Record<string, number>;
	subcategoryCounts?: Record<string, number>;
	onFiltersChange: (nextFilters: FilterState) => void;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	categorySectionMode?: "filter" | "selection";
	selectionEmptyLabel?: string;
	showHeader?: boolean;
};

export const CategorySectionList: FC<CategorySectionListProps> = ({
	filters,
	categoryGroups,
	categoryCounts,
	subcategoryCounts,
	onFiltersChange,
	collapsible = false,
	defaultCollapsed = false,
	categorySectionMode = "filter",
	selectionEmptyLabel,
	showHeader = false,
}) => {
	const { t } = useTranslation(["content"]);
	const { t: tEnum, i18n } = useTranslation(["enumMap"]);
	const [openSections, setOpenSections] = useState<string[]>([]);
	const [isCollapsed, setIsCollapsed] = useState(
		collapsible ? defaultCollapsed : false,
	);

	const collator = useMemo(
		() =>
			new Intl.Collator(i18n.language, { numeric: true, sensitivity: "base" }),
		[i18n.language],
	);

	const updateFilters = (nextFilters: FilterState) => {
		onFiltersChange(nextFilters);
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

	const selectedCategoryGroups = useMemo(() => {
		if (!filters) return [];
		const selectedCategoryKeys = new Set(filters.category_keys);
		const selectedSubcategoryKeys = new Set(filters.subcategory_keys);
		const filteredCategories = categoryGroups.filter((category) => {
			if (selectedCategoryKeys.has(category.key)) return true;
			return (category.subcategory ?? []).some((subcategory) =>
				selectedSubcategoryKeys.has(subcategory.key),
			);
		});
		return getSortedCategories(filteredCategories, collator, tEnum);
	}, [filters, categoryGroups, collator, tEnum]);

	const hasActiveCategoryFilters = () => {
		return (
			(filters?.category_keys && filters.category_keys.length > 0) ||
			(filters?.subcategory_keys && filters.subcategory_keys.length > 0)
		);
	};

	const resetCategoryFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			category_keys: [],
			subcategory_keys: [],
		});
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

	return (
		<ContentContainer className="py-6 px-4">
			{collapsible && isCollapsed ? (
				<div className="flex flex-col gap-2">
					{selectedCategoryGroups.length === 0 && selectionEmptyLabel && (
						<p className="body2 text-neutral-80">{selectionEmptyLabel}</p>
					)}
					{selectedCategoryGroups.length > 0 && (
						<div className="space-y-2">
							{selectedCategoryGroups.map((category) => (
								<CategorySection
									key={category.key}
									group={category}
									selectedCategories={filters?.category_keys || []}
									selectedSubcategories={filters?.subcategory_keys || []}
									isOpen
									onToggle={() => toggleSection(category.key)}
									onCategoryChange={toggleCategory}
									onSubcategoryChange={toggleSubcategory}
									categoryCount={categoryCounts?.[category.key]}
									subcategoryCounts={subcategoryCounts}
									mode={categorySectionMode}
								/>
							))}
						</div>
					)}
					<div className="p-2 flex justify-start">
						<button
							type="button"
							aria-label={t("filter.showMoreCategories")}
							className="inline-flex items-center text-primary-dark"
							onClick={() => setIsCollapsed(false)}
						>
							<ChevronDown className="h-4 w-4" />
							<span className="ml-2 text-primary-dark font-bold body2">
								{t("filter.showMoreCategories")}
							</span>
						</button>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{showHeader && (
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
					)}
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
									categoryCount={categoryCounts?.[category.key]}
									subcategoryCounts={subcategoryCounts}
									mode={categorySectionMode}
								/>
							),
						)}
					</div>
					{collapsible && (
						<div className="p-2">
							<button
								type="button"
								aria-label={t("filter.showSelectedCategories")}
								className="inline-flex items-center text-primary-dark"
								onClick={() => setIsCollapsed(true)}
							>
								<ChevronUp className="h-4 w-4" />
								<span className="ml-2 text-primary-dark font-bold body2">
									{t("filter.showSelectedCategories")}
								</span>
							</button>
						</div>
					)}
				</div>
			)}
		</ContentContainer>
	);
};
