"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";

const TERMS_IMAGE_DIMENSIONS: Record<
	string,
	{ width: number; height: number }
> = {
	"/resources/terms_1.png": { width: 863, height: 213 },
	"/resources/terms_2.png": { width: 1158, height: 824 },
	"/resources/terms_en_1.png": { width: 1600, height: 518 },
	"/resources/terms_en_2.png": { width: 1378, height: 836 },
};

const getSectionIndentClassName = (section: string) => {
	const firstHeading = section.match(/^#{2,5}\s+\d+(?:\.\d+)+/m)?.[0];
	if (!firstHeading) return "";
	const level = firstHeading.match(/^#+/)?.[0].length ?? 0;
	if (level >= 5) return "ml-8";
	if (level >= 4) return "ml-4";
	return "";
};

export function TermsModal({ routePath }: { routePath?: string }) {
	const { i18n, t } = useTranslation();
	const isEnglish = i18n.resolvedLanguage === "en" || i18n.language === "en";
	const bodySections = t("content.termsModal.bodySections", {
		returnObjects: true,
	}) as string[];
	const markdownSections = Array.isArray(bodySections) ? bodySections : [];

	return (
		<Modal
			title={t("content.termsModal.title")}
			beforeTitle={
				isEnglish ? (
					<div className="rounded-sm border border-border bg-neutral-5 p-4">
						<p className="body1 font-semibold">
							{t("content.termsModal.authoritativeNotice.title")}
						</p>
						<p className="body2 mt-2">
							{t("content.termsModal.authoritativeNotice.description")}
						</p>
					</div>
				) : null
			}
			subtitle={
				<>
					<span className="block">
						{t("content.termsModal.date", { date: "27.05.2026" })}
					</span>
				</>
			}
			routePath={routePath}
			hideLinksInModalFooter={["terms"]}
		>
			<div className="space-y-3">
				{markdownSections.map((section, index) => (
					<div
						key={`${index}-${section.slice(0, 24)}`}
						className={getSectionIndentClassName(section)}
					>
						<ReactMarkdown
							components={{
								h1: ({ children }) => (
									<h1 className="text-2xl font-bold mt-6 mb-2">{children}</h1>
								),

								h2: ({ children }) => (
									<h2 className="h2 font-semibold mt-6 mb-2">{children}</h2>
								),
								h3: ({ children }) => (
									<h3 className="body1 mt-5 mb-2">{children}</h3>
								),
								h4: ({ children }) => (
									<h4 className="body1 mt-4 mb-2">{children}</h4>
								),
								h5: ({ children }) => (
									<h5 className="body1 mt-3 mb-2">{children}</h5>
								),

								p: ({ children }) => <p className="body1 mb-3">{children}</p>,
								ul: ({ children }) => (
									<ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
								),
								ol: ({ children }) => (
									<ol className="list-decimal pl-6 mb-3 space-y-3">
										{children}
									</ol>
								),

								li: ({ children }) => <li className="body1">{children}</li>,
								strong: ({ children }) => (
									<strong className="font-semibold">{children}</strong>
								),

								em: ({ children }) => <em className="italic">{children}</em>,
								a: ({ href, children }) => (
									<a
										href={href}
										className="underline underline-offset-2"
										target={href?.startsWith("http") ? "_blank" : undefined}
										rel={href?.startsWith("http") ? "noreferrer" : undefined}
									>
										{children}
									</a>
								),
								img: ({ src, alt }) => {
									const source = String(src ?? "");
									const dimensions = TERMS_IMAGE_DIMENSIONS[source];
									if (!dimensions) return null;
									return (
										<Image
											src={source}
											alt={alt ?? ""}
											width={dimensions.width}
											height={dimensions.height}
											className="my-6 h-auto w-full rounded-sm border border-border"
											sizes="(max-width: 768px) 100vw, 768px"
										/>
									);
								},
								hr: () => <hr className="my-6 border-border" />,
							}}
						>
							{section}
						</ReactMarkdown>
					</div>
				))}
			</div>
		</Modal>
	);
}
