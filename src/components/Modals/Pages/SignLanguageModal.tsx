"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import TextBlock from "@/components/Content/TextBlock";
import TextWithLinks from "@/components/Content/TextWithLinks";
import { Loading } from "@/components/ui/loading";

interface SignLanguageVideoItem {
	title: string;
	src: string;
	sub?: string;
}

interface SignLanguageInformationItem {
	title: string;
	videos: SignLanguageVideoItem[];
}

export function VideoWithLoader({ src }: { src: string }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleLoaded = () => setIsLoaded(true);

		video.addEventListener("loadeddata", handleLoaded);

		return () => {
			video.removeEventListener("loadeddata", handleLoaded);
		};
	}, []);

	return (
		<div className="relative w-full aspect-video bg-muted">
			{!isLoaded && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Loading />
				</div>
			)}
			<video
				ref={videoRef}
				src={src}
				preload="auto"
				controls
				className={`w-full h-full object-cover transition-opacity duration-300 tab-ring ${
					isLoaded ? "opacity-100" : "opacity-0"
				}`}
			>
				<track kind="captions" label="Sign language video" default />
			</video>
		</div>
	);
}

export function SignLanguageModal({ routePath }: { routePath?: string }) {
	const { t } = useTranslation("content");

	const content = t("signLanguageModal.content", {
		returnObjects: true,
	}) as SignLanguageInformationItem[];

	const signLanguageInformationContent = (
		<>
			<div className="space-y-10">
				<p>{t("signLanguageModal.description")}</p>

				{content.map(
					(
						contentItem: SignLanguageInformationItem,
						contentItemIndex: number,
					) => (
						<div className="space-y-4" key={contentItemIndex}>
							<TextBlock titleAs="h2" title={contentItem.title} />
							{contentItem.videos.map(
								(
									contentItemVideo: SignLanguageVideoItem,
									contentItemVideoIndex: number,
								) => (
									<div className="space-y-2" key={contentItemVideoIndex}>
										<TextWithLinks
											text={contentItemVideo.title}
											textVariant="body1 font-bold"
										/>
										<VideoWithLoader src={contentItemVideo.src} />
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
					),
				)}
			</div>
		</>
	);

	return (
		<Modal
			title={t("signLanguageModal.title")}
			subtitle={t("signLanguageModal.subtitle")}
			routePath={routePath}
			content={signLanguageInformationContent}
			hideLinksInModalFooter={[
				"signLanguageInformation",
				"signLanguageInformationLong",
				"signLanguageInformationShort",
			]}
		/>
	);
}
