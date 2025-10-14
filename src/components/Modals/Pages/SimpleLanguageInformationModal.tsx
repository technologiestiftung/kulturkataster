/* eslint-disable complexity */
"use client";

import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { DialogTitle } from "@/components/ui/dialog";

const lineBreaks = {
	about: [
		2, 5, 9, 13, 16, 19, 23, 26, 32, 35, 39, 42, 45, 48, 53, 57, 60, 63, 69, 77,
		84, 86, 89, 92,
	],
	infosAndServices: [
		3, 8, 12, 17, 18, 22, 26, 27, 31, 36, 37, 41, 45, 49, 51, 54, 57, 60, 64,
		66, 70, 74, 75, 80, 85, 88, 90, 91, 93, 96, 100, 103, 107, 111, 113, 116,
		120, 124, 126, 130, 133, 137, 139, 140, 144, 146, 149, 153, 154, 159, 160,
	],
};

interface SimpleLanguageInformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

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
	lineBreakAfterTextKeys,
	type,
	t,
}: {
	keyValue: string;
	lineBreakAfterTextKeys: number[];
	type: "about" | "infosAndServices";
	t: (key: string, options?: Record<string, unknown>) => string;
}) => {
	const originalInstitutions = useInstitutionStore(
		(state) => state.originalInstitutions,
	);
	const institutionCount = originalInstitutions?.features?.length ?? 2.382;
	let lineBreak = false;
	if (keyValue.includes("text") && !keyValue.includes("Bold")) {
		const keyIndex = +keyValue.replace("text", "");
		lineBreak = lineBreakAfterTextKeys.includes(keyIndex);
	}
	const translation = t(`simpleLanguageInformation.${type}.${keyValue}`, {
		returnObjects: true,
	});
	return (
		<div className={lineBreak ? "mb-8" : ""}>
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
					{Object.entries(translation).map(([innerKey, innerValue]) => (
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
			<DialogTitle className="display text-center md:text-left mb-10">
				{about.title as string}
			</DialogTitle>
			{Object.entries(about).map(([key, _]) => (
				<RenderContent
					key={key}
					keyValue={key}
					lineBreakAfterTextKeys={lineBreaks.about}
					type="about"
					t={t}
				/>
			))}
			<DialogTitle className="display text-center md:text-left my-10">
				{infosAndServices.title as string}
			</DialogTitle>
			{Object.entries(infosAndServices).map(([key, _]) => (
				<RenderContent
					key={key}
					keyValue={key}
					lineBreakAfterTextKeys={lineBreaks.infosAndServices}
					type="infosAndServices"
					t={t}
				/>
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
