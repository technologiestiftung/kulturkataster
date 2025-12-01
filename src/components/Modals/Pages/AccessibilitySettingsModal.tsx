"use client";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";

interface AccessibilitySettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AccessibilitySettingsModal({
	open,
	onOpenChange,
}: AccessibilitySettingsModalProps) {
	const { t } = useTranslation("content");

	const content = (
		<div className="mt-8">
			<AccessibilityContent openLinksInModal />
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("accessibilitySettingsModal.title")}
			subtitle={t("accessibilitySettingsModal.subtitle")}
			content={content}
			variant="fullScreenNoBottomDarkerBackground"
		/>
	);
}
