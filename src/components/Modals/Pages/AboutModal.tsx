"use client";

import DownloadPDFButton from "@/components/Content/DownloadPDFButton";
import { OrderedList } from "@/components/Content/OrderedList";
import { VersionsList } from "@/components/Content/VersionsList";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import type { Element } from "hast";
import Image from "next/image";
import { Trans, useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Modal } from "../Modal";

export function AboutModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();
	const afterDivider = { current: false };
	const teamMembers = t("content.aboutModal.credits.team.members", {
		returnObjects: true,
	}) as string[];
	const steeringMembers = t("content.aboutModal.credits.steering.members", {
		returnObjects: true,
	}) as string[];
	const partnerItems = t("content.aboutModal.credits.partners.list", {
		returnObjects: true,
	}) as string[];
	const contractorItems = t("content.aboutModal.credits.contractors.items", {
		returnObjects: true,
	}) as string[];
	const contractorAdditionalItems = t(
		"content.aboutModal.credits.contractors.additional",
		{
			returnObjects: true,
		},
	) as string[];
	const externalEditorialItems = t(
		"content.aboutModal.credits.contractors.editorial.items",
		{
			returnObjects: true,
		},
	) as string[];
	const aboutBodySections = t("content.aboutModal.bodySections", {
		returnObjects: true,
	}) as string[];
	const renderMarkdownList = (items: string[]) => (
		<ul className="body2">
			{items.map((item, index) => (
				<li key={`${item}-${index}`}>
					<ReactMarkdown
						components={{
							p: ({ children }) => <>{children}</>,
							strong: ({ children }) => (
								<strong className="font-bold">{children}</strong>
							),
						}}
					>
						{item}
					</ReactMarkdown>
				</li>
			))}
		</ul>
	);

	return (
		<Modal
			title={t("content.aboutModal.title")}
			subtitle={
				<Trans
					i18nKey="content.aboutModal.simpleLanguageDirect"
					components={{
						link: (
							<a
								href={toLocalePath("/simpleLanguage")}
								rel="noopener noreferrer"
								className="text-primary-dark hover:text-primary underline"
							>
								{t("content.here")}
							</a>
						),
					}}
				/>
			}
			subtitleClassName="-mt-5 mb-10 font-normal"
			routePath={routePath}
			hideLinksInModalFooter={["about"]}
		>
			<div className="space-y-3">
				{aboutBodySections.map((section, index) => (
					<ReactMarkdown
						key={`${index}-${section.slice(0, 24)}`}
						components={{
							hr: () => {
								afterDivider.current = true;
								return null;
							},
							h2: ({ children }) => (
								<h2 className="font-bold mt-6 mb-10">{children}</h2>
							),

							h3: ({ children }) => (
								<p className="body2 font-semibold mt-4 mb-1">{children}</p>
							),

							h4: ({ children }) => (
								<p className="body2 -mt-2 mb-3">{children}</p>
							),

							p: ({ children }) => (
								<p
									className={`${afterDivider.current ? "body2" : "body1"} mb-3`}
								>
									{children}
								</p>
							),

							ul: ({ children }) => (
								<ul className="list-disc pl-5 space-y-2 body2 mb-3">
									{children}
								</ul>
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
											label={t("content.aboutModal.versionsLabel")}
											items={
												t("content.aboutModal.versionsItems", {
													returnObjects: true,
												}) as {
													badge: string;
													label: string;
													text: string;
												}[]
											}
										/>
									);
								}
								if (children === "documentation-card") {
									return (
										<div className="flex md:flex-row flex-col items-center gap-6 md:p-6 rounded-sm bg-neutral-5 my-10">
											<p className="body2 font-bold flex-1">
												{t("content.aboutModal.documentation.text")}
											</p>
											<DownloadPDFButton
												className="w-full md:w-auto"
												fullWidth={true}
												title={t(
													"content.aboutModal.documentation.downloadPDF",
												)}
											/>
										</div>
									);
								}
								return <code>{children}</code>;
							},
						}}
					>
						{section}
					</ReactMarkdown>
				))}
			</div>
			<div className="mt-10 space-y-8">
				<p className="body1">{t("content.aboutModal.thanks")}</p>

				<div className="space-y-0">
					<p className="body1 font-bold">
						{t("content.aboutModal.credits.funding.title")}
					</p>
					<p className="body2">
						{t("content.aboutModal.credits.funding.organization")}
					</p>
				</div>

				<div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
					<Image
						src="/resources/teamfoto-kulturkataster.jpg"
						alt={t("content.aboutModal.teamPhotoAlt", {
							defaultValue: "Projektteam des Berliner Kulturkatasters",
						})}
						fill
						sizes="(max-width: 768px) 100vw, 720px"
						className="object-cover"
					/>
				</div>

				<div className="space-y-3">
					<p className="body1 font-bold">
						{t("content.aboutModal.credits.team.title")}
					</p>
					{renderMarkdownList(teamMembers)}
				</div>

				<Accordion type="multiple" className="w-full">
					<AccordionItem value="steering">
						<AccordionTrigger>
							{t("content.aboutModal.credits.steering.title")}
						</AccordionTrigger>
						<AccordionContent>
							{renderMarkdownList(steeringMembers)}
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="partners">
						<AccordionTrigger>
							{t("content.aboutModal.credits.partners.title")}
						</AccordionTrigger>
						<AccordionContent>
							{renderMarkdownList(partnerItems)}
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="contractors">
						<AccordionTrigger>
							{t("content.aboutModal.credits.contractors.title")}
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-6">
								{renderMarkdownList(contractorItems)}
								{renderMarkdownList(contractorAdditionalItems)}
							</div>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="external-editorial">
						<AccordionTrigger>
							{t("content.aboutModal.credits.contractors.editorial.title")}
						</AccordionTrigger>
						<AccordionContent>
							{renderMarkdownList(externalEditorialItems)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</Modal>
	);
}
