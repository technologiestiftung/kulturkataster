import { useTranslation } from "react-i18next";

interface SearchMessagesProps {
	hasError: string | null;
	hasResults: boolean;
	isLoading: boolean;
	query: string;
}

export function SearchMessages({
	hasError,
	isLoading,
	query,
}: SearchMessagesProps) {
	const { t } = useTranslation("common");

	if (hasError && !isLoading) {
		return (
			<div className="flex-1">
				<p className="body2">{hasError}</p>
			</div>
		);
	}

	if (query.trim().length === 0) {
		return (
			<div className="flex-1">
				<p className="body2">{t("search.description")}</p>
			</div>
		);
	}

	return null;
}
