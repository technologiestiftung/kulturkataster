"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";

interface SignLanguageVideoItem {
	title: string;
	src: string;
	sub?: string;
}

interface SignLanguageInformationItem {
	title: string;
	videos: SignLanguageVideoItem[];
}

interface SignLanguageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SignLanguageModal({
	open,
	onOpenChange,
}: SignLanguageModalProps) {
	const { t } = useTranslation("content");

	const content = t("signLanguageModal.content", {
		returnObjects: true,
	}) as SignLanguageInformationItem[];

	const signLanguageInformationContent = (
		<>
			<div className="space-y-10">
				<p>{t("signLanguageModal.description")}</p>
				{content.map((contentItem, contentItemIndex) => (
					<div className="space-y-4" key={contentItemIndex}>
						<TextBlock titleAs="h2" title={contentItem.title} />
						{contentItem.videos.map(
							(contentItemVideo, contentItemVideoIndex) => (
								<div className="space-y-2" key={contentItemVideoIndex}>
									<TextWithLinks
										text={contentItemVideo.title}
										textVariant="body1 font-bold"
									/>
									<video controls>
										<source src={contentItemVideo.src} type="video/mp4" />
									</video>
									{contentItemVideo.sub && (
										<TextWithLinks
											text={contentItemVideo.sub}
											textVariant="body1"
										/>
									)}
								</div>
							),
						)}
					</div>
				))}
			</div>
		</>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("signLanguageModal.title")}
			subtitle={t("signLanguageModal.subtitle")}
			content={signLanguageInformationContent}
		/>
	);
}
