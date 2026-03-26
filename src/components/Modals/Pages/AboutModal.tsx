"use client";

import DownloadPDFButton from "@/components/Content/DownloadPDFButton";
import TextBlock from "@/components/Content/TextBlock";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Trans, useTranslation } from "react-i18next";
import { Modal } from "../Modal";

interface Guidelines {
	description: string;
	items: string[];
}

interface Versions {
	description: string;
	planned: string;
	items: string[];
}

interface CreditSection {
	title: string;
	organization?: string;
	members?: string[];
	list?: string[];
}

interface Contractors {
	title: string;
	items: string[];
	editorial: {
		title: string;
		items: string[];
	};
	additional: string[];
}

interface Credits {
	funding: CreditSection;
	team: CreditSection;
	steering: CreditSection;
	partners: CreditSection;
	contractors: Contractors;
}

interface AboutContent {
	introduction: string[];
	guidelines: Guidelines;
	approach: string;
	concept: string;
	documentation: {
		text: string;
		downloadPDF: string;
	};
	versions: Versions;
	thanks: string;
	credits: Credits;
}

export function AboutModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation("content");
	const toLocalePath = useLocalePath();

	const content = t("aboutModal", { returnObjects: true }) as AboutContent;

	const CreditSectionComponent = ({ data }: { data: CreditSection }) => (
		<div className="mb-8">
			<p className="body1 font-bold">{data.title}</p>
			<div className="body2 space-y-1 mt-4">
				{data.organization && <p>{data.organization}</p>}
				{data.members?.map((item, i) => <p key={i}>{item}</p>)}
				{data.list?.map((item, i) => <p key={i}>{item}</p>)}
			</div>
		</div>
	);

	const modalContent = (
		<div className="space-y-8">
			<div className="space-y-4 pt-4">
				<p>
					<Trans
						i18nKey="aboutModal.simpleLanguageDirect"
						ns="content"
						components={{
							link: (
								<a
									href={toLocalePath("/simpleLanguage")}
									rel="noopener noreferrer"
									type="button"
									className="text-primary-dark hover:text-primary underline bg-transparent border-none p-0 cursor-pointer "
								>
									{t("here")}
								</a>
							),
						}}
					/>
				</p>
				{content.introduction.map((paragraph, i) => (
					<p key={i} className="body2">
						{paragraph}
					</p>
				))}
			</div>

			<TextBlock text={content.guidelines.description} />
			<ul
				className="list-disc pl-5 space-y-2 body2"
				aria-label={t("aboutModal.guidelinesListAriaLabel")}
			>
				{content.guidelines.items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>

			<TextBlock text={content.approach} />
			<TextBlock text={content.concept} />

			<div>
				<TextBlock text={content.documentation.text} />
				<DownloadPDFButton
					className="mt-8"
					title={content.documentation.downloadPDF}
				/>
			</div>

			<TextBlock text={content.versions.description} />
			<TextBlock text={content.versions.planned} />
			<ul
				className="list-disc pl-5 space-y-2 body2"
				aria-label={t("aboutModal.versionListAriaLabel")}
			>
				{content.versions.items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>

			<TextBlock text={content.thanks} />

			<div className="space-y-6 mt-8">
				<CreditSectionComponent data={content.credits.funding} />
				<CreditSectionComponent data={content.credits.team} />
				<CreditSectionComponent data={content.credits.steering} />
				<CreditSectionComponent data={content.credits.partners} />

				<div>
					<p className="body1 font-bold mt-8 mb-4">
						{content.credits.contractors.title}
					</p>
					<div className="body2 space-y-4">
						<div className="space-y-2">
							{content.credits.contractors.items.map((item, i) => (
								<p key={i}>{item}</p>
							))}
						</div>
						<div>
							<p className="font-bold mt-8 mb-4">
								{content.credits.contractors.editorial.title}
							</p>
							<div className="space-y-2">
								{content.credits.contractors.editorial.items.map((item, i) => (
									<p key={i}>{item}</p>
								))}
							</div>
						</div>
						<div className="space-y-2">
							{content.credits.contractors.additional.map((item, i) => (
								<p key={i}>{item}</p>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<Modal
			title={t("aboutModal.title")}
			subtitle={t("aboutModal.subtitle", {
				defaultValue: " ",
			})}
			routePath={routePath}
			hideLinksInModalFooter={["about"]}
		>
			{modalContent}
		</Modal>
	);
}
