"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import TextWithLinks from "@/components/Content/TextWithLinks";

export function QuestionnaireThankYou() {
	const { t } = useTranslation();

	return (
		<div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
			<div className="h-50 relative -my-4 -mt-[7.5rem] left-1/2 w-screen -translate-x-1/2 overflow-hidden mb-16">
				<Image
					src="/resources/thankyou.png"
					alt=""
					fill
					className="object-cover contrast:invert-90"
					priority
				/>
			</div>
			<div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-700">
				<h1 tabIndex={-1} className="font-extrabold outline-none">
					{t("content.questionnaireWizard.review.thanksTitle", {
						defaultValue: "Vielen Dank für Ihre Teilnahme!",
					})}
				</h1>
				<TextWithLinks
					text={t("content.questionnaireWizard.review.thanksDescription", {
						defaultValue:
							"Vielen Dank für Ihre Teilnahme! Bei Fragen bezüglich des Projekts oder dieser Erhebung wenden Sie sich gerne an: info@kulturkataster.berlin",
					})}
					textVariant="body2 mt-2"
				/>
			</div>
		</div>
	);
}
