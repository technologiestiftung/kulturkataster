/* eslint-disable complexity */
"use client";

import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { DialogTitle } from "@/components/ui/dialog";

interface SimpleLanguageInformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface ListProps {
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
	value,
}: {
	keyValue: string;
	value: string | ListProps;
}) => {
	const originalInstitutions = useInstitutionStore(
		(state) => state.originalInstitutions,
	);
	const institutionCount = originalInstitutions?.features?.length ?? 2.382;
	return (
		<div className={!value ? "mb-8" : ""}>
			{keyValue === "title" && (
				<DialogTitle className="display text-center md:text-left my-10">
					{value as string}
				</DialogTitle>
			)}
			{keyValue.startsWith("text") && (
				<TextWithLinks
					text={value as string}
					textVariant={`body1 whitespace-pre-line ${keyValue.includes("Bold") ? "font-bold" : ""}`}
				/>
			)}
			{keyValue.startsWith("subTitle") && (
				<TextBlock titleAs="h2" title={value as string} className="my-8" />
			)}
			{keyValue.startsWith("list") && hasContent(value) && (
				<>
					{Object.entries(value).map(([innerKey, innerValue]) => (
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
						{value.content.map((line, i) => (
							<li key={i}>
								{line.replace(
									"{{count}}",
									institutionCount.toLocaleString("de-DE"),
								)}
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
};

export function SimpleLanguageInformationModal({
	open,
	onOpenChange,
}: SimpleLanguageInformationModalProps) {
	const { t } = useTranslation("content");

	const content = {
		about: t("simpleLanguageInformation.about", {
			returnObjects: true,
		}) as { [key: string]: string | ListProps },
		infosAndServices: t("simpleLanguageInformation.infosAndServices", {
			returnObjects: true,
		}) as { [key: string]: string | ListProps },
	};

	const { about, infosAndServices } = content;

	const simpleLanguageInformationContent = (
		<>
			{Object.entries(about).map(([key, value]) => (
				<RenderContent key={key} keyValue={key} value={value} />
			))}
			{Object.entries(infosAndServices).map(([key, value]) => (
				<RenderContent key={key} keyValue={key} value={value} />
			))}
		</>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={""}
			subtitle={""}
			content={simpleLanguageInformationContent}
		/>
	);
}
