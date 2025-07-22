"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import "@/i18n/client";
import { Separator } from "@/components/ui/separator";

interface WelcomeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
	const { t } = useTranslation(["content", "common"]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="medium"
				className="grid grid-flow-col grid-cols-8 gap-4 pt-32"
			>
				<div className="col-span-2 flex justify-center">
					<KukaLargeLogo />
				</div>
				<div className="col-span-6 flex flex-col items-start space-y-4 pr-32">
					<DialogTitle className="display">
						{t("welcomeModal.title", { ns: "content" })}
					</DialogTitle>
					<h1>{t("welcomeModal.subtitle", { ns: "content" })}</h1>
					<div className="space-y-4">
						<p className="body1">
							{t("welcomeModal.description", { ns: "content" })}
						</p>
						<a className="">
							{t("welcomeModal.newsletter", { ns: "content" })}
						</a>
						<div className="flex space-x-2">
							<Button onClick={() => onOpenChange(false)}>
								{t("welcomeModal.discoverButton", { ns: "content" })}
							</Button>
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								{t("welcomeModal.aboutButton", { ns: "content" })}
							</Button>
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								{t("welcomeModal.infoButton", { ns: "content" })}
							</Button>
						</div>
						<Separator className="w-full mt-14" />
						<div className="flex space-x-2">
							<p className="body2">
								{t("footer.credit.text", { ns: "common" })}
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
