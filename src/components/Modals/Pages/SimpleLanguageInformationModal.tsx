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

export function SimpleLanguageInformationModal({
	open,
	onOpenChange,
}: SimpleLanguageInformationModalProps) {
	const { t } = useTranslation("content");

	const originalInstitutions = useInstitutionStore(
		(state) => state.originalInstitutions,
	);

	const institutionCount = originalInstitutions?.features?.length ?? 2.382;

	const content = {
		about: t("simpleLanguageInformation.about", {
			returnObjects: true,
		}) as string[],
		infosAndServices: t("simpleLanguageInformation.infosAndServices", {
			returnObjects: true,
		}) as string[],
	};

	const RenderText = ({ text }: { text: string }) => {
		const findFirstListEntry = text.indexOf("\n-");

		const isVersionHeading = text.startsWith("##");

		if (isVersionHeading)
			return (
				<TextBlock
					titleAs="h2"
					title={text.replace("##", "")}
					className="underline"
				/>
			);

		if (findFirstListEntry >= 0) {
			const listHeading = text.slice(0, findFirstListEntry);
			const list = text.slice(findFirstListEntry, text.length);
			const lines = list
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => !!line);

			return (
				<div>
					<TextWithLinks
						text={listHeading}
						textVariant="body1 whitespace-pre-line"
					/>
					<ul className="list-disc pl-5 body1 space-y-1">
						{lines.map((line, i) => (
							<li key={i}>
								{line
									.replace(/^[-–•*]\s?/, "")
									.replace(
										"{{count}}",
										institutionCount.toLocaleString("de-DE"),
									)}
							</li>
						))}
					</ul>
				</div>
			);
		}

		const isBoldText = text.match(/^#([^#]+)#([\s\S]*)$/);
		if (!isBoldText)
			return (
				<TextWithLinks text={text} textVariant="body1 whitespace-pre-line" />
			);
		const [, bold, rest] = isBoldText;
		return (
			<div>
				<TextWithLinks
					text={bold}
					textVariant="body1 whitespace-pre-line font-bold"
				/>
				<TextWithLinks text={rest} textVariant="body1 whitespace-pre-line" />
			</div>
		);
	};

	const simpleLanguageInformationContent = (
		<div className="space-y-10">
			{Object.entries(content).map(([_, textArray]) => (
				<>
					{textArray.map((text, index) => {
						if (!index)
							return (
								<DialogTitle
									key={index}
									className="display text-center md:text-left"
								>
									{text}
								</DialogTitle>
							);

						return <RenderText key={index} text={text} />;
					})}
				</>
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
