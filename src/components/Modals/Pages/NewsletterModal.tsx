"use client";

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { NewsletterForm } from "@/components/Auth/NewsletterForm";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useRouter } from "next/navigation";

export function NewsletterModal({
	routePath,
	returnTo,
	showConfirmation,
}: {
	routePath?: string;
	returnTo?: string;
	showConfirmation?: boolean;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const [didSubscribe, setDidSubscribe] = useState(false);
	let content: React.ReactNode;

	if (showConfirmation) {
		content = (
			<div className="p-4 md:p-8 mb-64 mt-14 flex justify-center flex-col gap-8 max-w-3xl mx-auto w-full">
				<div className="space-y-4">
					<h1>{t("common.auth.newsletter.successMessageTitle")}</h1>
					<p className="text-foreground">
						{t("common.auth.newsletter.successMessageDescription")}
					</p>
				</div>
				<div>
					<Button
						variant="primary"
						className="w-full"
						onClick={() => router.replace(toLocalePath("/map"))}
					>
						{t("common.auth.newsletter.successCta", {
							defaultValue: "Fertig",
						})}
					</Button>
				</div>
			</div>
		);
	} else if (didSubscribe) {
		content = (
			<div className="w-full md:max-w-3xl mx-auto">
				<div className="text-start mb-10 ">
					<h1>{t("common.auth.newsletter.thankYou")}</h1>
					<p className="body2 mt-4">
						{t("common.auth.newsletter.successMessageMail")}
					</p>
				</div>
				<Button
					variant="primary"
					className="w-full"
					onClick={() => router.replace(toLocalePath("/map"))}
				>
					{t("common.auth.newsletter.successCta", {
						defaultValue: "Fertig",
					})}
				</Button>
			</div>
		);
	} else {
		content = (
			<div className="w-full md:max-w-3xl mx-auto">
				<div className="text-start mb-10">
					<h1>{t("common.auth.newsletter.title")}</h1>
					<div className="mt-4">
						<Trans
							i18nKey="content.auth.newsletter.subtitle"
							components={{
								link: (
									<a
										href="https://dsgvo-info.cortina-consult.de/kulturkataster/"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary-dark hover:text-primary underline"
									>
										{t("common.auth.newsletter.privacyLink")}
									</a>
								),
							}}
						/>
					</div>
				</div>
				<NewsletterForm onSuccess={() => setDidSubscribe(true)} />
			</div>
		);
	}

	return (
		<Modal
			title={t("common.auth.newsletter.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			contentWrapperClassName="flex-1"
			showBackButton
			routePath={routePath}
			returnTo={returnTo ?? "/register"}
		>
			{content}
		</Modal>
	);
}
