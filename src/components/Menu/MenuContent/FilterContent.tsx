"use client";

import { useTranslation } from "react-i18next";

export function FilterContent() {
	const { t } = useTranslation("common");

	return <p>{t("filterDescription")}</p>;
}
