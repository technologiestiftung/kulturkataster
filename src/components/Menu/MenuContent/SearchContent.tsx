"use client";

import { useTranslation } from "react-i18next";
import GeolocationSearch from "../../GeolocationSearch/GeolocationSearch";

export function SearchContent() {
	const { t } = useTranslation("common");

	return (
		<div className="space-y-4 flex flex-col p-6">
			<GeolocationSearch />
			<p>{t("search.description")}</p>
			<p className="text-sm text-muted-foreground">
				{t("search.hint")}
			</p>
		</div>
	);
}