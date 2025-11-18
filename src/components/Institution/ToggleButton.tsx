"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ToggleButtonProps {
	showMore: boolean;
	onClick: (e: React.MouseEvent) => void;
	hasInfo?: boolean;
	className?: string;
}

export function ToggleButton({
	showMore,
	onClick,
	hasInfo = true,
	className = "",
}: ToggleButtonProps) {
	const { t } = useTranslation("common");

	if (!hasInfo) return null;

	return (
		<div className="mt-4">
			<Button
				variant="accordion"
				size="icon-default"
				onClick={onClick}
				className={`text-primary-dark hover:text-primary-dark ${className}`}
			>
				{showMore ? (
					<ChevronUp size={16} aria-hidden="true" focusable="false" />
				) : (
					<ChevronDown size={16} aria-hidden="true" focusable="false" />
				)}
				<span className="body2">
					{showMore ? t("institution.lessInfo") : t("institution.moreInfo")}
				</span>
			</Button>
		</div>
	);
}
