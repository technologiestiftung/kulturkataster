import {
	getParentCategories,
	getSubcategoriesForCategory,
} from "@/lib/utils/institutionUtils";
import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { PrivateBadge } from "../shared/PrivateBadge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { getCategoryLabel } from "@/lib/i18n/fieldLabels";

export function CategoryItem({
	data,
	variant = "compact",
	label,
	description,
	isPrivate = false,
	action,
}: {
	data: Partial<Institution>;
	variant?: "default" | "plain" | "compact";
	label?: string;
	description?: string;
	isPrivate?: boolean;
	action?: React.ReactNode;
}) {
	const categories = getParentCategories(data);
	const { t: tEnum } = useTranslation();
	if (!categories?.length) return null;
	return (
		<div className="flex justify-center gap-2 flex-col">
			{label && (
				<div className="flex items-start justify-between gap-3">
					<p className="body2">
						<strong>{label}:</strong>
					</p>
				</div>
			)}
			{description && <p className="body2 text-neutral-80">{description}</p>}
			<div className="flex justify-between gap-2">
				<div className="">
					{categories.map((category) => {
						const subCategories = getSubcategoriesForCategory(
							data,
							category.id,
						);

						return (
							<div
								key={category.id}
								className="flex items-start gap-1 flex-row"
							>
								<CategoryIcon
									iconUrl={category.icon}
									categoryKey={category.key}
									className="mr-1 h-6 w-6"
								/>

								<div
									className={`flex items-start flex-1 gap-1 flex-wrap
                            ${variant === "compact" ? "flex-row " : "flex-col"}
                            `}
								>
									<strong className="body2">
										{getCategoryLabel(tEnum, category.key)}
									</strong>
									{variant === "compact" && <span className="body2">•</span>}
									{subCategories?.length
										? subCategories.map((sub, index, filteredArray) => (
												<span className="body2" key={sub.id}>
													{getCategoryLabel(tEnum, sub.key)}
													{index < filteredArray.length - 1 && ", "}
												</span>
											))
										: null}
								</div>
							</div>
						);
					})}
				</div>
				<div className="mr-2">{action}</div>
			</div>
			<div>{isPrivate ? <PrivateBadge /> : null}</div>
		</div>
	);
}
