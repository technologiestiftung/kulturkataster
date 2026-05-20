"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import SenateLogo from "@/logos/senate.svg";
import { useTranslation } from "react-i18next";
import { ModalFooter } from "../ModalFooter";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModalLink } from "@/lib/utils/modalRouting";
import { useAppStore } from "@/lib/store/appStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function WelcomeModal() {
	const { t } = useTranslation(["content", "common"]);
	const { setFirstTimeUser } = useAppStore();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	const footerItems = [
		{ id: "accessibility" },
		{ id: "simpleLanguageInformation" },
		{ id: "signLanguageInformationLong" },
	] as const;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) {
					setFirstTimeUser(false);
					if (typeof window !== "undefined" && window.history.length > 1) {
						router.back();
					} else {
						router.push(toLocalePath("/"));
					}
				}
			}}
		>
			<DialogContent variant="centered" className="flex" showBackButton={false}>
				<div className="flex flex-col md:flex-row gap-8 py-12 md:pt-32 md:pb-12 px-6 md:bg-transparent bg-background">
					<div className="md:w-1/4 flex justify-center align-start h-full">
						<KukaLargeLogo
							title="Kulturkataster Berlin, Logo"
							className="h-auto w-32 md:w-42"
						/>
					</div>
					<div className="md:w-3/4 flex flex-col items-start space-y-4 md:pr-32 ">
						<div className="flex flex-col space-y-2">
							<DialogTitle asChild className="text-center md:text-left">
								<h1>{t("welcomeModal.title", { ns: "content" })}</h1>
							</DialogTitle>
							<h2 className="text-center md:text-left">
								{t("welcomeModal.subtitle", { ns: "content" })}
							</h2>
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
									className="underline body2 text-primary-dark font-semibold"
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
										onClick={() => {
											setFirstTimeUser(false);
											if (
												typeof window !== "undefined" &&
												window.history.length > 1
											) {
												router.back();
											} else {
												router.push(toLocalePath("/"));
											}
										}}
									>
										{t("welcomeModal.discoverButton", { ns: "content" })}
									</Button>
								</div>
								<div className="flex w-full md:w-auto space-x-2">
									<Button
										variant="outline"
										className="w-1/2 md:w-auto cursor-pointer"
										onClick={() => router.push(toLocalePath("/about"))}
									>
										{t("welcomeModal.aboutButton", { ns: "content" })}
									</Button>
									<Button
										variant="outline"
										className="w-1/2 md:w-auto cursor-pointer"
										onClick={() => router.push(toLocalePath("/info"))}
									>
										{t("welcomeModal.infoButton", { ns: "content" })}
									</Button>
								</div>
							</div>
							<div className="mt-4">
								<Button
									variant="link"
									onClick={() =>
										router.push(toLocalePath("/accessibilitySettings"))
									}
									className="underline body2 text-primary-dark font-semibold p-0 md:p-0 underline-offset-1 rounded-none focus-visible:ring-offset-0"
								>
									{t("welcomeModal.accessibilitySettings", { ns: "content" })}
								</Button>
							</div>
							<Separator className="w-full mt-20 mb-6 hidden md:block" />
							<div className="hidden md:flex space-x-2 md:mb-12 space-y-12 md:space-y-0 flex-col md:flex-row w-full justify-center">
								<div className="w-full md:w-1/2">
									<p className="body2">
										{t("footer.credit.text", { ns: "common" })}
									</p>
								</div>
								<div className="flex md:w-1/2 md:justify-end justify-around gap-2 space-x-4 md:mx-4">
									<KRBLogo
										title="Kulturraum Berlin gGmbH, Logo"
										className="w-20 md:w-24 h-auto bg-background"
									/>
									<SenateLogo
										title="Logo der Senatsverwaltung für Kultur und Gesellschaftlichen Zusammenhalt, Logo"
										className="w-32 md:w-42 h-auto bg-background"
									/>
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
						<ul
							className="flex gap-4 body2 font-bold justify-end"
							aria-label={t("footer.welcomeModalLinkListAriaLabel")}
						>
							{footerItems.map((item) => {
								const link = getModalLink(item.id, toLocalePath);
								return (
									<li key={item.id}>
										<Link
											className="body2 font-bold select-none"
											href={link.url}
											target={link.target}
											rel="noopener noreferrer"
										>
											{t(`footer.${item.id}`)}
										</Link>
									</li>
								);
							})}
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
