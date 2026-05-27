"use client";

import { OrderedList } from "@/components/Content/OrderedList";
import type { Element } from "hast";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";

export function TermsModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation();
	const bodySections = t("content.termsModal.bodySections", {
		returnObjects: true,
	}) as string[];
	const bodyMarkdown = Array.isArray(bodySections)
		? bodySections.join("\n\n")
		: "";

	return (
		<Modal
			title={t("content.termsModal.title")}
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
			<ReactMarkdown
				components={{
					h1: ({ children }) => (
						<h1 className="text-2xl font-bold mt-6 mb-2">{children}</h1>
					),

					h2: ({ children }) => (
						<h2 className="text-lg font-semibold mt-6 mb-2">{children}</h2>
					),
					h3: ({ children }) => (
						<h3 className="body1 font-semibold mt-5 mb-2">{children}</h3>
					),
					h4: ({ children }) => (
						<h4 className="body1 font-semibold mt-4 mb-2">{children}</h4>
					),
					h5: ({ children }) => (
						<h5 className="body2 font-semibold mt-3 mb-2">{children}</h5>
					),

					p: ({ children }) => <p className="body1 mb-3">{children}</p>,
					ul: ({ children }) => (
						<ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
					),
					ol: ({ node }) => <OrderedList node={node as Element} />,

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
					hr: () => <hr className="my-6 border-border" />,
				}}
			>
				{bodyMarkdown}
			</ReactMarkdown>
		</Modal>
	);
}
