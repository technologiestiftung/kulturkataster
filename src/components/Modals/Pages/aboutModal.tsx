"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface AboutModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Introduction */}
			<p className="body1">{t("aboutModal.introduction", { ns: "content" })}</p>

			{/* History */}
			<p className="body1">{t("aboutModal.history", { ns: "content" })}</p>

			{/* Guidelines */}
			<div className="space-y-4">
				<h3 className="h3">
					{t("aboutModal.guidelines.title", { ns: "content" })}
				</h3>
				<p className="body1">
					{t("aboutModal.guidelines.description", { ns: "content" })}
				</p>
				<ul className="list-disc list-inside space-y-2 body1 ml-4">
					{(
						t("aboutModal.guidelines.items", {
							ns: "content",
							returnObjects: true,
						}) as string[]
					).map((item: string, index: number) => (
						<li key={index}>{item}</li>
					))}
				</ul>
			</div>

			{/* Approach */}
			<p className="body1">{t("aboutModal.approach", { ns: "content" })}</p>

			{/* Concept */}
			<p className="body1">{t("aboutModal.concept", { ns: "content" })}</p>

			{/* Documentation */}
			<div className="space-y-4">
				<p className="body1">
					{t("aboutModal.documentation", { ns: "content" })}
				</p>
				<button className="btn-primary">
					{t("aboutModal.downloadPDF", { ns: "content" })}
				</button>
			</div>

			{/* Versions */}
			<div className="space-y-4">
				<h3 className="h3">
					{t("aboutModal.versions.title", { ns: "content" })}
				</h3>
				<p className="body1">
					{t("aboutModal.versions.description", { ns: "content" })}
				</p>
				<p className="body1">
					{t("aboutModal.versions.planned", { ns: "content" })}
				</p>
				<ul className="list-disc list-inside space-y-2 body1 ml-4">
					{(
						t("aboutModal.versions.items", {
							ns: "content",
							returnObjects: true,
						}) as string[]
					).map((item: string, index: number) => (
						<li key={index}>{item}</li>
					))}
				</ul>
			</div>

			{/* Thanks */}
			<p className="body1">{t("aboutModal.thanks", { ns: "content" })}</p>

			{/* Credits */}
			<div className="space-y-6">
				{/* Funding */}
				<div>
					<h4 className="h4 font-bold">
						{t("aboutModal.credits.funding.title", { ns: "content" })}
					</h4>
					<p className="body1">
						{t("aboutModal.credits.funding.organization", { ns: "content" })}
					</p>
				</div>

				{/* Team */}
				<div>
					<h4 className="h4 font-bold">
						{t("aboutModal.credits.team.title", { ns: "content" })}
					</h4>
					<ul className="space-y-1 body1">
						{(
							t("aboutModal.credits.team.members", {
								ns: "content",
								returnObjects: true,
							}) as string[]
						).map((member: string, index: number) => (
							<li key={index}>{member}</li>
						))}
					</ul>
				</div>

				{/* Steering Committee */}
				<div>
					<h4 className="h4 font-bold">
						{t("aboutModal.credits.steering.title", { ns: "content" })}
					</h4>
					<ul className="space-y-1 body1">
						{(
							t("aboutModal.credits.steering.members", {
								ns: "content",
								returnObjects: true,
							}) as string[]
						).map((member: string, index: number) => (
							<li key={index}>{member}</li>
						))}
					</ul>
				</div>

				{/* Partners */}
				<div>
					<h4 className="h4 font-bold">
						{t("aboutModal.credits.partners.title", { ns: "content" })}
					</h4>
					<ul className="space-y-1 body1">
						{(
							t("aboutModal.credits.partners.list", {
								ns: "content",
								returnObjects: true,
							}) as string[]
						).map((partner: string, index: number) => (
							<li key={index}>{partner}</li>
						))}
					</ul>
				</div>

				{/* Contractors */}
				<div>
					<h4 className="h4 font-bold">
						{t("aboutModal.credits.contractors.title", { ns: "content" })}
					</h4>
					<div className="space-y-2 body1">
						<p>
							{t("aboutModal.credits.contractors.technical", { ns: "content" })}
						</p>
						<p>
							{t("aboutModal.credits.contractors.management", {
								ns: "content",
							})}
						</p>
						<p>
							{t("aboutModal.credits.contractors.concept", { ns: "content" })}
						</p>
						<p>
							{t("aboutModal.credits.contractors.design", { ns: "content" })}
						</p>

						<div>
							<p className="font-semibold">
								{t("aboutModal.credits.contractors.editorial.title", {
									ns: "content",
								})}
							</p>
							<ul className="list-disc list-inside ml-4 space-y-1">
								{(
									t("aboutModal.credits.contractors.editorial.items", {
										ns: "content",
										returnObjects: true,
									}) as string[]
								).map((item: string, index: number) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>

						<p>
							{t("aboutModal.credits.contractors.collaboration", {
								ns: "content",
							})}
						</p>
						<p>
							{t("aboutModal.credits.contractors.accessibility", {
								ns: "content",
							})}
						</p>
						<p>
							{t("aboutModal.credits.contractors.privacy", { ns: "content" })}
						</p>
						<p>
							{t("aboutModal.credits.contractors.legal", { ns: "content" })}
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("aboutModal.title", { ns: "content" })}
			subtitle={t("aboutModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
