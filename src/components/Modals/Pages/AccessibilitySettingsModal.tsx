"use client";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";

export function AccessibilitySettingsModal({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation();

	const content = (
		<div className="mt-8">
			<AccessibilityContent />
		</div>
	);

	return (
		<Modal
			title={t("content.accessibilitySettingsModal.title")}
			subtitle={t("content.accessibilitySettingsModal.subtitle")}
			routePath={routePath}
			variant="fullscreen-muted"
		>
			{content}
		</Modal>
	);
}
