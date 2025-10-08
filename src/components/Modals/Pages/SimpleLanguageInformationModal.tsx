"use client";

import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { DialogTitle } from "@/components/ui/dialog";

interface simpleLanguageInformationItem {
	type: string;
	title?: string;
	titles?: string[];
	content: string[];
}

interface SimpleLanguageInformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SimpleLanguageInformationModal({
	open,
	onOpenChange,
}: SimpleLanguageInformationModalProps) {
	const { t } = useTranslation("content");

	const originalInstitutions = useInstitutionStore(
		(state) => state.originalInstitutions,
	);

	const institutionCount = originalInstitutions?.features?.length ?? 2.382;

	const content = [
		{
			title: t("simpleLanguageInformation.about.title"),
			content: t("simpleLanguageInformation.about.content", {
				returnObjects: true,
			}) as simpleLanguageInformationItem[],
		},
		{
			title: t("simpleLanguageInformation.infosAndServices.title"),
			content: t("simpleLanguageInformation.infosAndServices.content", {
				returnObjects: true,
			}) as simpleLanguageInformationItem[],
		},
	];

	const RenderText = ({ title }: { title: string }) => {
		if (title.includes("<strong>")) {
			const boldText = title.replace("<strong>", "").replace("</strong>", "");
			return <TextWithLinks text={boldText} textVariant="body1 font-bold" />;
		}
		return <TextWithLinks text={title} textVariant="body1" />;
	};

	/* Neuer Push */

	const simpleLanguageInformationContent = (
		<div className="space-y-10">
			{content.map((contentItem, contentItemIndex) => (
				<div key={contentItemIndex} className="space-y-10">
					<div className="space-y-4">
						<DialogTitle className="display text-center md:text-left">
							{contentItem.title}
						</DialogTitle>
					</div>
					{contentItem.content.map((section, index) => (
						<div className="space-y-4" key={index}>
							<div>
								{section.titles ? (
									<>
										{section.titles.map((sectionTitle, sectionTitleIndex) => (
											<RenderText
												key={sectionTitleIndex}
												title={sectionTitle}
											/>
										))}
										<ul className="list-disc pl-5 body1 space-y-1">
											{section.content.map((item, i) => (
												<li key={i} className="whitespace-pre-line">
													{item.replace(
														"{{count}}",
														institutionCount.toLocaleString("de-DE"),
													)}
												</li>
											))}
										</ul>
									</>
								) : (
									<>
										{section.title && (
											<TextBlock
												titleAs="h2"
												title={section.title}
												className="underline"
											/>
										)}
										{section.content?.map(
											(sectionContent, sectionContentIndex) => (
												<RenderText
													key={sectionContentIndex}
													title={sectionContent}
												/>
											),
										)}
									</>
								)}
							</div>
						</div>
					))}
				</div>
			))}
		</div>
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
