"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import TextWithLinks from "@/components/Content/TextWithLinks";

interface DownloadModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode?: "all" | "filtered" | "selected";
}

export function DownloadModal({ open, onOpenChange }: DownloadModalProps) {
	const { t } = useTranslation(["content", "common", "enumMap"]);

	const content = (
		<div className="space-y-6 flex flex-col">
			<span>{t("downloadModal.description1", { ns: "content" })}</span>
			<span>{t("downloadModal.description2", { ns: "content" })}</span>
			<span>
				<TextWithLinks text={t("downloadModal.link", { ns: "content" })} />
			</span>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("downloadModal.title", { ns: "content" })}
			content={content}
			variant="medium"
			hasFooter={false}
		/>
	);
}
