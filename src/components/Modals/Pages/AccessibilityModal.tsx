"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface AccessibilityModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AccessibilityModal({
	open,
	onOpenChange,
}: AccessibilityModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Main description */}
			<h1>Datenschutz</h1>
			<p className="body1">
				{t("accessibilityModal.description", { ns: "content" })}
			</p>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("accessibilityModal.title", { ns: "content" })}
			subtitle={t("accessibilityModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
