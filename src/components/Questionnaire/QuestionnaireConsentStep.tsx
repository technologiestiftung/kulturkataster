"use client";

import { Trans, useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

type AccordionEntry = {
	question: string;
	answer: string;
};

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
	const accordionItems = t("content.questionnaireWizard.consent.accordion", {
		returnObjects: true,
	}) as AccordionEntry[];

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

			<div className="body2 whitespace-pre-line">
				<Trans
					i18nKey="content.questionnaireWizard.consent.body"
					components={[
						<strong key="term" />,
						<strong key="quote" />,
						<strong key="duration" />,
						<strong key="voluntary" />,
					]}
					defaults={
						"Die Befragung ist Teil eines wissenschaftlichen Projekts zur Entwicklung eines Gefährdungsscores für Berliner Kultureinrichtungen. Ziel des Projekts ist es, unterschiedliche strukturelle, räumliche, finanzielle und organisationale Rahmenbedingungen systematisch zu erfassen, um Risiken, Belastungen und Unterstützungsbedarfe von Kultureinrichtungen in Berlin besser sichtbar machen zu können.\n\nUnter <0>Kultureinrichtungen</0> verstehen wir im Rahmen dieser Befragung <1>„dauerhaft oder wiederkehrend genutzte Orte und Organisationen kultureller Produktion, Präsentation, Vermittlung oder Begegnung“</1>, beispielsweise Theater, Musikspielstätten, Ateliers, Galerien, soziokulturelle Zentren, Literaturorte, Tanz- und Performanceorte oder vergleichbare Einrichtungen.\n\nDie Beantwortung des Fragebogens dauert voraussichtlich <2>etwa 15 bis 20 Minuten.</2>\n\nIhre Angaben werden vertraulich behandelt und ausschließlich für wissenschaftliche Zwecke im Rahmen des Projekts ausgewertet. Eine Veröffentlichung erfolgt nur in zusammengefasster Form, sodass keine Rückschlüsse auf einzelne Personen möglich sind. Sofern im weiteren Projektverlauf Ergebnisse auf Ebene einzelner Einrichtungen betrachtet werden, erfolgt dies ausschließlich im dafür vorgesehenen Projektrahmen und unter Beachtung der datenschutzrechtlichen Vorgaben.\n\nDer Fragebogen enthält Fragen zur Raum- und Standortsituation, zur finanziellen Lage, zu organisatorischen Rahmenbedingungen sowie zur öffentlichen Sichtbarkeit der Einrichtung. Bitte beantworten Sie den Fragebogen möglichst aus Sicht der Einrichtung insgesamt. Idealerweise wird er von einer Person ausgefüllt, die einen guten Überblick über die Raum-, Organisations- und Finanzsituation der Einrichtung hat.\n\n<3>Die Teilnahme an der Befragung ist freiwillig.</3> Mit dem Setzen des Häkchens bestätigen Sie, dass Sie die Informationen zur Befragung zur Kenntnis genommen haben und mit der Verarbeitung Ihrer Angaben zu wissenschaftlichen Zwecken im Rahmen dieses Projekts einverstanden sind.\n\nVielen Dank für Ihre Unterstützung."
					}
				/>
			</div>

			{accordionItems.length > 0 && (
				<Accordion type="single" className="w-full">
					{accordionItems.map((item, index) => (
						<AccordionItem key={item.question} value={`item-${index}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>
							<AccordionContent>
								<div className="pl-10">
									<ReactMarkdown
										components={{
											p: ({ children: markdownChildren }) => (
												<p>{markdownChildren}</p>
											),
											a: ({ href, children: markdownChildren }) => (
												<a
													href={href}
													rel="noopener noreferrer"
													className="text-primary-dark hover:text-primary underline"
												>
													{markdownChildren}
												</a>
											),
											strong: ({ children: markdownChildren }) => (
												<strong className="font-bold">
													{markdownChildren}
												</strong>
											),
											h3: ({ children: markdownChildren }) => (
												<p className="body2 font-semibold mt-4 mb-1">
													{markdownChildren}
												</p>
											),
										}}
									>
										{item.answer}
									</ReactMarkdown>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}

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
