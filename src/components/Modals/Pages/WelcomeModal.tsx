"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import { useModalStore } from "@/lib/store/modalStore";
import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import SenateLogo from "@/logos/senate.svg";
import { useTranslation } from "react-i18next";
import { ModalFooter } from "../ModalFooter";

interface WelcomeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
	const { t } = useTranslation(["content", "common"]);
	const { openModal } = useModalStore();

	const handleAboutClick = () => {
		onOpenChange(false);
		openModal("about");
	};

	const handleInfoClick = () => {
		onOpenChange(false);
		openModal("information");
	};

	const handleFooterItemClickWelcomeModal = (id: string) => {
		onOpenChange(false);
		openModal(id);
	};

	const footerItems = [
		{ id: "accessibility" },
		{ id: "simpleLanguageInformation" },
		{ id: "signLanguageInformationLong" },
	] as const;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="medium" className="flex ">
				<div className="flex flex-col md:flex-row gap-8 py-12 md:pt-32 md:pb-12 px-6">
					<div className="md:w-1/4 flex justify-center align-start h-full">
						<KukaLargeLogo className="h-auto w-32 md:w-42" />
					</div>
					<div className="md:w-3/4 flex flex-col items-start space-y-4 md:pr-32 ">
						<div className="flex flex-col space-y-2">
							<DialogTitle className="display text-center md:text-left">
								{t("welcomeModal.title", { ns: "content" })}
							</DialogTitle>
							<h1 className="text-center md:text-left">
								{t("welcomeModal.subtitle", { ns: "content" })}
							</h1>
						</div>
						<div className="flex flex-col md:items-start space-y-2">
							<div className="space-y-4">
								<p className="body1">
									{t("welcomeModal.description1", { ns: "content" })}
								</p>
								<p className="body1">
									{t("welcomeModal.description2", { ns: "content" })}
								</p>
							</div>
							<div className="text-primary-dark flex space-x-2 cursor-pointer">
								<ArrowNarrowRight className="stroke-primary-dark size-6" />
								<a
									className="underline body2"
									target="_blank"
									href="https://flow.cleverreach.com/fl/21a1a529-f085-4bd1-8e53-d657c3ccc1de/"
								>
									{t("welcomeModal.newsletter", { ns: "content" })}
								</a>
							</div>
						</div>
						<div className="space-y-4 w-full">
							<div className="flex flex-col md:flex-row md:space-x-2 w-full mb-5 mt-12 md:mb-0">
								<div className="flex-grow md:flex-none">
									<Button
										className="w-full md:w-auto mb-2 md:mb-0 cursor-pointer"
										onClick={() => onOpenChange(false)}
									>
										{t("welcomeModal.discoverButton", { ns: "content" })}
									</Button>
								</div>
								<div className="flex w-full md:w-auto space-x-2">
									<Button
										variant="outline"
										className="w-1/2 md:w-auto cursor-pointer"
										onClick={handleAboutClick}
									>
										{t("welcomeModal.aboutButton", { ns: "content" })}
									</Button>
									<Button
										variant="outline"
										className="w-1/2 md:w-auto cursor-pointer"
										onClick={handleInfoClick}
									>
										{t("welcomeModal.infoButton", { ns: "content" })}
									</Button>
								</div>
							</div>
							<Separator className="w-full mt-20 mb-6 hidden md:block" />
							<div className="hidden md:flex space-x-2 md:mb-12 space-y-12 md:space-y-0 flex-col md:flex-row w-full justify-center">
								<div className="w-full md:w-1/2">
									<p className="body2">
										{t("footer.credit.text", { ns: "common" })}
									</p>
								</div>
								<div className="flex md:w-1/2 md:justify-end justify-around gap-2 space-x-4 md:mx-4">
									<KRBLogo className="w-20 md:w-24 h-auto bg-white" />
									<SenateLogo className="w-32 md:w-42 h-auto bg-white" />
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="hidden md:block">
					<nav
						aria-label={t("footer.navigation")}
						className="bg-neutral-5 py-2 px-4 w-full"
					>
						<ul className="flex gap-4 body2 font-bold justify-end">
							{footerItems.map((item) => (
								<li key={item.id}>
									<button
										className="body2 font-bold"
										onClick={() => handleFooterItemClickWelcomeModal(item.id)}
									>
										{t(`footer.${item.id}`)}
									</button>
								</li>
							))}
						</ul>
					</nav>
				</div>
				<div className="md:hidden">
					<ModalFooter />
				</div>
			</DialogContent>
		</Dialog>
	);
}
