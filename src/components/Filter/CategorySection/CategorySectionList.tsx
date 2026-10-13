"use client";

import { FC, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { CategorySection } from "@/components/Filter/CategorySection/CategorySection";
import ChevronDown from "@/icons/chevron-down.svg";
import ChevronUp from "@/icons/chevron-up.svg";
import {
	getSortedCategories,
	getSortedSubcategories,
} from "@/lib/utils/filterUtils";
import type { Category, ChildCategory, FilterState } from "@/types";

export type CategorySectionListProps = {
	filters: FilterState | null;
	categoryGroups: Category[];
	categoryCounts?: Record<string, number>;
	subcategoryCounts?: Record<string, number>;
	onFiltersChange: (nextFilters: FilterState) => void;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	categorySectionMode?: "filter" | "selection";
	parentCategorySelectionBehavior?:
		| "select-all-children"
		| "parent-only"
		| "last-child-only";
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
	parentCategorySelectionBehavior = "select-all-children",
	selectionEmptyLabel,
	showHeader = false,
}) => {
	const { t } = useTranslation();
	const { t: tEnum, i18n } = useTranslation();
	const [openSections, setOpenSections] = useState<string[]>([]);
	const [isCollapsed, setIsCollapsed] = useState(
		collapsible ? defaultCollapsed : false,
	);
	const headingId = useId();

	const normalizeFilters = (input: FilterState): FilterState => ({
		...input,
		district_keys: input.district_keys ?? [],
		category_keys: input.category_keys ?? [],
		child_category_keys: input.child_category_keys ?? [],
		culture_index_ranges: input.culture_index_ranges ?? [],
		include_closed: input.include_closed ?? false,
		status: input.status ?? undefined,
	});

	const safeFilters = filters ? normalizeFilters(filters) : null;

	const collator = useMemo(
		() =>
			new Intl.Collator(i18n.language, { numeric: true, sensitivity: "base" }),
		[i18n.language],
	);

	const updateFilters = (nextFilters: FilterState) => {
		const normalizedFilters = normalizeFilters(nextFilters);
		if (categorySectionMode === "selection") {
			const categoryKeys = new Set(normalizedFilters.category_keys);
			const subcategoryToParent = new Map<string, string>();
			categoryGroups.forEach((group) => {
				(group.child_categories ?? []).forEach((sub) => {
					subcategoryToParent.set(sub.key, group.key);
				});
			});
			normalizedFilters.child_category_keys.forEach((key) => {
				const parentKey = subcategoryToParent.get(key);
				if (parentKey) categoryKeys.add(parentKey);
			});
			onFiltersChange({
				...normalizedFilters,
				category_keys: Array.from(categoryKeys),
			});
			return;
		}
		onFiltersChange(normalizedFilters);
	};

	const resolveParentSelectionSubcategoryKeys = (categoryGroup: Category) => {
		const groupSubcategoryKeys = (categoryGroup.child_categories ?? []).map(
			(subcategory: ChildCategory) => subcategory.key,
		);
		const nextSubcategories = safeFilters?.child_category_keys.filter(
			(key) => !groupSubcategoryKeys.includes(key),
		);

		if (!nextSubcategories) return [];
		if (parentCategorySelectionBehavior === "parent-only") {
			return nextSubcategories;
		}
		if (parentCategorySelectionBehavior === "last-child-only") {
			const sortedSubcategories = getSortedSubcategories(
				categoryGroup,
				collator,
				tEnum,
				() => true,
			);
			const lastSubcategory = sortedSubcategories.at(-1);
			return lastSubcategory
				? [...nextSubcategories, lastSubcategory.key]
				: nextSubcategories;
		}
		return [...nextSubcategories, ...groupSubcategoryKeys];
	};

	const isParentCategoryToggleActive = (
		categoryGroup: Category,
		selectedSubcategoriesInGroup: ChildCategory[],
		isCategorySelected: boolean,
		allSubcategoriesSelected: boolean,
	) => {
		if (isCategorySelected || allSubcategoriesSelected) {
			return true;
		}

		if (parentCategorySelectionBehavior !== "last-child-only") {
			return false;
		}

		const lastSubcategory = getSortedSubcategories(
			categoryGroup,
			collator,
			tEnum,
			() => true,
		).at(-1);

		return Boolean(
			lastSubcategory &&
				selectedSubcategoriesInGroup.some(
					(subcategory) => subcategory.key === lastSubcategory.key,
				),
		);
	};

	const toggleCategory = (categoryKey: string) => {
		if (!safeFilters) return;

		const categoryGroup = categoryGroups.find(
			(group) => group.key === categoryKey,
		);
		if (!categoryGroup) return;

		const isCategorySelected = safeFilters.category_keys.includes(categoryKey);
		const selectedSubcategoriesInGroup = (
			categoryGroup.child_categories ?? []
		).filter((subcategory: ChildCategory) =>
			safeFilters.child_category_keys.includes(subcategory.key),
		);
		const hasSubcategories = (categoryGroup.child_categories ?? []).length > 0;
		const allSubcategoriesSelected =
			hasSubcategories &&
			selectedSubcategoriesInGroup.length ===
				(categoryGroup.child_categories ?? []).length;
		const isActiveParentToggle = isParentCategoryToggleActive(
			categoryGroup,
			selectedSubcategoriesInGroup,
			isCategorySelected,
			allSubcategoriesSelected,
		);

		if (!isActiveParentToggle && !openSections.includes(categoryKey)) {
			toggleSection(categoryKey);
		}

		const groupSubcategoryKeys = (categoryGroup.child_categories ?? []).map(
			(subcategory: ChildCategory) => subcategory.key,
		);

		if (categorySectionMode === "selection") {
			if (isActiveParentToggle) {
				const newCategories = safeFilters.category_keys.filter(
					(c) => c !== categoryKey,
				);
				const newSubcategories = safeFilters.child_category_keys.filter(
					(s) => !groupSubcategoryKeys.includes(s),
				);
				updateFilters({
					...safeFilters,
					category_keys: newCategories,
					child_category_keys: newSubcategories,
				});
				return;
			}

			const newCategories = safeFilters.category_keys.includes(categoryKey)
				? safeFilters.category_keys
				: [...safeFilters.category_keys, categoryKey];
			const newSubcategories =
				resolveParentSelectionSubcategoryKeys(categoryGroup);
			updateFilters({
				...safeFilters,
				category_keys: newCategories,
				child_category_keys: newSubcategories,
			});
			return;
		}

		if (isActiveParentToggle) {
			const newCategories = safeFilters.category_keys.filter(
				(c) => c !== categoryKey,
			);
			const newSubcategories = safeFilters.child_category_keys.filter(
				(s) => !groupSubcategoryKeys.includes(s),
			);

			updateFilters({
				...safeFilters,
				category_keys: newCategories,
				child_category_keys: newSubcategories,
			});
		} else {
			const newSubcategories =
				resolveParentSelectionSubcategoryKeys(categoryGroup);

			updateFilters({
				...safeFilters,
				child_category_keys: newSubcategories,
			});
		}
	};

	const toggleSubcategory = (subcategoryKey: string) => {
		if (!safeFilters) return;

		const isSelected = safeFilters.child_category_keys.includes(subcategoryKey);
		const newSubcategories = isSelected
			? safeFilters.child_category_keys.filter((s) => s !== subcategoryKey)
			: [...safeFilters.child_category_keys, subcategoryKey];

		const parentCategory = categoryGroups.find((group) =>
			(group.child_categories ?? []).some(
				(subcategory: ChildCategory) => subcategory.key === subcategoryKey,
			),
		);

		let newCategories = safeFilters.category_keys;

		if (parentCategory) {
			if (categorySectionMode === "selection") {
				const hasRemainingInGroup = (
					parentCategory.child_categories ?? []
				).some((sub) => newSubcategories.includes(sub.key));
				if (hasRemainingInGroup) {
					if (!safeFilters.category_keys.includes(parentCategory.key)) {
						newCategories = [...safeFilters.category_keys, parentCategory.key];
					}
				} else {
					newCategories = safeFilters.category_keys.filter(
						(c) => c !== parentCategory.key,
					);
				}
			} else if (
				isSelected &&
				safeFilters.category_keys.includes(parentCategory.key)
			) {
				newCategories = safeFilters.category_keys.filter(
					(c) => c !== parentCategory.key,
				);
			}
		}

		updateFilters({
			...safeFilters,
			category_keys: newCategories,
			child_category_keys: newSubcategories,
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
		if (!safeFilters) return [];
		const selectedCategoryKeys = new Set(safeFilters.category_keys);
		const selectedSubcategoryKeys = new Set(safeFilters.child_category_keys);
		const filteredCategories = categoryGroups.filter((category) => {
			if (selectedCategoryKeys.has(category.key)) return true;
			return (category.child_categories ?? []).some((subcategory) =>
				selectedSubcategoryKeys.has(subcategory.key),
			);
		});
		return getSortedCategories(filteredCategories, collator, tEnum);
	}, [safeFilters, categoryGroups, collator, tEnum]);

	const hasActiveCategoryFilters = () => {
		return (
			(safeFilters?.category_keys && safeFilters.category_keys.length > 0) ||
			(safeFilters?.child_category_keys &&
				safeFilters.child_category_keys.length > 0)
		);
	};

	const resetCategoryFilters = () => {
		if (!safeFilters) return;
		updateFilters({
			...safeFilters,
			category_keys: [],
			child_category_keys: [],
		});
		setOpenSections([]);
	};

	const setAllCategoryFilters = () => {
		if (!safeFilters) return;
		const allCategoryKeys = categoryGroups.map((group) => group.key);
		const allSubcategoryKeys = categoryGroups.flatMap((group) =>
			(group.child_categories ?? []).map((sub) => sub.key),
		);
		updateFilters({
			...safeFilters,
			category_keys: allCategoryKeys,
			child_category_keys: allSubcategoryKeys,
		});
	};

	return (
		<Card variant="filter" className="w-full h-auto py-6 px-4">
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
									selectedCategories={safeFilters?.category_keys || []}
									selectedSubcategories={safeFilters?.child_category_keys || []}
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
							aria-label={t("content.filter.showMoreCategories")}
							className="inline-flex items-center text-primary-dark"
							onClick={() => setIsCollapsed(false)}
						>
							<ChevronDown className="h-4 w-4" />
							<span className="ml-2 text-primary-dark font-bold body2">
								{t("content.filter.showMoreCategories")}
							</span>
						</button>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{showHeader && (
						<div className="flex items-center justify-between mb-4">
							<h3 id={headingId} className="body1 font-bold">
								{t("content.filter.categories.title")}
							</h3>
							<button
								type="button"
								className="body2 font-light underline"
								onClick={
									hasActiveCategoryFilters()
										? resetCategoryFilters
										: setAllCategoryFilters
								}
							>
								{hasActiveCategoryFilters()
									? t("content.filter.categories.resetFilters")
									: t("content.filter.categories.setAllFilters")}
							</button>
						</div>
					)}
					<div
						className="space-y-2"
						role={showHeader ? "group" : undefined}
						aria-labelledby={showHeader ? headingId : undefined}
					>
						{getSortedCategories(categoryGroups, collator, tEnum).map(
							(category) => (
								<CategorySection
									key={category.key}
									group={category}
									selectedCategories={safeFilters?.category_keys || []}
									selectedSubcategories={safeFilters?.child_category_keys || []}
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
								aria-label={t("content.filter.showSelectedCategories")}
								className="inline-flex items-center text-primary-dark"
								onClick={() => setIsCollapsed(true)}
							>
								<ChevronUp className="h-4 w-4" />
								<span className="ml-2 text-primary-dark font-bold body2">
									{t("content.filter.showSelectedCategories")}
								</span>
							</button>
						</div>
					)}
				</div>
			)}
		</Card>
	);
};
