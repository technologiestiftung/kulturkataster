"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";

export function QuestionnaireUnavailable({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation();
	const closeModal = useRoutedModalClose({});
	const title = t("content.questionnaireWizard.unavailable.title", {
		defaultValue: "Aktuell ist keine Befragung verfügbar",
	});

	return (
		<Modal
			title={title}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			onCloseRequest={closeModal}
		>
			<div className="mx-auto max-w-2xl space-y-4 px-4 py-20 text-center">
				<h1 className="font-bold">{title}</h1>
				<p className="body2">
					{t("content.questionnaireWizard.unavailable.description", {
						defaultValue:
							"Bitte schauen Sie später erneut vorbei oder folgen Sie einem gültigen Befragungslink.",
					})}
				</p>
			</div>
		</Modal>
	);
}
