"use client";

import TextBlock from "@/components/Content/TextBlock";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Trans, useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import Link from "next/link";

interface Barrier {
	title: string;
	description: string;
	measures: string;
	timeline: string;
}

export function AccessibilityModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();

	const barriers = t("content.accessibilityModal.which.barriers", {
		returnObjects: true,
	}) as Barrier[];

	const content = (
		<div className="space-y-8">
			<TextBlock text={t("content.accessibilityModal.description")} />
			<TextBlock
				text={t("content.accessibilityModal.descriptionLink")}
				link={{
					href: t("content.accessibilityModal.link"),
					text: t("content.accessibilityModal.link"),
					target: "_blank",
				}}
			/>

			<div>
				<p>
					<Trans
						i18nKey="content.accessibilityModal.simpleLanguageDirect"
						components={{
							link: (
								<Link
									href={toLocalePath("/simpleLanguage")}
									rel="noopener noreferrer"
									className="text-primary-dark hover:text-primary underline bg-transparent border-none p-0 "
								>
									{t("content.here")}
								</Link>
							),
						}}
					/>
				</p>
				<p>
					<Trans
						i18nKey="content.accessibilityModal.signLanguageDirect"
						components={{
							link: (
								<Link
									href={toLocalePath("/signLanguage")}
									rel="noopener noreferrer"
									className="text-primary-dark hover:text-primary underline bg-transparent border-none p-0 "
								>
									{t("content.here")}
								</Link>
							),
						}}
					/>
				</p>
			</div>

			<TextBlock
				titleAs="h1"
				className="h1"
				title={t("content.accessibilityModal.when.title")}
				text={t("content.accessibilityModal.when.description")}
			/>

			<TextBlock
				titleAs="h1"
				className="h1"
				title={t("content.accessibilityModal.how.title")}
				text={t("content.accessibilityModal.how.description")}
			/>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					className="h1"
					title={t("content.accessibilityModal.which.title")}
					text={t("content.accessibilityModal.which.description")}
				/>

				<TextBlock
					titleAs="h2"
					className="h2"
					title={t("content.accessibilityModal.which.subheading")}
					text={t("content.accessibilityModal.which.list_intro")}
				/>

				<div className="space-y-6">
					{barriers.map((barrier) => (
						<div key={barrier.title}>
							<h2 className="h2 mb-2">{barrier.title}</h2>
							<div className="body2 space-y-2">
								<p className="body2">
									<strong>
										{t("content.accessibilityModal.which.descriptionLabel")}:
									</strong>{" "}
									{barrier.description}
								</p>
								<p>
									<strong>
										{t("content.accessibilityModal.which.measuresLabel")}:
									</strong>{" "}
									{barrier.measures}
								</p>
								<p>
									<strong>
										{t("content.accessibilityModal.which.timelineLabel")}:
									</strong>{" "}
									{barrier.timeline}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					className="h1"
					title={t("content.accessibilityModal.contact.title")}
					text={t("content.accessibilityModal.contact.description")}
				/>

				<div className="body1 space-y-1">
					<p className="body2">
						<strong>{t("content.accessibilityModal.contact.name")}</strong>
					</p>
					<p className="body2">
						{t("content.accessibilityModal.contact.company")}
					</p>
					<p className="body2">
						{t("content.accessibilityModal.contact.telephone.label")}{" "}
						{t("content.accessibilityModal.contact.telephone.number")}
					</p>
					<p>
						<a
							href={`mailto:${t("content.accessibilityModal.contact.email.address")}`}
							className="body2 text-primary-dark hover:text-primary underline"
						>
							{t("content.accessibilityModal.contact.email.address")}
						</a>
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					className="h1"
					title={t("content.accessibilityModal.contact_officer.title")}
					text={t("content.accessibilityModal.contact_officer.description")}
				/>

				<div className="body1 space-y-2">
					<p className="body2">
						<a
							href={t("content.accessibilityModal.contact_officer.link1.url")}
							className="text-primary-dark hover:text-primary underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("content.accessibilityModal.contact_officer.link1.text")}
						</a>
					</p>
					<p className="body2">
						{t("content.accessibilityModal.contact_officer.info_text_link2")}{" "}
						<a
							href={t("content.accessibilityModal.contact_officer.link2.url")}
							className="text-primary-dark hover:text-primary underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("content.accessibilityModal.contact_officer.link2.text")}
						</a>
					</p>
				</div>
			</div>
		</div>
	);

	return (
		<Modal
			title={t("content.accessibilityModal.title")}
			subtitle={t("content.accessibilityModal.subtitle")}
			routePath={routePath}
			hideLinksInModalFooter={["accessibility"]}
		>
			{content}
		</Modal>
	);
}
