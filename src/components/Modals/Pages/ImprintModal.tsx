"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface ImprintModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ImprintModal({ open, onOpenChange }: ImprintModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Main description */}
			<h1>Datenschutz</h1>
			<p className="body1">
				{t("imprintModal.description", { ns: "content" })}
			</p>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("imprintModal.title", { ns: "content" })}
			subtitle={t("imprintModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
