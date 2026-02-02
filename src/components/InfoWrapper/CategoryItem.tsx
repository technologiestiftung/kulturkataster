import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import {
	getParentCategories,
	getSubcategoriesForCategory,
} from "@/lib/utils/institutionUtils";
import { Institution } from "@/types";
import { useTranslation } from "react-i18next";

export function CategoryItem({
	data,
	variant = "compact",
}: {
	data: Partial<Institution>;
	variant?: "default" | "plain" | "compact";
}) {
	const categories = getParentCategories(data);
	const { t: tEnum } = useTranslation("enumMap");
	if (!categories?.length) return null;
	return (
		<div className="flex justify-center gap-2 flex-col">
			{categories.map((category) => {
				const IconComponent = getCategoryIconComponent(category.key);
				const subCategories = getSubcategoriesForCategory(data, category.id);

				return (
					<div key={category.id} className="flex items-start gap-1 flex-row">
						<IconComponent
							aria-hidden="true"
							focusable="false"
							className="mr-1 h-6 w-6"
						/>
						<div
							className={`flex items-start flex-1 gap-1 flex-wrap
                            ${variant === "compact" ? "flex-row " : "flex-col"}
                            `}
						>
							<strong className="body2">
								{tEnum(`category.${category.key}`)}
							</strong>
							{variant === "compact" && <span className="body2">•</span>}
							{subCategories?.length
								? subCategories.map((sub, index, filteredArray) => (
										<span className="body2" key={sub.id}>
											{tEnum(`subcategory.${sub.key}`)}
											{index < filteredArray.length - 1 && ", "}
										</span>
									))
								: null}
						</div>
					</div>
				);
			})}
		</div>
	);
}
