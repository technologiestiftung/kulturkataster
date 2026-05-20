"use client";

import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();

	return (
		<Modal
			title={t("auth.newsletter.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
		>
			{showConfirmation ? (
				<div className="p-4 md:p-8 mb-64 mt-14 flex justify-center flex-col gap-8 max-w-3xl mx-auto w-full">
					<div className="space-y-4">
						<h1>{t("auth.newsletter.successMessageTitle")}</h1>
						<p className="text-foreground">
							{t("auth.newsletter.successMessageDescription")}
						</p>
					</div>
					<div>
						<Button
							variant="primary"
							className="w-full"
							onClick={() => router.replace(toLocalePath("/map"))}
						>
							{t("auth.newsletter.successCta", {
								defaultValue: "Fertig",
							})}
						</Button>
					</div>
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center md:py-12 md:px-4 w-full">
					<NewsletterForm />
				</div>
			)}
		</Modal>
	);
}
