"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface AccessibilityModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AccessibilityModal({
	open,
	onOpenChange,
}: AccessibilityModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Organization */}
			<div className="text-center">
				<h2 className="h2 font-bold">Kulturraum Berlin gGmbH</h2>
			</div>

			{/* Introduction */}
			<p className="body1">{t("accessibilityModal.description")}</p>

			<p className="body1">
				Diese Erklärung zur digitalen Barrierefreiheit gilt für den Webauftritt:
				https://kulturkataster.berlin
			</p>

			{/* Creation */}
			<div className="space-y-4">
				<h2 className="h2">{t("accessibilityModal.when.title")}</h2>
				<p className="body1">{t("accessibilityModal.when.description")}</p>
			</div>

			{/* Accessibility Status */}
			<div className="space-y-4">
				<h2 className="h2">{t("accessibilityModal.how.title")}</h2>
				<p className="body1">{t("accessibilityModal.how.description")}</p>
			</div>

			{/* Barriers */}
			<div className="space-y-6">
				<h2 className="h2">{t("accessibilityModal.which.title")}</h2>
				<p className="body1">{t("accessibilityModal.which.description")}</p>
				<p className="body1 font-bold">Unvereinbarkeit mit BITV 2.0</p>
				<p className="body1">Teilbereiche, die nicht barrierefrei sind:</p>

				{/* Wahrnehmbarkeit */}
				<div className="space-y-4">
					<h3 className="h3">
						{t("accessibilityModal.which.perceivability.title")}
					</h3>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.perceivability.alternative.title")}
						</h4>
						<p className="body2">
							{t(
								"accessibilityModal.which.perceivability.alternative.description",
							)}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.perceivability.contrast.title")}
						</h4>
						<p className="body2">
							{t(
								"accessibilityModal.which.perceivability.contrast.description",
							)}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.perceivability.adaptability.title")}
						</h4>
						<p className="body2">
							{t(
								"accessibilityModal.which.perceivability.adaptability.description",
							)}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.perceivability.language.title")}
						</h4>
						<p className="body2">
							{t(
								"accessibilityModal.which.perceivability.language.description",
							)}
						</p>
					</div>
				</div>

				{/* Bedienbarkeit */}
				<div className="space-y-4">
					<h3 className="h3">
						{t("accessibilityModal.which.operability.title")}
					</h3>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.operability.keyboard.title")}
						</h4>
						<p className="body2">
							{t("accessibilityModal.which.operability.keyboard.description")}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.operability.focus.title")}
						</h4>
						<p className="body2">
							{t("accessibilityModal.which.operability.focus.description")}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.operability.structure.title")}
						</h4>
						<p className="body2">
							{t("accessibilityModal.which.operability.structure.description")}
						</p>
					</div>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.operability.timed.title")}
						</h4>
						<p className="body2">
							{t("accessibilityModal.which.operability.timed.description")}
						</p>
					</div>
				</div>

				{/* Verständlichkeit */}
				<div className="space-y-4">
					<h3 className="h3">
						{t("accessibilityModal.which.understandability.title")}
					</h3>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.understandability.label.title")}
						</h4>
						<p className="body2">
							{t(
								"accessibilityModal.which.understandability.label.description",
							)}
						</p>
					</div>
				</div>

				{/* Robustheit */}
				<div className="space-y-4">
					<h3 className="h3">
						{t("accessibilityModal.which.robustness.title")}
					</h3>

					<div className="space-y-2">
						<h4 className="h4">
							{t("accessibilityModal.which.robustness.documents.title")}
						</h4>
						<p className="body2">
							{t("accessibilityModal.which.robustness.documents.description")}
						</p>
					</div>
				</div>

				{/* Schlussbemerkungen */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("accessibilityModal.which.closing_remarks.title")}
					</h3>
					<p className="body2">
						{t("accessibilityModal.which.closing_remarks.description")}
					</p>
				</div>
			</div>

			{/* Contact */}
			<div className="space-y-4">
				<h2 className="h2">{t("accessibilityModal.contact.title")}</h2>
				<p className="body1">{t("accessibilityModal.contact.description")}</p>
				<div className="space-y-2">
					<p className="body1 font-bold">
						{t("accessibilityModal.contact.name")}
					</p>
					<p className="body1">
						{t("accessibilityModal.contact.telephone.label")}:{" "}
						{t("accessibilityModal.contact.telephone.number")}
					</p>
					<p className="body1">
						{t("accessibilityModal.contact.email.label")}:{" "}
						{t("accessibilityModal.contact.email.address")}
					</p>
				</div>
			</div>

			{/* Contact Officer */}
			<div className="space-y-4">
				<h2 className="h2">{t("accessibilityModal.contact_officer.title")}</h2>
				<p className="body1">
					{t("accessibilityModal.contact_officer.description")}
				</p>
				<p className="body1">Bitte kontaktieren Sie immer zuerst uns!</p>
				<div className="space-y-2">
					<p className="body1">
						<a
							href={t("accessibilityModal.contact_officer.link2.url")}
							className="text-blue-600 hover:text-blue-800 underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("accessibilityModal.contact_officer.link2.text")}
						</a>
					</p>
					<p className="body1">
						Weitere Informationen zum Durchsetzungsverfahren und der
						Landesbeauftragten für digitale Barrierefreiheit finden sie{" "}
						<a
							href={t("accessibilityModal.contact_officer.link1.url")}
							className="text-blue-600 hover:text-blue-800 underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							hier
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
