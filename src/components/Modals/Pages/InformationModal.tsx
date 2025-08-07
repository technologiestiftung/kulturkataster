"use client";

import Facebook from "@/icons/facebook.svg";
import Instagram from "@/icons/instagram.svg";
import LinkedIn from "@/icons/linkedin.svg";
import { Trans, useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface InformationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InformationModal({
	open,
	onOpenChange,
}: InformationModalProps) {
	const { t } = useTranslation(["content", "common"]);

	const content = (
		<div className="space-y-8">
			{/* Introduction */}
			<div className="space-y-4">
				<p className="body1">
					{t("informationModal.introduction", { ns: "content" })}
				</p>
				<p className="body1">
					{t("informationModal.growing", { ns: "content" })}
				</p>
				<p className="body1">
					{t("informationModal.currentVersion", { ns: "content" })}
				</p>
			</div>

			{/* Scope of Version 1 */}
			<div className="space-y-4">
				<h2 className="h2">
					{t("informationModal.scope.title", { ns: "content" })}
				</h2>
				<ul className="list-disc list-inside space-y-2 body1 ml-4">
					{(
						t("informationModal.scope.features", {
							ns: "content",
							returnObjects: true,
						}) as string[]
					).map((feature: string, index: number) => (
						<li key={index}>{feature}</li>
					))}
				</ul>

				<div className="mt-6">
					<h3 className="h3 mb-2">
						{t("informationModal.scope.upcomingEnhancements.title", {
							ns: "content",
						})}
					</h3>
					<ul className="list-disc list-inside space-y-1 body1 ml-4">
						{(
							t("informationModal.scope.upcomingEnhancements.items", {
								ns: "content",
								returnObjects: true,
							}) as string[]
						).map((item: string, index: number) => (
							<li key={index}>{item}</li>
						))}
					</ul>
				</div>
			</div>

			{/* Usage Instructions */}
			<div className="space-y-6">
				<h2 className="h2">
					{t("informationModal.usage.title", { ns: "content" })}
				</h2>
				<p className="body1">
					{t("informationModal.usage.introduction", { ns: "content" })}
				</p>

				{/* Move Map */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.moveMap.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.moveMap.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.moveMap.mobile", { ns: "content" })}
					</p>
				</div>

				{/* Zoom */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.zoom.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.zoom.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.zoom.mobile", { ns: "content" })}
					</p>
				</div>

				{/* Search */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.search.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.search.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.search.mobile", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.search.action", { ns: "content" })}
					</p>
				</div>

				{/* Filter */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.filter.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.filter.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.filter.mobile", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.filter.description", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.filter.closedPlaces", { ns: "content" })}
					</p>
				</div>

				{/* Download */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.download.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.download.description", {
							ns: "content",
						})}
					</p>
					<p className="body2">
						{t("informationModal.usage.download.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.download.mobile", { ns: "content" })}
					</p>
				</div>

				{/* Add Place */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.addPlace.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.addPlace.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.addPlace.mobile", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.addPlace.instructions", {
							ns: "content",
						})}
					</p>
					<p className="body2">
						{t("informationModal.usage.addPlace.submit", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.addPlace.review", { ns: "content" })}
					</p>
				</div>

				{/* Font Size */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.fontSize.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.fontSize.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.fontSize.mobile", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.fontSize.action", { ns: "content" })}
					</p>
				</div>

				{/* Contrast */}
				<div className="space-y-2">
					<h3 className="h3">
						{t("informationModal.usage.contrast.title", { ns: "content" })}
					</h3>
					<p className="body2">
						{t("informationModal.usage.contrast.desktop", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.contrast.mobile", { ns: "content" })}
					</p>
					<p className="body2">
						{t("informationModal.usage.contrast.action", { ns: "content" })}
					</p>
				</div>
			</div>

			{/* FAQ */}
			<div className="space-y-6">
				<h2 className="h2">
					{t("informationModal.faq.title", { ns: "content" })}
				</h2>
				{(
					t("informationModal.faq.questions", {
						ns: "content",
						returnObjects: true,
					}) as Array<{ question: string; answer: string }>
				).map((faq, index: number) => (
					<div key={index} className="space-y-2">
						<h3 className="h3">{faq.question}</h3>
						<p className="body2">{faq.answer}</p>
					</div>
				))}
			</div>

			{/* Footer with social links */}
			<div className="mt-20 flex justify-between">
				<div>
					<Trans
						i18nKey="footer.openSource"
						ns="common"
						components={[
							<a
								href="https://github.com/technologiestiftung/kulturkataster-frontend/"
								target="_blank"
								key={"sourceLink"}
								rel="noopener noreferrer"
								className="underline font-bold text-primary-dark"
							/>,
						]}
					/>
				</div>
				<div className="flex space-x-4">
					<Facebook className="size-6 cursor-pointer" />
					<Instagram className="size-6 cursor-pointer" />
					<LinkedIn className="size-6 cursor-pointer" />
				</div>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("informationModal.title", { ns: "content" })}
			subtitle={t("informationModal.subtitle", { ns: "content" })}
			content={content}
		/>
	);
}
