"use client";

import TextBlock from "@/components/Content/TextBlock";
import { Trans, useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { useModalStore } from "@/lib/store/modalStore";

interface AccessibilityModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface Barrier {
	title: string;
	description: string;
	measures: string;
	timeline: string;
}

export function AccessibilityModal({
	open,
	onOpenChange,
}: AccessibilityModalProps) {
	const { t } = useTranslation("content");

	const { handleFooterItemClick } = useModalStore();

	const barriers = t("accessibilityModal.which.barriers", {
		returnObjects: true,
	}) as Barrier[];

	const content = (
		<div className="space-y-8">
			<TextBlock text={t("accessibilityModal.description")} />
			<TextBlock
				text={t("accessibilityModal.descriptionLink")}
				link={{
					href: t("accessibilityModal.link"),
					text: t("accessibilityModal.link"),
					target: "_blank",
				}}
			/>

			<div>
				<p>
					<Trans
						i18nKey="accessibilityModal.simpleLanguageDirect"
						ns="content"
						components={{
							link: (
								<button
									type="button"
									className="text-primary-dark hover:text-primary underline bg-transparent border-none p-0 cursor-pointer "
									onClick={() => {
										handleFooterItemClick("simpleLanguageInformation");
									}}
								>
									{t("here")}
								</button>
							),
						}}
					/>
				</p>
				<p>
					<Trans
						i18nKey="accessibilityModal.signLanguageDirect"
						ns="content"
						components={{
							link: (
								<button
									type="button"
									className="text-primary-dark hover:text-primary underline bg-transparent border-none p-0 cursor-pointer "
									onClick={() => {
										handleFooterItemClick("signLanguageInformation");
									}}
								>
									{t("here")}
								</button>
							),
						}}
					/>
				</p>
			</div>

			<TextBlock
				titleAs="h1"
				className="h1"
				title={t("accessibilityModal.when.title")}
				text={t("accessibilityModal.when.description")}
			/>

			<TextBlock
				titleAs="h1"
				className="h1"
				title={t("accessibilityModal.how.title")}
				text={t("accessibilityModal.how.description")}
			/>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					className="h1"
					title={t("accessibilityModal.which.title")}
					text={t("accessibilityModal.which.description")}
				/>

				<TextBlock
					titleAs="h2"
					className="h2"
					title={t("accessibilityModal.which.subheading")}
					text={t("accessibilityModal.which.list_intro")}
				/>

				<div className="space-y-6">
					{barriers.map((barrier) => (
						<div key={barrier.title}>
							<h2 className="h2 mb-2">{barrier.title}</h2>
							<div className="body2 space-y-2">
								<p className="body2">
									<strong>
										{t("accessibilityModal.which.descriptionLabel")}
									</strong>{" "}
									{barrier.description}
								</p>
								<p>
									<strong>{t("accessibilityModal.which.measuresLabel")}</strong>{" "}
									{barrier.measures}
								</p>
								<p>
									<strong>{t("accessibilityModal.which.timelineLabel")}</strong>{" "}
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
					title={t("accessibilityModal.contact.title")}
					text={t("accessibilityModal.contact.description")}
				/>
				<div className="body1 space-y-1">
					<p className="body2">
						<strong className="font-bold">
							{t("accessibilityModal.contact.name")}
						</strong>
					</p>
					<p className="body2">{t("accessibilityModal.contact.company")}</p>
					<p className="body2">
						{t("accessibilityModal.contact.telephone.label")}{" "}
						{t("accessibilityModal.contact.telephone.number")}
					</p>
					<p>
						<a
							href={`mailto:${t("accessibilityModal.contact.email.address")}`}
							className="body2 text-primary-dark hover:text-primary underline"
						>
							{t("accessibilityModal.contact.email.address")}
						</a>
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					className="h1"
					title={t("accessibilityModal.contact_officer.title")}
					text={t("accessibilityModal.contact_officer.description")}
				/>
				<div className="body1 space-y-2">
					<p className="body2">
						<a
							href={t("accessibilityModal.contact_officer.link1.url")}
							className="text-primary-dark hover:text-primary underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("accessibilityModal.contact_officer.link1.text")}
						</a>
					</p>
					<p className="body2">
						{t("accessibilityModal.contact_officer.info_text_link2")}{" "}
						<a
							href={t("accessibilityModal.contact_officer.link2.url")}
							className="text-primary-dark hover:text-primary underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("accessibilityModal.contact_officer.link2.text")}
						</a>
					</p>
				</div>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("accessibilityModal.title")}
			subtitle={t("accessibilityModal.subtitle")}
			content={content}
		/>
	);
}
