"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import ReactMarkdown from "react-markdown";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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
	const { t } = useTranslation();

	const content = t("content.signLanguageModal.content", {
		returnObjects: true,
	}) as SignLanguageInformationItem[];

	return (
		<Modal
			title={t("content.signLanguageModal.title")}
			subtitle={t("content.signLanguageModal.subtitle")}
			routePath={routePath}
			hideLinksInModalFooter={[
				"signLanguageInformation",
				"signLanguageInformationLong",
				"signLanguageInformationShort",
			]}
		>
			<p>{t("content.signLanguageModal.description")}</p>
			<Tabs defaultValue="tab1" className="w-full mt-10">
				<TabsList variant="modalTabs">
					{content.map((item, index) => (
						<TabsTrigger key={index} value={`tab${index + 1}`}>
							{item.title}
						</TabsTrigger>
					))}
				</TabsList>
				{content.map((item, index) => (
					<TabsContent key={index} value={`tab${index + 1}`}>
						<Accordion
							type="single"
							className="w-full mt-10"
							defaultValue="video0"
						>
							{item.videos.map((video, videoIndex) => (
								<AccordionItem key={videoIndex} value={`video${videoIndex}`}>
									<AccordionTrigger>{video.title}</AccordionTrigger>
									<AccordionContent>
										<VideoWithLoader src={video.src} />
										{video.sub && (
											<div className="mt-4">
												<ReactMarkdown
													components={{
														a: ({ href, children }) => (
															<a
																href={href}
																rel="noopener noreferrer"
																className="text-primary-dark hover:text-primary underline text-lg"
															>
																{children}
															</a>
														),
													}}
												>
													{video.sub}
												</ReactMarkdown>
											</div>
										)}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</TabsContent>
				))}
			</Tabs>
		</Modal>
	);
}
