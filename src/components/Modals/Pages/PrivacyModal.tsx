"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";

export function PrivacyModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			<h1>{t("privacyModal.title", { ns: "content" })}</h1>
			<p className="body1">
				{t("privacyModal.description", { ns: "content" })}
			</p>
		</div>
	);

	return (
		<Modal
			title={t("privacyModal.title", { ns: "content" })}
			subtitle={t("privacyModal.subtitle", { ns: "content" })}
			routePath={routePath}
			content={content}
			hideLinksInModalFooter={["privacy"]}
		/>
	);
}
