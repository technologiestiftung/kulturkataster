"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

type AccountFaqModalProps = {
	routePath?: string;
	returnTo?: string;
};

export function AccountFaqModal({ routePath, returnTo }: AccountFaqModalProps) {
	const { t } = useTranslation("common");

	return (
		<Modal
			title={t("auth.account.faqModal.title", {
				defaultValue: "FAQ",
			})}
			subtitle={t("auth.account.faqModal.subtitle", {
				defaultValue: "Häufig gestellte Fragen zum Konto-Bereich.",
			})}
			routePath={routePath}
			returnTo={returnTo}
		>
			<div className="space-y-10">
				<div className="space-y-4 pt-4 flex flex-col">
					{" "}
					<p className="body1 mb-6">
						{t("auth.account.faqModal.description", {
							defaultValue:
								"Diese FAQs beziehen sich ausschließlich auf den User-Bereich des Kulturkatasters, also auf Themen rund um Konto/Account, Rollen- und Rechteverwaltung (Administrationsrechte), das Verwalten von Institutionen sowie redaktionelle Workflows (z. B. Anlegen und Pflegen von Profilen). Allgemeine Fragen zum Auftrag und Nutzen des Kulturkatasters, zu den Umfängen der verschiedenen Versionen sowie zur methodischen Vorgehensweise finden Sie im Bereich \u201EInfos & Services\u201C auf dem Kulturkataster. Die FAQs werden stetig erweitert; falls Ihre Frage hier noch nicht auftaucht, schreiben Sie der Redaktion gern per E-Mail an info@kulturkataster.berlin.",
						})}
					</p>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="question1">
							<AccordionTrigger>
								{t("auth.account.faqModal.question1.title", {
									defaultValue:
										"Wie kann ich ein Benutzerkonto für den User-Bereich erstellen?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question1.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam.",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question2">
							<AccordionTrigger>
								{t("auth.account.faqModal.question2.title", {
									defaultValue:
										"Welche Voraussetzungen gelten für die Freischaltung (wer bekommt Zugang)?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question2.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question3">
							<AccordionTrigger>
								{t("auth.account.faqModal.question3.title", {
									defaultValue:
										"Wie funktioniert \u201EPasswort vergessen\u201C und wie setze ich mein Passwort zurück?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question3.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question4">
							<AccordionTrigger>
								{t("auth.account.faqModal.question4.title", {
									defaultValue:
										"Wie kann ich meine Kontodaten (Name, E-Mail, Passwort) ändern?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question4.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question5">
							<AccordionTrigger>
								{t("auth.account.faqModal.question5.title", {
									defaultValue:
										"Wie kann ich meinen Account löschen lassen (und was passiert mit meinen Daten)?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question5.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question6">
							<AccordionTrigger>
								{t("auth.account.faqModal.question6.title", {
									defaultValue:
										"Wie kann ich eine Institution anlegen oder meinem Account zuordnen?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question6.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question7">
							<AccordionTrigger>
								{t("auth.account.faqModal.question7.title", {
									defaultValue:
										"Wie kann ich Nutzer*innen einer Institution hinzufügen, entfernen oder verwalten?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question7.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question8">
							<AccordionTrigger>
								{t("auth.account.faqModal.question8.title", {
									defaultValue:
										"Welche Rollen gibt es (z. B. Admin/Redaktion) und welche Berechtigungen haben sie?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question8.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question9">
							<AccordionTrigger>
								{t("auth.account.faqModal.question9.title", {
									defaultValue:
										"Wie lege ich Profile für Verweisungsmitarbeitende an und wie verwalte ich diese?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question9.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question10">
							<AccordionTrigger>
								{t("auth.account.faqModal.question10.title", {
									defaultValue:
										"Wie funktioniert der redaktionelle Workflow (z. B. Entwurf, Prüfung, Freigabe, Veröffentlichung) im User-Bereich?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question10.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question11">
							<AccordionTrigger>
								{t("auth.account.faqModal.question11.title", {
									defaultValue: "Ich habe immer noch eine Frage!",
								})}
							</AccordionTrigger>
							<AccordionContent>
								<p className="body2">
									{t("auth.account.faqModal.question11.answer", {
										defaultValue:
											"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam",
									})}
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<div className="flex flex-col space-y-4 mt-6">
						<div>
							<h2 className="mt-8 ">
								{t("auth.account.faqModal.contactSupport.title", {
									defaultValue: "Kontakt zum Support",
								})}
							</h2>
							<p className="body1">
								{t("auth.account.faqModal.contactSupport.description", {
									defaultValue:
										"Wenn Sie weitere Fragen haben oder Unterstützung benötigen, kontaktieren Sie bitte unseren Support unter support@example.com.",
								})}
							</p>
						</div>
						<div>
							<strong>
								{t("auth.account.faqModal.contactSupport.emailLabel", {
									defaultValue: "Generelle Anfrage:",
								})}
								:
							</strong>{" "}
							<a
								href="mailto:info@kulturkataster.berlin"
								className="text-primary-dark underline"
							>
								info@kulturkataster.berlin
							</a>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}
