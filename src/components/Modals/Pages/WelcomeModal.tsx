"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
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
				className="flex flex-col md:flex-row gap-4 pt-12 md:pt-32"
			>
				<div className="md:w-1/4 flex justify-center">
					<KukaLargeLogo />
				</div>
				<div className="md:w-3/4 flex flex-col items-start space-y-4 md:pr-32 ">
					<DialogTitle className="display text-center md:text-left">
						{t("welcomeModal.title", { ns: "content" })}
					</DialogTitle>
					<h1 className="text-center md:text-left">
						{t("welcomeModal.subtitle", { ns: "content" })}
					</h1>
					<div className="space-y-4">
						<p className="body1">
							{t("welcomeModal.description", { ns: "content" })}
						</p>
						<div className="text-primary-dark flex space-x-2 items-center">
							<ArrowNarrowRight className="stroke-primary-dark size-6" />
							<a>{t("welcomeModal.newsletter", { ns: "content" })}</a>
						</div>
						<div className="flex flex-col md:flex-row md:space-x-2 w-full mb-5 mt-12 md:mt-8 md:mb-0">
							<Button
								className="w-full md:w-auto mb-2 md:mb-0"
								onClick={() => onOpenChange(false)}
							>
								{t("welcomeModal.discoverButton", { ns: "content" })}
							</Button>
							<div className="flex w-full md:w-auto space-x-2">
								<Button
									variant="outline"
									className="w-1/2 md:w-auto"
									onClick={() => onOpenChange(false)}
								>
									{t("welcomeModal.aboutButton", { ns: "content" })}
								</Button>
								<Button
									variant="outline"
									className="w-1/2 md:w-auto"
									onClick={() => onOpenChange(false)}
								>
									{t("welcomeModal.infoButton", { ns: "content" })}
								</Button>
							</div>
						</div>
						<Separator className="w-full mt-12 md:mt-20 mb-6" />
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
