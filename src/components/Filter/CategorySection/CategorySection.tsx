"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { CategoryType, CategoryWithSubcategories } from "@/types";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CategorySectionProps {
	group: CategoryWithSubcategories;
	selectedCategories: string[];
	selectedSubcategories: string[];
	isOpen: boolean;
	onToggle: () => void;
	onCategoryChange: (key: string) => void;
	onSubcategoryChange: (key: string) => void;
	getCategoryCount: (key: string) => number;
	getSubcategoryCount: (key: string) => number;
}

export function CategorySection({
	group,
	selectedCategories,
	selectedSubcategories,
	isOpen,
	onToggle,
	onCategoryChange,
	onSubcategoryChange,
	getCategoryCount,
	getSubcategoryCount,
}: CategorySectionProps) {
	const IconComponent = getCategoryIconComponent(group.key as CategoryType);
	const { t: tEnum } = useTranslation("enumMap");

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

	const translatedCategoryName = tEnum(`category.${group.key}`) || group.key;

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
							<span className="font-bold">{translatedCategoryName}</span>
							<span className="pl-2">({getCategoryCount(group.key)})</span>
						</div>
					</button>
				</CollapsibleTrigger>

				<div className="relative w-6 h-6 flex items-center justify-center">
					<Checkbox
						checked={isChecked}
						onCheckedChange={() => onCategoryChange(group.key)}
						aria-label={`Checkbox ${translatedCategoryName}`}
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
				{group.subcategories.map((subcategory) => {
					const translatedSubcategoryName =
						tEnum(`subcategory.${subcategory.key}`) || subcategory.key;

					return (
						<div
							key={subcategory.key}
							className="flex items-center gap-2 justify-between py-1 w-full"
						>
							<span className="body2 w-full">
								{translatedSubcategoryName} (
								{getSubcategoryCount(subcategory.key)})
							</span>

							<div className="relative w-6 h-6 flex items-center justify-center">
								<Checkbox
									checked={selectedSubcategories.includes(subcategory.key)}
									onCheckedChange={() => onSubcategoryChange(subcategory.key)}
								/>
							</div>
						</div>
					);
				})}
			</CollapsibleContent>
		</Collapsible>
	);
}
