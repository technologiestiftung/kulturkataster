"use client";

import TextBlock from "@/components/Content/TextBlock";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";

export function ImprintModal({ routePath }: { routePath?: string }) {
	const { t: tContent } = useTranslation();
	const { t } = useTranslation();

	const content = (
		<div className="space-y-10">
			<div className="space-y-1">
				<TextBlock text={tContent("content.imprintModal.company.title")} />
				<TextBlock text={tContent("content.imprintModal.company.address")} />
				<TextBlock text={tContent("content.imprintModal.company.zip")} />
			</div>

			<div className="space-y-1">
				<TextBlock
					text={tContent("content.imprintModal.company.registration")}
				/>
				<TextBlock text={tContent("content.imprintModal.company.court")} />
				<TextBlock text={tContent("content.imprintModal.company.taxNumber")} />
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h2"
					title={tContent("content.imprintModal.representatives.title")}
					text={tContent("content.imprintModal.representatives.management")}
				/>

				<TextBlock
					titleAs="h2"
					title={tContent("content.imprintModal.chairman.title")}
					text={tContent("content.imprintModal.chairman.name")}
				/>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={tContent("content.imprintModal.contact.title")}
				/>

				<div className="body2 space-y-1">
					<div>{t("common.telephone.label")}</div>
					<div>{t("common.telephone.number")}</div>
					<div>
						<div>{t("common.email.label")}</div>
						<a
							href={`mailto:${t("common.email.address")}`}
							className="text-primary-dark hover:text-primary underline"
						>
							{t("common.email.address")}
						</a>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={tContent("content.imprintModal.editor.title")}
				/>
				<div className="body2 space-y-1">
					<div>{tContent("content.imprintModal.editor.name")}</div>
					<div>{tContent("content.imprintModal.editor.role")}</div>
					<div>{tContent("content.imprintModal.editor.address")}</div>
					<div>{tContent("content.imprintModal.editor.zipCity")}</div>
				</div>
			</div>

			<TextBlock
				className="m-0"
				title={tContent("content.imprintModal.conception.title")}
				link={{
					href: tContent("content.imprintModal.conception.link1.href"),
					text: tContent("content.imprintModal.conception.link1.text"),
					target: "_blank",
				}}
			/>

			<TextBlock
				link={{
					href: tContent("content.imprintModal.conception.link2.href"),
					text: tContent("content.imprintModal.conception.link2.text"),
					target: "_blank",
				}}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("content.imprintModal.design.title")}
				link={{
					href: tContent("content.imprintModal.design.link.href"),
					text: tContent("content.imprintModal.design.link.text"),
					target: "_blank",
				}}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("content.imprintModal.programming.title")}
				link={{
					href: tContent("content.imprintModal.programming.link.href"),
					text: tContent("content.imprintModal.programming.link.text"),
					target: "_blank",
				}}
			/>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={tContent("content.imprintModal.dispute_resolution.title")}
					text={tContent("content.imprintModal.dispute_resolution.description")}
					link={{
						href: tContent("content.imprintModal.dispute_resolution.link"),
						text: tContent("content.imprintModal.dispute_resolution.link"),
						target: "_blank",
					}}
				/>
			</div>

			<TextBlock
				titleAs="h1"
				title={tContent("content.imprintModal.content_liability.title")}
				text={tContent("content.imprintModal.content_liability.description")}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("content.imprintModal.link_liability.title")}
				text={tContent("content.imprintModal.link_liability.description")}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("content.imprintModal.copyright.title")}
				text={tContent("content.imprintModal.copyright.description")}
			/>
		</div>
	);

	return (
		<Modal
			title={tContent("content.imprintModal.title")}
			subtitle={tContent("content.imprintModal.subtitle")}
			routePath={routePath}
			hideLinksInModalFooter={["imprint"]}
		>
			{content}
		</Modal>
	);
}
