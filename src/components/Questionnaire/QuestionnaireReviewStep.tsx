"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function QuestionnaireReviewStep({
	isLoggedIn,
	isSubmitting,
	isSubmitted,
	submitError,
	onSubmit,
	onBack,
}: {
	isLoggedIn: boolean;
	isSubmitting: boolean;
	isSubmitted: boolean;
	submitError: string | null;
	onSubmit: () => void;
	onBack: () => void;
}) {
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();

	if (isSubmitted) {
		return (
			<div className="space-y-4">
				<h1 className="font-bold">
					{t("content.questionnaireWizard.review.thanksTitle", {
						defaultValue: "Vielen Dank für Ihre Teilnahme!",
					})}
				</h1>
				<p className="body2">
					{t("content.questionnaireWizard.review.thanksDescription", {
						defaultValue: "Ihre Antworten wurden erfolgreich übermittelt.",
					})}
				</p>
				{!isLoggedIn && (
					<p className="body2">
						{t("content.questionnaireWizard.review.registerHint", {
							defaultValue:
								"Registrieren Sie sich jetzt, um Ihre Angaben zu speichern.",
						})}{" "}
						<Link
							href={toLocalePath("/register")}
							className="text-primary-dark underline"
						>
							{t("content.questionnaireWizard.review.registerCta", {
								defaultValue: "Jetzt registrieren",
							})}
						</Link>
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold">
					{t("content.questionnaireWizard.review.title", {
						defaultValue: "Angaben absenden",
					})}
				</h1>
				<p className="body2">
					{t("content.questionnaireWizard.review.description", {
						defaultValue:
							"Sie haben alle Fragen beantwortet. Mit Klick auf „Absenden“ übermitteln Sie Ihre Antworten.",
					})}
				</p>
			</div>

			{submitError && <p className="body2 text-destructive">{submitError}</p>}

			<div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end">
				<Button
					type="button"
					variant="outline"
					fullWidth
					onClick={onBack}
					disabled={isSubmitting}
				>
					{t("common.back", { defaultValue: "Zurück" })}
				</Button>
				<Button
					type="button"
					fullWidth
					disabled={isSubmitting}
					onClick={onSubmit}
				>
					{t("content.questionnaireWizard.review.submit", {
						defaultValue: "Absenden",
					})}
				</Button>
			</div>
		</div>
	);
}
