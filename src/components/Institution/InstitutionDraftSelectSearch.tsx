"use client";

import { useTranslation } from "react-i18next";
import { LocationSearch } from "@/components/Search/LocationSearch";

type InstitutionDraftSelectSearchProps = {
	onQueryChange: (query: string) => void;
	onLoadingChange?: (isLoading: boolean) => void;
};

export function InstitutionDraftSelectSearch({
	onQueryChange,
	onLoadingChange,
}: InstitutionDraftSelectSearchProps) {
	const { t } = useTranslation();

	return (
		<LocationSearch
			onQueryChange={onQueryChange}
			onLoadingChange={onLoadingChange}
			showResults={false}
			searchFunction={async () => []}
			placeholder={t("common.institution.editSelectSearchPlaceholder", {
				defaultValue: "Kulturort suchen...",
			})}
		/>
	);
}
