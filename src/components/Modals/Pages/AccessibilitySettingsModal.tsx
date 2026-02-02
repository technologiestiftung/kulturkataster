"use client";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";

export function AccessibilitySettingsModal({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation("content");

	const content = (
		<div className="mt-8">
			<AccessibilityContent />
		</div>
	);

	return (
		<Modal
			title={t("accessibilitySettingsModal.title")}
			subtitle={t("accessibilitySettingsModal.subtitle")}
			routePath={routePath}
			content={content}
			variant="fullscreen-muted"
		/>
	);
}
