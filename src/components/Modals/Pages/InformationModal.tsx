"use client";

import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { Trans, useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { useModalStore } from "@/lib/store/modalStore";

interface FaqItem {
	question: string;
	answer: string;
}

interface Faq {
	title: string;
	questions: FaqItem[];
}

interface UsageGuide {
	title: string;
	desktop?: string;
	mobile?: string;
	description?: string;
	action?: string;
	closedPlaces?: string;
	instructions?: string;
	submit?: string;
	review?: string;
}

interface Usage {
	title: string;
	introduction: string;
	guides: UsageGuide[];
}

interface Scope {
	title: string;
	features: string[];
	upcomingEnhancements: {
		title: string;
		items: string[];
	};
}

interface InformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InformationModal({
	open,
	onOpenChange,
}: InformationModalProps) {
	const { t } = useTranslation("content");
	const originalInstitutions = useInstitutionStore(
		(state) => state.allInstitutions,
	);

	const institutionCount = originalInstitutions?.features?.length ?? 2.382;

	const { handleFooterItemClick } = useModalStore();

	const introParagraphs = t("informationModal.introduction", {
		returnObjects: true,
	}) as string[];
	const scope = t("informationModal.scope", { returnObjects: true }) as Scope;
	const usage = t("informationModal.usage", { returnObjects: true }) as Usage;
	const faq = t("informationModal.faq", { returnObjects: true }) as Faq;

	const content = (
		<div className="space-y-10">
			<div className="space-y-4 pt-4 flex flex-col">
				<p>
					<Trans
						i18nKey="informationModal.simpleLanguageDirect"
						ns="content"
						components={{
							link: (
								<a
									href="#infosAndServices"
									rel="noopener noreferrer"
									className="text-primary-dark hover:text-primary underline"
									onClick={() =>
										handleFooterItemClick("simpleLanguageInformation")
									}
								>
									{t("here")}
								</a>
							),
						}}
					/>
				</p>
				{introParagraphs.map((text, index) => (
					<TextWithLinks key={index} text={text} />
				))}
			</div>

			<div className="space-y-4">
				<TextBlock titleAs="h1" title={scope.title} />
				<ul
					className="list-disc pl-5 body2 space-y-1"
					aria-label={t("informationModal.featuresListAriaLabel")}
				>
					{scope.features.map((item, i) => {
						if (i === 0) {
							const dynamicText = item.replace(
								"{{count}}",
								institutionCount.toLocaleString("de-DE"),
							);
							return <li key={i}>{dynamicText}</li>;
						}
						return <li key={i}>{item}</li>;
					})}
				</ul>
				<div className="pt-4">
					<p className="body1 font-bold pb-2">
						{scope.upcomingEnhancements.title}
					</p>
					<ul
						className="list-disc pl-5 body2 space-y-1"
						aria-label={t("informationModal.upcomingEnhancementsListAriaLabel")}
					>
						{scope.upcomingEnhancements.items.map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				</div>
			</div>

			<div className="space-y-6">
				<TextBlock
					titleAs="h1"
					titleClassName="mb-2"
					title={usage.title}
					text={usage.introduction}
				/>
				<div className="space-y-6">
					{usage.guides.map((guide) => (
						<div key={guide.title}>
							<p className="body1 font-bold pb-2">{guide.title}</p>
							<div className="body2 space-y-2">
								{guide.description && <p>{guide.description}</p>}
								{guide.desktop && <p>{guide.desktop}</p>}
								{guide.mobile && <p>{guide.mobile}</p>}
								{guide.action && <p>{guide.action}</p>}
								{guide.closedPlaces && <p>{guide.closedPlaces}</p>}
								{guide.instructions && <p>{guide.instructions}</p>}
								{guide.submit && <p>{guide.submit}</p>}
								{guide.review && <p>{guide.review}</p>}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-6">
				<TextBlock titleAs="h1" title={faq.title} />
				<div className="space-y-6">
					{faq.questions.map((item) => (
						<div key={item.question}>
							<p className="body1 font-bold">{item.question}</p>
							<TextWithLinks text={item.answer} />
						</div>
					))}
				</div>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("informationModal.title")}
			subtitle={t("informationModal.subtitle")}
			content={content}
		/>
	);
}
