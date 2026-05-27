"use client";

import { useTranslation } from "react-i18next";
import LockIcon from "@/icons/lock.svg";

type PrivateBadgeProps = {
	hoverDescription?: string;
};

export function PrivateBadge({ hoverDescription }: PrivateBadgeProps) {
	const { t } = useTranslation();
	const resolvedHoverDescription =
		hoverDescription ??
		t("common.privateFieldDescription", {
			defaultValue:
				"Diese Information wird ausschließlich für befugte Nutzer*innen im geschützten Bereich des Kulturkatasters zugänglich und nicht öffentlich einsehbar sein.",
		});

	return (
		<span
			className="body3 italic inline-block truncate"
			title={resolvedHoverDescription}
			aria-label={resolvedHoverDescription}
		>
			<LockIcon className="inline w-3 h-3 mr-1" />
			{t("common.sensitiveInformation", {
				defaultValue: "Sensitive information",
			})}
		</span>
	);
}
