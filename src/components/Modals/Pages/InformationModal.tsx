"use client";

import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { Trans, useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

export function InformationModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const institutionCount = institutions?.length;
	const accordionItems = t("content.infoModal.accordion", {
		returnObjects: true,
	}) as AccordionEntry[];

	return (
		<Modal
			title={t("content.infoModal.title")}
			subtitle={
				<Trans
					i18nKey="content.infoModal.simpleLanguageDirect"
					components={{
						link: (
							<a
								href={toLocalePath("/simpleLanguage#infosAndServices")}
								rel="noopener noreferrer"
								className="text-primary-dark hover:text-primary underline"
							>
								{t("common.here")}
							</a>
						),
					}}
				/>
			}
			subtitleClassName="-mt-5 mb-10 font-normal body2"
			routePath={routePath}
		>
			<ReactMarkdown
				components={{
					p: ({ children }) => <p className="mb-3">{children}</p>,
					strong: ({ children }) => (
						<strong className="font-bold">{children}</strong>
					),

					a: ({ href, children }) => (
						<a
							href={href}
							rel="noopener noreferrer"
							className="text-primary-dark hover:text-primary underline"
						>
							{children}
						</a>
					),
				}}
			>
				{t("content.infoModal.body")}
			</ReactMarkdown>
			<Tabs defaultValue="tab1" className="w-full mt-10">
				<TabsList variant="modalTabs">
					<TabsTrigger value="tab1">
						{t("content.infoModal.tabTitles.0")}
					</TabsTrigger>
					<TabsTrigger value="tab2">
						{t("content.infoModal.tabTitles.1")}
					</TabsTrigger>
					<TabsTrigger value="tab3">
						{t("content.infoModal.tabTitles.2")}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="tab1">
					<ReactMarkdown
						components={{
							p: ({ children }) => <p className="mt-8 mb-2">{children}</p>,
							strong: ({ children }) => (
								<strong className="font-bold">{children}</strong>
							),

							h2: ({ children }) => <h2 className="mb-3 mt-8">{children}</h2>,
							ul: ({ children }) => (
								<ul className="list-disc pl-5 space-y-2 body2 mb-3">
									{children}
								</ul>
							),

							li: ({ children }) => <li className="mb-0">{children}</li>,
						}}
					>
						{t("content.infoModal.tab1", {
							count: institutionCount ?? 0,
						})}
					</ReactMarkdown>
				</TabsContent>
				<TabsContent value="tab2">
					<ReactMarkdown
						components={{
							p: ({ children }) => <p className="mb-2">{children}</p>,
							h2: ({ children }) => <h2 className="mb-3 mt-8">{children}</h2>,
							code: ({ children }) => {
								const value = String(children);
								if (value.startsWith("image-text-card|")) {
									const [, src, align, title, rawDescription] =
										value.split("|");
									return (
										<div
											className={cn(
												"my-16 flex flex-col gap-6 md:flex-row",
												align === "right" && "md:flex-row-reverse",
											)}
										>
											<div className="md:w-1/2">
												<img src={src} alt={title} className="w-full" />
											</div>
											<div className="md:w-1/2">
												<h3 className="font-bold">{title}</h3>
												<p className="whitespace-pre-line">
													{rawDescription.replace(/\\n/g, "\n")}
												</p>
											</div>
										</div>
									);
								}
								return <code>{children}</code>;
							},
						}}
					>
						{t("content.infoModal.tab2")}
					</ReactMarkdown>
				</TabsContent>
				<TabsContent value="tab3">
					<ReactMarkdown
						components={{
							h2: ({ children }) => <h2 className="mb-6 mt-8">{children}</h2>,
							code: ({ children }) => {
								if (children === "accordion") {
									return (
										<Accordion type="single" className="w-full">
											{accordionItems.map((item, index) => (
												<AccordionItem
													key={item.question}
													value={`item-${index}`}
												>
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
									);
								}
								return <code>{children}</code>;
							},
						}}
					>
						{t("content.infoModal.tab3")}
					</ReactMarkdown>
					<div className="mt-16">
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
									<strong className="font-bold">{markdownChildren}</strong>
								),
							}}
						>
							{t("content.infoModal.contact")}
						</ReactMarkdown>
					</div>
				</TabsContent>
			</Tabs>
		</Modal>
	);
}
