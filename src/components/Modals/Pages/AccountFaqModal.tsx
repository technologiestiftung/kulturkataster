"use client";

import ReactMarkdown from "react-markdown";
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

const questionDefaults = [
	{
		id: "question1",
		title: "Wie kann ich ein Benutzerkonto für den User-Bereich erstellen?",
	},
	{
		id: "question2",
		title:
			"Welche Voraussetzungen gelten für die Freischaltung (wer bekommt Zugang)?",
	},
	{
		id: "question3",
		title:
			"Wie funktioniert „Passwort vergessen“ und wie setze ich mein Passwort zurück?",
	},
	{
		id: "question4",
		title: "Wie kann ich meine Kontodaten (Name, E-Mail, Passwort) ändern?",
	},
	{
		id: "question5",
		title:
			"Wie kann ich meinen Account löschen lassen (und was passiert mit meinen Daten)?",
	},
	{
		id: "question6",
		title:
			"Wie kann ich eine Institution anlegen oder meinem Account zuordnen?",
	},
	{
		id: "question7",
		title:
			"Wie kann ich Nutzer*innen einer Institution hinzufügen, entfernen oder verwalten?",
	},
	{
		id: "question8",
		title:
			"Welche Rollen gibt es (z. B. Admin/Redaktion) und welche Berechtigungen haben sie?",
	},
	{
		id: "question9",
		title:
			"Wie lege ich Profile für Verweisungsmitarbeitende an und wie verwalte ich diese?",
	},
	{
		id: "question10",
		title:
			"Wie funktioniert der redaktionelle Workflow (z. B. Entwurf, Prüfung, Freigabe, Veröffentlichung) im User-Bereich?",
	},
	{
		id: "question11",
		title: "Ich habe immer noch eine Frage!",
	},
] as const;

const defaultAnswer =
	"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.";

function MarkdownContent({ value }: { value: string }) {
	return (
		<ReactMarkdown
			components={{
				p: ({ children }) => <p className="body2 mb-3">{children}</p>,
				ul: ({ children }) => (
					<ul className="body2 mb-3 list-disc space-y-1 pl-6">{children}</ul>
				),
				ol: ({ children }) => (
					<ol className="body2 mb-3 list-decimal space-y-1 pl-6">{children}</ol>
				),
				li: ({ children }) => <li>{children}</li>,
				strong: ({ children }) => (
					<strong className="font-semibold">{children}</strong>
				),
				em: ({ children }) => <em className="italic">{children}</em>,
				a: ({ href, children }) => (
					<a
						href={href}
						className="text-primary-dark underline underline-offset-2"
						target={href?.startsWith("http") ? "_blank" : undefined}
						rel={href?.startsWith("http") ? "noreferrer" : undefined}
					>
						{children}
					</a>
				),
			}}
		>
			{value}
		</ReactMarkdown>
	);
}

export function AccountFaqModal({ routePath, returnTo }: AccountFaqModalProps) {
	const { t } = useTranslation();

	return (
		<Modal
			title={t("common.auth.account.faqModal.title", {
				defaultValue: "FAQ",
			})}
			subtitle={t("common.auth.account.faqModal.subtitle", {
				defaultValue: "Häufig gestellte Fragen zum Konto-Bereich.",
			})}
			routePath={routePath}
			returnTo={returnTo}
		>
			<div className="space-y-10">
				<div className="flex flex-col space-y-4 pt-4">
					<div className="body1 mb-6">
						<MarkdownContent
							value={t("common.auth.account.faqModal.description", {
								defaultValue:
									"Diese FAQs beziehen sich ausschließlich auf den User-Bereich des Kulturkatasters, also auf Themen rund um Konto/Account, Rollen- und Rechteverwaltung (Administrationsrechte), das Verwalten von Institutionen sowie redaktionelle Workflows (z. B. Anlegen und Pflegen von Profilen). Allgemeine Fragen zum Auftrag und Nutzen des Kulturkatasters, zu den Umfängen der verschiedenen Versionen sowie zur methodischen Vorgehensweise finden Sie im Bereich „Infos & Services“ auf dem Kulturkataster. Die FAQs werden stetig erweitert; falls Ihre Frage hier noch nicht auftaucht, schreiben Sie der Redaktion gern per E-Mail an info@kulturkataster.berlin.",
							})}
						/>
					</div>
					<Accordion type="single" collapsible className="w-full">
						{questionDefaults.map((question) => (
							<AccordionItem key={question.id} value={question.id}>
								<AccordionTrigger>
									{t(`common.auth.account.faqModal.${question.id}.title`, {
										defaultValue: question.title,
									})}
								</AccordionTrigger>
								<AccordionContent>
									<MarkdownContent
										value={t(
											`common.auth.account.faqModal.${question.id}.answer`,
											{ defaultValue: defaultAnswer },
										)}
									/>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
					<div className="mt-6 flex flex-col space-y-4">
						<div>
							<h2 className="mt-8">
								{t("common.auth.account.faqModal.contactSupport.title", {
									defaultValue: "Kontakt zum Support",
								})}
							</h2>
							<div className="body1">
								<MarkdownContent
									value={t(
										"common.auth.account.faqModal.contactSupport.description",
										{
											defaultValue:
												"Wenn Sie weitere Fragen haben oder Unterstützung benötigen, kontaktieren Sie bitte unseren Support unter support@example.com.",
										},
									)}
								/>
							</div>
						</div>
						<div>
							<strong>
								{t("common.auth.account.faqModal.contactSupport.emailLabel", {
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
