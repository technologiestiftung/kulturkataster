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
		"text2",
		"text5",
		"text9",
		"text13",
		"text16",
		"text19",
		"text23",
		"text26",
		"text32",
		"text35",
		"text39",
		"text42",
		"text45",
		"text48",
		"text53",
		"text57",
		"text60",
		"text63",
		"text69",
		"text77",
		"text84",
		"text86",
		"text89",
		"text92",
	],
	infosAndServices: [
		"text3",
		"text8",
		"text12",
		"text17",
		"text18",
		"text22",
		"text26",
		"text27",
		"text31",
		"text36",
		"text37",
		"text41",
		"text45",
		"text49",
		"text51",
		"text54",
		"text57",
		"text60",
		"text64",
		"text66",
		"text70",
		"text74",
		"text75",
		"text80",
		"text85",
		"text88",
		"text90",
		"text91",
		"text93",
		"text96",
		"text100",
		"text103",
		"text107",
		"text111",
		"text113",
		"text116",
		"text120",
		"text124",
		"text126",
		"text130",
		"text133",
		"text137",
		"text139",
		"text140",
		"text144",
		"text146",
		"text149",
		"text153",
		"text154",
		"text159",
		"text160",
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
	value,
	lineBreakAfterTextKeys,
}: {
	keyValue: string;
	value: string | ListProps;
	lineBreakAfterTextKeys: string[];
}) => {
	const originalInstitutions = useInstitutionStore(
		(state) => state.originalInstitutions,
	);
	const institutionCount = originalInstitutions?.features?.length ?? 2.382;
	return (
		<div className={lineBreakAfterTextKeys.includes(keyValue) ? "mb-8" : ""}>
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
				<div className="mt-8">
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
			{Object.entries(about).map(([key, value]) => (
				<RenderContent
					key={key}
					keyValue={key}
					value={value}
					lineBreakAfterTextKeys={lineBreaks.about}
				/>
			))}
			<DialogTitle className="display text-center md:text-left my-10">
				{infosAndServices.title as string}
			</DialogTitle>
			{Object.entries(infosAndServices).map(([key, value]) => (
				<RenderContent
					key={key}
					keyValue={key}
					value={value}
					lineBreakAfterTextKeys={lineBreaks.infosAndServices}
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
