"use client";

import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";

export function PrivacyModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation(["content", "common"]);

	return (
		<Modal
			title={t("privacyModal.title", { ns: "content" })}
			subtitle={t("privacyModal.subtitle", { ns: "content" })}
			routePath={routePath}
			hideLinksInModalFooter={["privacy"]}
		>
			<ReactMarkdown
				components={{
					h1: ({ children }) => (
						<h1 className="text-2xl font-bold mt-6 mb-2">{children}</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-lg font-semibold mt-6 mb-2">{children}</h2>
					),
					p: ({ children }) => <p className="body1 mb-3">{children}</p>,
					ul: ({ children }) => (
						<ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
					),
					li: ({ children }) => <li className="body1">{children}</li>,
					strong: ({ children }) => (
						<strong className="font-semibold">{children}</strong>
					),
					em: ({ children }) => <em className="italic">{children}</em>,
					hr: () => <hr className="my-6 border-border" />,
				}}
			>
				{t("privacyModal.body", {
					ns: "content",
					date: "23.04.2026",
					operatorName: "Kulturraum Berlin gGmbH",
					operatorAddress: "[Anschrift einfügen]",
					operatorEmail: "[E-Mail einfügen]",
					operatorPhone: "[Telefon einfügen]",
					reportingContact: "[Meldeweg/Kontakt einfügen]",
					privacyLink: "https://dsgvo-info.cortina-consult.de/kulturkataster/",
					jurisdiction: "Berlin",
					objectionDays: "14",
				})}
			</ReactMarkdown>
		</Modal>
	);
}
