"use client";

import DownloadPDFButton from "@/components/Content/DownloadPDFButton";
import { OrderedList } from "@/components/Content/OrderedList";
import { VersionsList } from "@/components/Content/VersionsList";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import type { Element } from "hast";
import { Trans, useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Modal } from "../Modal";

export function AboutModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation("content");
	const toLocalePath = useLocalePath();
	const afterDivider = { current: false };
	return (
		<Modal
			title={t("aboutModal.title")}
			subtitle={
				<Trans
					i18nKey="aboutModal.simpleLanguageDirect"
					ns="content"
					components={{
						link: (
							<a
								href={toLocalePath("/simpleLanguage")}
								rel="noopener noreferrer"
								className="text-primary-dark hover:text-primary underline"
							>
								{t("here")}
							</a>
						),
					}}
				/>
			}
			subtitleClassName="-mt-5 mb-10 font-normal"
			routePath={routePath}
			hideLinksInModalFooter={["about"]}
		>
			<ReactMarkdown
				components={{
					hr: () => {
						afterDivider.current = true;
						return null;
					},
					h2: ({ children }) => (
						<p className="body2 font-bold mt-6 mb-1">{children}</p>
					),
					h3: ({ children }) => (
						<p className="body2 font-semibold mt-4 mb-1">{children}</p>
					),
					h4: ({ children }) => <p className="body2 -mt-2 mb-3">{children}</p>,
					p: ({ children }) => (
						<p
							className={`${afterDivider.current ? "body2" : "body1"} mb-3`}
						>
							{children}
						</p>
					),
					ul: ({ children }) => (
						<ul className="list-disc pl-5 space-y-2 body2 mb-3">{children}</ul>
					),
					ol: ({ node }) => <OrderedList node={node as Element} />,
					li: ({ children }) => <li>{children}</li>,
					strong: ({ children }) => (
						<strong className="font-bold">{children}</strong>
					),
					code: ({ children }) => {
						if (children === "versions-card") {
							return (
								<VersionsList
									label={t("aboutModal.versionsLabel")}
									items={
										t("aboutModal.versionsItems", {
											returnObjects: true,
										}) as { badge: string; label: string; text: string }[]
									}
								/>
							);
						}
						if (children === "documentation-card") {
							return (
								<div className="flex items-center gap-6 p-6 rounded-sm bg-neutral-5 my-10">
									<p className="body2 font-bold flex-1">
										{t("aboutModal.documentationText")}
									</p>
									<DownloadPDFButton title={t("aboutModal.downloadPDF")} />
								</div>
							);
						}
						return <code>{children}</code>;
					},
				}}
			>
				{t("aboutModal.body")}
			</ReactMarkdown>
		</Modal>
	);
}
