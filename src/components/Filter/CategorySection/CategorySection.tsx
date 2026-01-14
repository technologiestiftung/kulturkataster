/* eslint-disable complexity */
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { CategoryType, Category } from "@/types";
import Minus from "@/icons/minus.svg";
import ChevronDown from "@/icons/chevron-down.svg";
import ChevronUp from "@/icons/chevron-down.svg";

import { useTranslation } from "react-i18next";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getSortedSubcategories } from "@/lib/utils/filterUtils";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
	group: Category;
	selectedCategories: string[];
	selectedSubcategories: string[];
	isOpen: boolean;
	onToggle: () => void;
	onCategoryChange: (key: string) => void;
	onSubcategoryChange: (key: string) => void;
	categoryCount?: number;
	subcategoryCounts?: Record<string, number>;
}

export function CategorySection({
	group,
	selectedCategories,
	selectedSubcategories,
	isOpen,
	onToggle,
	onCategoryChange,
	onSubcategoryChange,
	categoryCount,
	subcategoryCounts: subcategoryCountsOverride,
}: CategorySectionProps) {
	const IconComponent = getCategoryIconComponent(group.key as CategoryType);
	const { t: tEnum, i18n } = useTranslation("enumMap");

	const collator = useMemo(
		() =>
			new Intl.Collator(i18n.language, { numeric: true, sensitivity: "base" }),
		[i18n.language],
	);

	const sortedSubcategories = useMemo(
		() => getSortedSubcategories(group, collator, tEnum, () => true),
		[group, collator, tEnum],
	);

	const storeCategoryCount = useInstitutionStore(
		(state) => state.categoryCounts[group.key] || 0,
	);
	const storeSubcategoryCounts = useInstitutionStore(
		(state) => state.subcategoryCounts,
	);
	const resolvedCategoryCount = categoryCount ?? storeCategoryCount;
	const resolvedSubcategoryCounts =
		subcategoryCountsOverride ?? storeSubcategoryCounts;

	// Determine checkbox state for category
	const selectedSubcategoriesInGroup = (group.subcategory || []).filter((sub) =>
		selectedSubcategories.includes(sub.key),
	);
	const allSubcategoriesSelected =
		selectedSubcategoriesInGroup.length === (group.subcategory || []).length;
	const someSubcategoriesSelected = selectedSubcategoriesInGroup.length > 0;
	const categorySelected = selectedCategories.includes(group.key);

	const isChecked = categorySelected || allSubcategoriesSelected;
	const isIndeterminate =
		!categorySelected && someSubcategoriesSelected && !allSubcategoriesSelected;

	const translatedCategoryName = tEnum(`category.${group.key}`) || group.key;

	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<div className="flex items-center gap-2 justify-between w-full p-2 rounded">
				<CollapsibleTrigger asChild>
					<button className="flex items-center gap-2 w-full">
						{isOpen ? (
							<ChevronUp
								className="size-4"
								aria-hidden="true"
								focusable="false"
							/>
						) : (
							<ChevronDown
								className="size-4"
								aria-hidden="true"
								focusable="false"
							/>
						)}
						<div className="w-6 h-6">
							<IconComponent aria-hidden="true" focusable="false" />
						</div>
						<div className="body2 text-left">
							<span className="font-bold">{translatedCategoryName}</span>
							<span className="pl-2">({resolvedCategoryCount})</span>
						</div>
					</button>
				</CollapsibleTrigger>

				<div className="relative w-10 h-10 md:w-6 md:h-6 flex items-center justify-center">
					<Checkbox
						checked={isChecked}
						onCheckedChange={() => onCategoryChange(group.key)}
						aria-label={`${translatedCategoryName}`}
						aria-checked={isIndeterminate ? "mixed" : isChecked}
						variant="filter"
						size="filter"
						className={cn(
							isIndeterminate && "contrast:border-interaction-dark",
						)}
					/>
					{isIndeterminate && (
						<div className="absolute flex items-center justify-center pointer-events-none">
							<Minus
								className="text-neutral-80 contrast:text-interaction-dark size-4 md:size-2.5"
								aria-hidden="true"
								focusable="false"
							/>
						</div>
					)}
				</div>
			</div>

			<CollapsibleContent className="pl-16 pr-2 space-y-1">
				{sortedSubcategories.map((subcategory) => {
					const translatedSubcategoryName =
						tEnum(`subcategory.${subcategory.key}`) || subcategory.key;

					return (
						<div
							key={subcategory.key}
							className="flex items-center gap-2 justify-between py-1 w-full"
						>
							<span className="body2 w-full">
								{translatedSubcategoryName} (
								{resolvedSubcategoryCounts[subcategory.key] || 0})
							</span>

							<div className="relative w-10 h-10 md:w-6 md:h-6 flex items-center justify-center">
								<Checkbox
									checked={selectedSubcategories.includes(subcategory.key)}
									onCheckedChange={() => onSubcategoryChange(subcategory.key)}
									aria-label={`${translatedSubcategoryName}`}
									variant="filter"
									size="filter"
								/>
							</div>
						</div>
					);
				})}
			</CollapsibleContent>
		</Collapsible>
	);
}
