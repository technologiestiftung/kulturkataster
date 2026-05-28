import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface SearchMessagesProps {
	hasError: string | null;
	hasResults: boolean;
	isLoading: boolean;
	query: string;
	className?: string;
}

export function SearchMessages({
	hasError,
	isLoading,
	query,
	className,
}: SearchMessagesProps) {
	const { t } = useTranslation();

	if (hasError && !isLoading) {
		return (
			<div className={cn("flex-1", className)}>
				<p className="body2">{hasError}</p>
			</div>
		);
	}

	if (query.trim().length === 0) {
		return (
			<div className={cn("flex-1", className)}>
				<p className="body2">{t("common.search.description")}</p>
			</div>
		);
	}

	return null;
}
