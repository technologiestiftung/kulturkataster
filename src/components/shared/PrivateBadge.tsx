"use client";

import { useTranslation } from "react-i18next";
import LockIcon from "@/icons/lock.svg";

export function PrivateBadge() {
	const { t } = useTranslation("common");

	return (
		<span className="body3 italic px-2 py-0.5 flex items-center">
			<LockIcon className="inline w-3 h-3 mr-1" />
			{t("sensitiveInformation", {
				defaultValue: "Sensitive information",
			})}
		</span>
	);
}
