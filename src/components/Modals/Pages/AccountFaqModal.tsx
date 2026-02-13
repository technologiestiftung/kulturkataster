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

export function AccountFaqModal({
	routePath,
	returnTo = "/account/activity",
}: AccountFaqModalProps) {
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
			content={
				<div>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="question1">
							<AccordionTrigger>
								{t("auth.account.faqModal.question1.title", {
									defaultValue: "Wie ändere ich meine E-Mail-Adresse?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								{t("auth.account.faqModal.question1.answer", {
									defaultValue:
										"Um Ihre E-Mail-Adresse zu ändern, gehen Sie zu Ihren Profileinstellungen und klicken Sie auf 'E-Mail-Adresse ändern'.",
								})}
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question2">
							<AccordionTrigger>
								{t("auth.account.faqModal.question2.title", {
									defaultValue: "Wie ändere ich mein Passwort?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								{t("auth.account.faqModal.question2.answer", {
									defaultValue:
										"Um Ihr Passwort zu ändern, gehen Sie zu Ihren Profileinstellungen und klicken Sie auf 'Passwort ändern'.",
								})}
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="question3">
							<AccordionTrigger>
								{t("auth.account.faqModal.question3.title", {
									defaultValue: "Wie lösche ich mein Konto?",
								})}
							</AccordionTrigger>
							<AccordionContent>
								{t("auth.account.faqModal.question3.answer", {
									defaultValue:
										"Um Ihr Konto zu löschen, gehen Sie zu Ihren Profileinstellungen und klicken Sie auf 'Konto löschen'. Bitte beachten Sie, dass dies dauerhaft ist.",
								})}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<div className="">
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
						<div>
							<strong>
								{t("auth.account.faqModal.contactSupport.emailLabel", {
									defaultValue: "Generelle Anfrage:",
								})}
							</strong>
							<a href="mailto:support@example.com">support@example.com</a>
							<br />
							<strong>
								{t("auth.account.faqModal.contactSupport.hoursLabel", {
									defaultValue: "Technischer Support:",
								})}
							</strong>{" "}
							{t("auth.account.faqModal.contactSupport.hours", {
								defaultValue: "Montag bis Freitag, 9:00 - 17:00 Uhr",
							})}
							<br />
							<strong>
								{t("auth.account.faqModal.contactSupport.phoneLabel", {
									defaultValue: "Telefon:",
								})}
							</strong>{" "}
							<a href="tel:+1234567890">+1 (234) 567-890</a>
						</div>
					</div>
				</div>
			}
		/>
	);
}
