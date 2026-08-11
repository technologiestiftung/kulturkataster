"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function QuestionnaireConsentStep({
	consentGiven,
	onConsentChange,
	onNext,
}: {
	consentGiven: boolean;
	onConsentChange: (value: boolean) => void;
	onNext: () => void;
}) {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold">
					{t("content.questionnaireWizard.consent.title", {
						defaultValue:
							"Befragung zum Gefährdungsradar von Berliner Kulturorten",
					})}
				</h1>
				<p className="body2 font-bold">
					{t("content.questionnaireWizard.consent.thanks", {
						defaultValue:
							"Vielen Dank, dass Sie sich die Zeit nehmen, an dieser Befragung teilzunehmen.",
					})}
				</p>
			</div>

			<div className="body2 space-y-4">
				<p>
					{t("content.questionnaireWizard.consent.paragraph1", {
						defaultValue:
							"Die Befragung ist Teil eines wissenschaftlichen Projekts zur Entwicklung eines Gefährdungsscores für Berliner Kultureinrichtungen. Ziel des Projekts ist es, unterschiedliche strukturelle, räumliche, finanzielle und organisationale Rahmenbedingungen systematisch zu erfassen, um Risiken, Belastungen und Unterstützungsbedarfe von Kultureinrichtungen in Berlin besser sichtbar machen zu können.",
					})}
				</p>
				<p>
					{t("content.questionnaireWizard.consent.paragraph2Prefix", {
						defaultValue: "Unter ",
					})}
					<strong>
						{t("content.questionnaireWizard.consent.paragraph2Term", {
							defaultValue: "Kultureinrichtungen",
						})}
					</strong>
					{t("content.questionnaireWizard.consent.paragraph2Suffix", {
						defaultValue:
							" verstehen wir im Rahmen dieser Befragung „dauerhaft oder wiederkehrend genutzte Orte und Organisationen kultureller Produktion, Präsentation, Vermittlung oder Begegnung“, beispielsweise Theater, Musikspielstätten, Ateliers, Galerien, soziokulturelle Zentren, Literaturorte, Tanz- und Performanceorte oder vergleichbare Einrichtungen.",
					})}
				</p>
				<p>
					{t("content.questionnaireWizard.consent.paragraph3Prefix", {
						defaultValue:
							"Die Beantwortung des Fragebogens dauert voraussichtlich ",
					})}
					<strong>
						{t("content.questionnaireWizard.consent.paragraph3Bold", {
							defaultValue: "etwa 15 bis 20 Minuten.",
						})}
					</strong>
				</p>
				<p>
					{t("content.questionnaireWizard.consent.paragraph4", {
						defaultValue:
							"Ihre Angaben werden vertraulich behandelt und ausschließlich für wissenschaftliche Zwecke im Rahmen des Projekts ausgewertet. Eine Veröffentlichung erfolgt nur in zusammengefasster Form, sodass keine Rückschlüsse auf einzelne Personen möglich sind. Sofern im weiteren Projektverlauf Ergebnisse auf Ebene einzelner Einrichtungen betrachtet werden, erfolgt dies ausschließlich im dafür vorgesehenen Projektrahmen und unter Beachtung der datenschutzrechtlichen Vorgaben.",
					})}
				</p>
				<p>
					{t("content.questionnaireWizard.consent.paragraph5", {
						defaultValue:
							"Der Fragebogen enthält Fragen zur Raum- und Standortsituation, zur finanziellen Lage, zu organisatorischen Rahmenbedingungen sowie zur öffentlichen Sichtbarkeit der Einrichtung. Bitte beantworten Sie den Fragebogen möglichst aus Sicht der Einrichtung insgesamt. Idealerweise wird er von einer Person ausgefüllt, die einen guten Überblick über die Raum-, Organisations- und Finanzsituation der Einrichtung hat.",
					})}
				</p>
				<p>
					<strong>
						{t("content.questionnaireWizard.consent.paragraph6Bold", {
							defaultValue: "Die Teilnahme an der Befragung ist freiwillig.",
						})}
					</strong>{" "}
					{t("content.questionnaireWizard.consent.paragraph6Suffix", {
						defaultValue:
							"Mit dem Setzen des Häkchens bestätigen Sie, dass Sie die Informationen zur Befragung zur Kenntnis genommen haben und mit der Verarbeitung Ihrer Angaben zu wissenschaftlichen Zwecken im Rahmen dieses Projekts einverstanden sind.",
					})}
				</p>
				<p>
					{t("content.questionnaireWizard.consent.thankYouClosing", {
						defaultValue: "Vielen Dank für Ihre Unterstützung.",
					})}
				</p>
			</div>

			<div className="space-y-3">
				<p className="body2 font-bold">
					{t("content.questionnaireWizard.consent.checkboxHeading", {
						defaultValue: "Einverständniserklärung",
					})}
				</p>
				<div className="flex items-start space-x-2">
					<Checkbox
						id="questionnaire-consent"
						checked={consentGiven}
						onCheckedChange={(checked) => onConsentChange(checked === true)}
					/>
					<Label htmlFor="questionnaire-consent" emphasize={false}>
						{t("content.questionnaireWizard.consent.checkboxLabel", {
							defaultValue:
								"Ich habe die Informationen zur Befragung gelesen und erkläre mich mit der freiwilligen Teilnahme sowie der Verarbeitung meiner Angaben zu wissenschaftlichen Zwecken im Rahmen dieses Projekts einverstanden.",
						})}
					</Label>
				</div>
			</div>

			<Button type="button" fullWidth disabled={!consentGiven} onClick={onNext}>
				{t("content.questionnaireWizard.consent.cta", {
					defaultValue: "An der Befragung teilnehmen",
				})}
			</Button>
		</div>
	);
}
