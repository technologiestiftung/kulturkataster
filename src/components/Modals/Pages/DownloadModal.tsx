"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import TextWithLinks from "@/components/Content/TextWithLinks";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";

export function DownloadModal() {
	const { t } = useTranslation(["content", "common", "enumMap"]);

	const content = (
		<div className="space-y-6 flex flex-col">
			<span>{t("downloadModal.description1", { ns: "content" })}</span>
			<span>{t("downloadModal.description2", { ns: "content" })}</span>
			<div className="flex items-center space-x-2">
				<ArrowNarrowRight />
				<TextWithLinks text={t("downloadModal.link", { ns: "content" })} />
			</div>
		</div>
	);

	return (
		<PageModal
			title={t("downloadModal.title", { ns: "content" })}
			content={content}
			variant="medium"
			hasFooter={false}
			showBackButton={false}
		/>
	);
}
