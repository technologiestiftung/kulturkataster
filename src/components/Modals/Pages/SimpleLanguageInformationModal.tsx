"use client";

import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { DialogTitle } from "@/components/ui/dialog";
import keyOrder from "@/lib/utils/keyOrderSimpleLanguage.json";
import React from "react";
import { cn } from "@/lib/utils";

interface ListProps {
	title?: string;
	title1?: string;
	title2?: string;
	content: string[];
}

function hasContent(value: unknown): value is { content: string[] } {
	return (
		typeof value === "object" &&
		value !== null &&
		"content" in value &&
		Array.isArray((value as { content?: unknown }).content)
	);
}

const RenderContent = ({
	keyValue,
	type,
	t,
}: {
	keyValue: string;
	type: "about" | "infosAndServices";
	t: (key: string, options?: Record<string, unknown>) => string;
}) => {
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const institutionCount = institutions?.length ?? 0;
	const translation = t(
		`content.simpleLanguageInformation.${type}.${keyValue}`,
		{
			returnObjects: true,
		},
	);
	const sortByTitleKeys = (
		[aKey]: [string, unknown],
		[bKey]: [string, unknown],
	) => {
		const order: Record<string, number> = {
			titleBold: 0,
			title1: 1,
			title2: 2,
			title: 3,
		};

		const aOrder = order[aKey] ?? 999;
		const bOrder = order[bKey] ?? 999;

		return aOrder - bOrder;
	};
	return (
		<div>
			{keyValue.startsWith("text") && (
				<TextWithLinks
					text={translation}
					textVariant={`body1 whitespace-pre-line ${keyValue.includes("Bold") ? "font-bold" : ""}`}
				/>
			)}
			{keyValue.startsWith("subTitle") && (
				<TextBlock titleAs="h2" title={translation} className="my-8" />
			)}
			{keyValue.startsWith("list") && hasContent(translation) && (
				<div className="mt-8">
					{Object.entries(translation)
						.sort(sortByTitleKeys)
						.map(([innerKey, innerValue]) => (
							<div key={innerKey}>
								{innerKey.startsWith("title") && (
									<TextWithLinks
										text={innerValue as string}
										textVariant={`body1 whitespace-pre-line ${innerKey.includes("Bold") ? "font-bold" : ""}`}
									/>
								)}
							</div>
						))}
					<ul className="list-disc pl-5 body1 space-y-1 mt-1 mb-8">
						{translation.content.map((line, i) => (
							<li key={i}>
								{line.replace(
									"{{count}}",
									institutionCount.toLocaleString("de-DE"),
								)}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export function SimpleLanguageInformationModal({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation();

	const content = {
		about: t("content.simpleLanguageInformation.about", {
			returnObjects: true,
		}) as { [key: string]: string | ListProps },
		infosAndServices: t("content.simpleLanguageInformation.infosAndServices", {
			returnObjects: true,
		}) as { [key: string]: string | ListProps },
	};

	const { about, infosAndServices } = content;

	const simpleLanguageInformationContent = (
		<>
			{["about", "infosAndServices"].map((currentKey, index) => {
				const current = currentKey === "about" ? about : infosAndServices;
				const currentKeyOrder =
					currentKey === "about" ? keyOrder.about : keyOrder.infosAndServices;
				return (
					<React.Fragment key={index}>
						{currentKey === "infosAndServices" && <div id="infosAndServices" />}
						<DialogTitle
							className={cn(
								"text-center md:text-left",
								currentKey === "about" ? "mb-10" : "my-10",
							)}
						>
							{current.title as string}
						</DialogTitle>
						{currentKeyOrder.map((orderKey, currentKeyOrderIndex) => {
							if (orderKey === "break") {
								return (
									<React.Fragment key={`${currentKey}_${currentKeyOrderIndex}`}>
										<div className="h-8" />
									</React.Fragment>
								);
							}
							return (
								<RenderContent
									key={orderKey}
									keyValue={orderKey}
									type={currentKey as "about" | "infosAndServices"}
									t={t}
								/>
							);
						})}
					</React.Fragment>
				);
			})}
		</>
	);

	return (
		<Modal
			title={""}
			subtitle={""}
			routePath={routePath}
			hideLinksInModalFooter={["simpleLanguageInformation"]}
		>
			{simpleLanguageInformationContent}
		</Modal>
	);
}
