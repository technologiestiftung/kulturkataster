"use client";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";

export function AccessibilitySettingsModal() {
	const { t } = useTranslation("content");

	const content = (
		<div className="mt-8">
			<AccessibilityContent />
		</div>
	);

	return (
		<PageModal
			title={t("accessibilitySettingsModal.title")}
			subtitle={t("accessibilitySettingsModal.subtitle")}
			content={content}
			variant="fullScreenNoBottomDarkerBackground"
		/>
	);
}
