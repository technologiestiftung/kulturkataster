"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface SignLanguageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SignLanguageModal({
	open,
	onOpenChange,
}: SignLanguageModalProps) {
	const { t } = useTranslation("content");

	const content = (
		<div className="space-y-10">
			<div className="space-y-4">
				<video controls>
					<source
						src="https://www.manua.cloud/gobackend/mediaserver?fp=%2FfileOrigs%2Fc6%2FC62lJeh1iXj1zaSSZz_-1759834704_T3R3REv.mp4"
						type="video/mp4"
					/>
				</video>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("signLanguageModal.title")}
			subtitle={t("signLanguageModal.subtitle")}
			content={content}
		/>
	);
}
