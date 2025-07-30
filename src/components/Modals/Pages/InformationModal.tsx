"use client";

import { PageModal } from "../PageModal";
import { useTranslation, Trans } from "react-i18next";
import { Button } from "@/components/ui/button";
import Download from "@/icons/download.svg";
import LinkedIn from "@/icons/linkedin.svg";
import Facebook from "@/icons/facebook.svg";
import Instagram from "@/icons/instagram.svg";

interface InformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InformationModal({
	open,
	onOpenChange,
}: InformationModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Main description */}
			<p className="body1">
				{t("informationModal.description", { ns: "content" })}
			</p>

			{/* Methodology section */}
			<div className="space-y-4">
				<h2>{t("informationModal.methodology.title", { ns: "content" })}</h2>
				<p className="body2">
					{t("informationModal.methodology.description1", { ns: "content" })}
				</p>
				<p className="body2">
					{t("informationModal.methodology.description2", { ns: "content" })}
				</p>
			</div>

			{/* Usage info section */}
			<div className="space-y-4">
				<h2>{t("informationModal.usage_info.title", { ns: "content" })}</h2>
				<p className="body2">
					{t("informationModal.usage_info.description1", { ns: "content" })}
				</p>
				<p className="body2">
					{t("informationModal.usage_info.description2", { ns: "content" })}
				</p>
				<Button variant="outline" className="mt-4">
					<Download className="mr-2 h-6 w-6" />
					{t("informationModal.usage_info.downloadPDF", { ns: "content" })}
				</Button>
				<div className="mt-20 flex justify-between">
					<div>
						<Trans
							i18nKey="footer.openSource"
							ns="common"
							components={[
								<a
									href="https://github.com/technologiestiftung/kulturkataster-frontend/"
									target="_blank"
									key={"sourceLink"}
									rel="noopener noreferrer"
									className="underline font-bold text-primary-dark"
								/>,
							]}
						/>
					</div>
					<div className="flex space-x-4">
						<Facebook className="size-6 cursor-pointer" />
						<Instagram className="size-6 cursor-pointer" />
						<LinkedIn className="size-6 cursor-pointer" />
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("informationModal.title", { ns: "content" })}
			subtitle={t("informationModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
