"use client";

import TextBlock from "@/components/Content/TextBlock";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface ImprintModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ImprintModal({ open, onOpenChange }: ImprintModalProps) {
	const { t } = useTranslation("content");

	const content = (
		<div className="space-y-8">
			{/* Company Information */}
			<div className="space-y-1">
				<TextBlock text={t("imprintModal.company.title")} />
				<TextBlock text={t("imprintModal.company.address")} />
				<TextBlock text={t("imprintModal.company.zip")} />
			</div>

			<div className="space-y-1">
				<TextBlock text={t("imprintModal.company.registration")} />
				<TextBlock text={t("imprintModal.company.court")} />
				<TextBlock text={t("imprintModal.company.taxNumber")} />
			</div>

			{/* Representatives */}
			<div className="space-y-4">
				<TextBlock
					titleAs="h2"
					title={t("imprintModal.representatives.title")}
					text={t("imprintModal.representatives.management")}
				/>

				<TextBlock
					titleAs="h2"
					title={t("imprintModal.chairman.title")}
					text={t("imprintModal.chairman.name")}
				/>
			</div>

			{/* Contact */}
			<div className="space-y-4">
				<TextBlock titleAs="h1" title={t("imprintModal.contact.title")} />
				<div className="body2 space-y-1">
					<p>{t("imprintModal.contact.phone")}</p>
					<p>{t("imprintModal.contact.fax")}</p>
					<p>
						E-Mail:{" "}
						<a
							href="mailto:kontakt@kulturraum.berlin"
							className="text-primary hover:text-primary-dark underline"
						>
							kontakt@kulturraum.berlin
						</a>
					</p>
				</div>
			</div>

			{/* Insurance Information */}
			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={t("imprintModal.insurance.title")}
					text={t("imprintModal.insurance.company")}
				/>
				<TextBlock text={t("imprintModal.insurance.scope")} />
			</div>

			{/* Editorial Responsibility */}
			<div className="space-y-4">
				<TextBlock titleAs="h1" title={t("imprintModal.editor.title")} />
				<div className="body2 space-y-1">
					<p className="font-bold">{t("imprintModal.editor.name")}</p>
					<p>{t("imprintModal.editor.role")}</p>
					<p>{t("imprintModal.editor.address")}</p>
				</div>
			</div>

			{/* Conception */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.conception.title")}
				text={t("imprintModal.conception.companies")}
			/>

			{/* Design */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.design.title")}
				text={t("imprintModal.design.company")}
			/>

			{/* Programming */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.programming.title")}
				text={t("imprintModal.programming.company")}
			/>

			{/* Dispute Resolution */}
			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={t("imprintModal.dispute_resolution.title")}
					text={t("imprintModal.dispute_resolution.description")}
					link={{
						href: t("imprintModal.dispute_resolution.link"),
						text: t("imprintModal.dispute_resolution.link"),
						target: "_blank",
					}}
				/>
			</div>

			{/* Content Liability */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.content_liability.title")}
				text={t("imprintModal.content_liability.description")}
			/>

			{/* Link Liability */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.link_liability.title")}
				text={t("imprintModal.link_liability.description")}
			/>

			{/* Copyright */}
			<TextBlock
				titleAs="h1"
				title={t("imprintModal.copyright.title")}
				text={t("imprintModal.copyright.description")}
			/>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("imprintModal.title")}
			subtitle={t("imprintModal.subtitle")}
			content={content}
		/>
	);
}
