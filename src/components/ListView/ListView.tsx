"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { InstitutionCard } from "./InstitutionCard";
import InstitutionCardSkeleton from "./InstitutionCardSkeleton";
import { Institution } from "@/types";
import { ModalFooter } from "../Modals/ModalFooter";
import Download from "@/icons/download.svg";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loading } from "@/components/ui/loading";
import ArrowNarrowUp from "@/icons/arrow-narrow-up.svg";
import TextWithLinks from "../Content/TextWithLinks";

const ITEMS_PER_PAGE = 20;

const ListView: FC = () => {
	const { t } = useTranslation("common");
	const { t: tContent } = useTranslation("content");
	const institutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);
	const router = useRouter();

	const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
	const [isLoading, setIsLoading] = useState(false);
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const institutionsList = useMemo(() => {
		if (!institutions) return [];
		return [...institutions].sort((a, b) => {
			const nameA = a?.name ?? "";
			const nameB = b?.name ?? "";
			const byName = nameA.localeCompare(nameB, "de", {
				sensitivity: "base",
			});
			if (byName !== 0) return byName;
			return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), "de", {
				numeric: true,
			});
		});
	}, [institutions]);

	const visibleInstitutions = useMemo(() => {
		return institutionsList.slice(0, visibleCount);
	}, [institutionsList, visibleCount]);

	const hasMore = visibleCount < institutionsList.length;

	const loadMore = useCallback(() => {
		if (isLoading || !hasMore) return;

		setIsLoading(true);
		setTimeout(() => {
			setVisibleCount((prev) =>
				Math.min(prev + ITEMS_PER_PAGE, institutionsList.length),
			);
			setIsLoading(false);
		}, 100);
	}, [isLoading, hasMore, institutionsList.length]);

	const handleInstitutionClick = useCallback(
		(institution: Institution) => {
			router.push(`/institution/${institution.id}`);
		},
		[router],
	);

	// Reset visible count when institutions change (e.g., filters applied)
	useEffect(() => {
		setVisibleCount(ITEMS_PER_PAGE);
	}, [institutions]);

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && hasMore && !isLoading) {
					loadMore();
				}
			},
			{
				rootMargin: "100px", // Start loading when sentinel is 100px away from viewport
				threshold: 0,
			},
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, isLoading, loadMore]);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop =
				window.pageYOffset || document.documentElement.scrollTop;
			setShowScrollToTop(scrollTop > 400);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (!institutions) {
		return (
			<div className="ListView-root w-full h-full flex items-center justify-center">
				<Loading size="lg" />
			</div>
		);
	}

	return (
		<div className="ListView-root w-full h-full flex flex-col items-center bg-neutral-10">
			<div ref={containerRef} className="h-full overflow-auto max-w-5xl ">
				<div className="p-4 mt-20">
					<div className="space-y-6 flex flex-col">
						<div className="space-y-2">
							<h1 className="display">{tContent("listView.title")}</h1>
							<h2 className="font-bold">{tContent("listView.subtitle")}</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<span className="body1">{tContent("listView.description")}</span>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								{
									<strong className="body2 ">
										{tContent("listView.countLabel", {
											count: institutionsList.length,
										})}
									</strong>
								}
								<button
									className="body2 text-primary-dark font-bold flex items-center gap-1 hover:text-primary/80 transition-colors cursor-pointer focus-visible:outline-interaction-dark"
									aria-label={t("download.title")}
								>
									<Download className="h-6 w-6" />
									{t("download.title")}
								</button>
							</div>
							{institutionsList.length === 0 && (
								<div className="text-center p-8 my-8 bg-neutral-10 rounded">
									<p className="body1 font-bold">
										<TextWithLinks
											text={t("listView.noResultsFound")}
										></TextWithLinks>
									</p>
									<p className="body2 mt-2">
										<TextWithLinks
											text={t("listView.tryAdjustingFilters")}
										></TextWithLinks>
									</p>
								</div>
							)}
							<div
								role="list"
								className="space-y-2"
								aria-label={t("listView.institutionsListLabel")}
							>
								{visibleInstitutions.map((institution) => (
									<InstitutionCard
										key={institution.id}
										institutionData={institution}
										onClick={handleInstitutionClick}
										isCompact={true}
									/>
								))}
							</div>

							{/* Loading indicator */}
							{isLoading && (
								<>
									{[...Array(3)].map((_, index) => (
										<InstitutionCardSkeleton key={index} />
									))}
								</>
							)}

							{/* Sentinel for intersection observer */}
							{hasMore && (
								<div
									ref={sentinelRef}
									className="h-4 flex justify-center items-center"
								>
									{!isLoading && (
										<div className="body1 font-bold">
											{tContent("listView.loadingMore")}
										</div>
									)}
								</div>
							)}

							{/* End indicator */}
							{!hasMore && institutionsList.length > ITEMS_PER_PAGE && (
								<div className="flex justify-center py-4">
									<div className="body1 font-bold">
										{tContent("listView.allLoaded", {
											count: institutionsList.length,
										})}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<ModalFooter />

			{/* Floating scroll-to-top button */}
			{showScrollToTop && (
				<div className="fixed block z-[50] bottom-20 right-0 p-4 overflow-hidden">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={scrollToTop}
								variant="rounded"
								size="icon-only"
								className="cursor-pointer"
								aria-label={t("listView.scrollToTop")}
							>
								<ArrowNarrowUp
									className="size-6"
									aria-hidden="true"
									focusable="false"
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{t("listView.scrollToTop")}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			)}
		</div>
	);
};

export default ListView;
