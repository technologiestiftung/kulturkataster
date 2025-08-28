"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface PrivacyModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Main description */}
			<h1>{t("privacyModal.title", { ns: "content" })}</h1>
			<p className="body1">
				{t("privacyModal.description", { ns: "content" })}
			</p>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("privacyModal.title", { ns: "content" })}
			subtitle={t("privacyModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
