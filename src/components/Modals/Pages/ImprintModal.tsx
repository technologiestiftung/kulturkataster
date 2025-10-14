"use client";

import TextBlock from "@/components/Content/TextBlock";
import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";

interface ImprintModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ImprintModal({ open, onOpenChange }: ImprintModalProps) {
	const { t: tContent } = useTranslation("content");
	const { t } = useTranslation("common");

	const content = (
		<div className="space-y-10">
			<div className="space-y-1">
				<TextBlock text={tContent("imprintModal.company.title")} />
				<TextBlock text={tContent("imprintModal.company.address")} />
				<TextBlock text={tContent("imprintModal.company.zip")} />
			</div>

			<div className="space-y-1">
				<TextBlock text={tContent("imprintModal.company.registration")} />
				<TextBlock text={tContent("imprintModal.company.court")} />
				<TextBlock text={tContent("imprintModal.company.taxNumber")} />
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h2"
					title={tContent("imprintModal.representatives.title")}
					text={tContent("imprintModal.representatives.management")}
				/>

				<TextBlock
					titleAs="h2"
					title={tContent("imprintModal.chairman.title")}
					text={tContent("imprintModal.chairman.name")}
				/>
			</div>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={tContent("imprintModal.contact.title")}
				/>
				<div className="body2 space-y-1">
					<p>{t("telephone.label")}</p>
					<p>{t("telephone.number")}</p>
					<p>
						<p>{t("email.label")}</p>
						<a
							href={`mailto:${t("email.address")}`}
							className="text-primary hover:text-primary-dark underline"
						>
							{t("email.address")}
						</a>
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<TextBlock titleAs="h1" title={tContent("imprintModal.editor.title")} />
				<div className="body2 space-y-1">
					<p>{tContent("imprintModal.editor.name")}</p>
					<p>{tContent("imprintModal.editor.role")}</p>
					<p>{tContent("imprintModal.editor.address")}</p>
					<p>{tContent("imprintModal.editor.zipCity")}</p>
				</div>
			</div>

			<TextBlock
				className="m-0"
				title={tContent("imprintModal.conception.title")}
				link={{
					href: tContent("imprintModal.conception.link1.href"),
					text: tContent("imprintModal.conception.link1.text"),
					target: "_blank",
				}}
			/>
			<TextBlock
				link={{
					href: tContent("imprintModal.conception.link2.href"),
					text: tContent("imprintModal.conception.link2.text"),
					target: "_blank",
				}}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("imprintModal.design.title")}
				link={{
					href: tContent("imprintModal.design.link.href"),
					text: tContent("imprintModal.design.link.text"),
					target: "_blank",
				}}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("imprintModal.programming.title")}
				link={{
					href: tContent("imprintModal.programming.link.href"),
					text: tContent("imprintModal.programming.link.text"),
					target: "_blank",
				}}
			/>

			<div className="space-y-4">
				<TextBlock
					titleAs="h1"
					title={tContent("imprintModal.dispute_resolution.title")}
					text={tContent("imprintModal.dispute_resolution.description")}
					link={{
						href: tContent("imprintModal.dispute_resolution.link"),
						text: tContent("imprintModal.dispute_resolution.link"),
						target: "_blank",
					}}
				/>
			</div>

			<TextBlock
				titleAs="h1"
				title={tContent("imprintModal.content_liability.title")}
				text={tContent("imprintModal.content_liability.description")}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("imprintModal.link_liability.title")}
				text={tContent("imprintModal.link_liability.description")}
			/>

			<TextBlock
				titleAs="h1"
				title={tContent("imprintModal.copyright.title")}
				text={tContent("imprintModal.copyright.description")}
			/>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={tContent("imprintModal.title")}
			subtitle={tContent("imprintModal.subtitle")}
			content={content}
		/>
	);
}
