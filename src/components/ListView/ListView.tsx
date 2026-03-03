"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { InstitutionCard } from "./InstitutionCard";
import InstitutionCardSkeleton from "./InstitutionCardSkeleton";
import { Institution } from "@/types";
import { ModalFooter } from "../Modals/ModalFooter";
import Download from "@/icons/download.svg";
import { ListTopbar } from "./ListTopbar";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loading } from "@/components/ui/loading";
import ArrowNarrowUp from "@/icons/arrow-narrow-up.svg";
import TextWithLinks from "../Content/TextWithLinks";
import { FilterModalWrapper } from "@/components/Filter/FilterModalWrapper";
import { FilterPanel } from "@/components/Filter/FilterPanel";

const ITEMS_PER_PAGE = 20;

const ListView: FC = () => {
	const { t } = useTranslation("common");
	const { t: tContent } = useTranslation("content");
	const institutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);
	const {
		setFilters,
		resetFilters,
		filters,
		categoryCounts,
		subcategoryCounts,
		categories,
		districts,
		initializeCategories,
		initializeDistricts,
	} = useInstitutionStore();
	const router = useRouter();
	const pathname = usePathname();
	const toLocalePath = useLocalePath();

	const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
	const [isLoading, setIsLoading] = useState(false);
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const lastFocusedInstitutionIdRef = useRef<string | null>(null);

	const institutionsList = useMemo(() => {
		if (!institutions) return [];
		const normalizedQuery = searchQuery.trim().toLowerCase();
		const filtered = normalizedQuery
			? institutions.filter((institution) => {
					const address = institution.address;
					const haystack = [
						institution.name,
						address?.street,
						address?.street_number,
						address?.zipcode,
						address?.city,
						address?.district,
						address?.neighbourhood,
					]
						.filter(Boolean)
						.join(" ")
						.toLowerCase();
					return haystack.includes(normalizedQuery);
				})
			: institutions;

		return [...filtered].sort((a, b) => {
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
	}, [institutions, searchQuery]);

	const visibleInstitutions = useMemo(() => {
		return institutionsList.slice(0, visibleCount);
	}, [institutionsList, visibleCount]);

	const selectedInstitutionId = useMemo(() => {
		const normalizedPath = pathname?.replace(/\/$/, "") ?? "";
		const match = normalizedPath.match(/\/list\/institution\/(\d+)$/);
		return match?.[1] ?? null;
	}, [pathname]);

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
			router.push(toLocalePath(`/list/institution/${institution.id}`));
		},
		[router, toLocalePath],
	);

	useEffect(() => {
		setVisibleCount(ITEMS_PER_PAGE);
	}, [searchQuery, institutions]);

	useEffect(() => {
		if (!selectedInstitutionId) return;
		const selectedIndex = institutionsList.findIndex(
			(institution) => String(institution.id) === selectedInstitutionId,
		);
		if (selectedIndex < 0) return;
		const requiredVisible = Math.ceil((selectedIndex + 1) / ITEMS_PER_PAGE);
		const requiredCount = requiredVisible * ITEMS_PER_PAGE;
		setVisibleCount((prev) =>
			prev >= requiredCount
				? prev
				: Math.min(requiredCount, institutionsList.length),
		);
	}, [selectedInstitutionId, institutionsList]);

	useEffect(() => {
		if (categories === null) {
			initializeCategories();
		}
		if (districts.length === 0) {
			initializeDistricts();
		}
	}, [categories, districts.length, initializeCategories, initializeDistricts]);

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

	useEffect(() => {
		if (!selectedInstitutionId) return;
		if (lastFocusedInstitutionIdRef.current === selectedInstitutionId) return;
		if (
			!visibleInstitutions.some(
				(institution) => String(institution.id) === selectedInstitutionId,
			)
		) {
			return;
		}

		const rafId = requestAnimationFrame(() => {
			const selectedCard = document.querySelector(
				`[data-institution-card-id="${selectedInstitutionId}"]`,
			) as HTMLElement | null;
			if (!selectedCard) return;
			selectedCard.focus({ preventScroll: true });
			selectedCard.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "nearest",
			});
			lastFocusedInstitutionIdRef.current = selectedInstitutionId;
		});

		return () => cancelAnimationFrame(rafId);
	}, [selectedInstitutionId, visibleInstitutions]);

	useEffect(() => {
		if (!selectedInstitutionId) {
			lastFocusedInstitutionIdRef.current = null;
		}
	}, [selectedInstitutionId]);

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

	const loadingFilters = categories === null || districts.length === 0;
	const handleFilterRetry = () => {
		initializeCategories();
		initializeDistricts();
	};

	return (
		<div className="ListView-root w-full h-full flex flex-col items-center bg-neutral-10">
			<div ref={containerRef} className="h-full overflow-auto max-w-5xl ">
				<div className="p-4 mt-20">
					<div className="space-y-6 flex flex-col">
						<div className="space-y-2">
							<h1>{tContent("listView.title")}</h1>
							<h2 className="font-bold">{tContent("listView.subtitle")}</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<span className="body1">{tContent("listView.description")}</span>
						</div>
						<ListTopbar
							query={searchQuery}
							onQueryChange={(value) => {
								const nextQuery = value ?? "";
								if (nextQuery.trim()) {
									resetFilters();
								}
								setSearchQuery(nextQuery);
							}}
							onOpenFilter={() => setIsFilterOpen(true)}
						/>

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
										isSelected={
											selectedInstitutionId === String(institution.id)
										}
										openDetails={
											selectedInstitutionId === String(institution.id)
										}
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
			<FilterModalWrapper
				open={isFilterOpen}
				onOpenChange={setIsFilterOpen}
				title={tContent("filter.title")}
			>
				<FilterPanel
					filters={filters}
					categoryGroups={categories ?? []}
					districts={districts}
					filteredCount={institutions?.length ?? 0}
					categoryCounts={categoryCounts}
					subcategoryCounts={subcategoryCounts}
					loading={loadingFilters}
					error={null}
					onRetry={handleFilterRetry}
					onFiltersChange={setFilters}
				/>
			</FilterModalWrapper>

			{/* Floating scroll-to-top button */}
			{showScrollToTop && (
				<div className="fixed block z-25 bottom-20 right-0 p-4 overflow-hidden">
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
