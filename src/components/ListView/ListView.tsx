"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { InstitutionProperties } from "@/types";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { InstitutionCard } from "./InstitutionCard";

const ITEMS_PER_PAGE = 20;

const ListView: FC = () => {
	const { t } = useTranslation("common");
	const { t: tContent } = useTranslation("content");
	const institutions = useInstitutionStore((state) => state.institutions);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);

	const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
	const [isLoading, setIsLoading] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const institutionsList = useMemo(() => {
		if (!institutions?.features) return [];
		return institutions.features.map(
			(feature) => feature.properties as InstitutionProperties,
		);
	}, [institutions]);

	const visibleInstitutions = useMemo(() => {
		return institutionsList.slice(0, visibleCount);
	}, [institutionsList, visibleCount]);

	const hasMore = visibleCount < institutionsList.length;

	const loadMore = useCallback(() => {
		if (isLoading || !hasMore) return;

		setIsLoading(true);
		// Simulate async loading with setTimeout to prevent blocking
		setTimeout(() => {
			setVisibleCount((prev) =>
				Math.min(prev + ITEMS_PER_PAGE, institutionsList.length),
			);
			setIsLoading(false);
		}, 100);
	}, [isLoading, hasMore, institutionsList.length]);

	const handleInstitutionClick = useCallback(
		(institution: InstitutionProperties) => {
			console.log("Selected Institution ID:", institution.id);
			setSelectedInstitutionId(institution.id as unknown as string);
		},
		[setSelectedInstitutionId],
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

	if (!institutions) {
		return (
			<div className="ListView-root w-full h-full flex items-center justify-center">
				<div className="animate-pulse space-y-4 w-full max-w-md">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
					<div className="h-3 bg-gray-200 rounded w-2/3"></div>
				</div>
			</div>
		);
	}

	if (institutionsList.length === 0) {
		return (
			<div className="ListView-root w-full h-full flex items-center justify-center bg-neutral-5">
				<div className="text-center p-8">
					<p className="text-muted-foreground text-lg">
						{t("institution.noInstitutionsFound")}
					</p>
					<p className="text-muted-foreground text-sm mt-2">
						{t("institution.tryAdjustingFilters")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="ListView-root w-full h-full justify-center flex bg-neutral-5">
			<div
				ref={containerRef}
				className="h-full overflow-aut max-w-5xl
"
			>
				<div className="p-4 mt-20">
					<div className="space-y-6 flex flex-col">
						<div className="space-y-2">
							<span className="display">{tContent("listView.title")}</span>
							<h1 className="font-bold">{tContent("listView.subtitle")}</h1>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<span className="body1">{tContent("listView.description")}</span>
						</div>

						<div className="space-y-2">
							{visibleCount < institutionsList.length && (
								<p className="body2 font-bold">
									{institutionsList.length} Kulturorte
								</p>
							)}
							{visibleInstitutions.map((institution) => (
								<InstitutionCard
									key={institution.id}
									institutionData={institution}
									onClick={handleInstitutionClick}
									isCompact={true}
								/>
							))}

							{/* Loading indicator */}
							{isLoading && (
								<div className="flex justify-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								</div>
							)}

							{/* Sentinel for intersection observer */}
							{hasMore && (
								<div
									ref={sentinelRef}
									className="h-4 flex justify-center items-center"
								>
									{!isLoading && (
										<div className="text-sm text-muted-foreground">
											Lade weitere Einrichtungen...
										</div>
									)}
								</div>
							)}

							{/* End indicator */}
							{!hasMore && institutionsList.length > ITEMS_PER_PAGE && (
								<div className="flex justify-center py-4">
									<div className="text-sm text-muted-foreground">
										Alle {institutionsList.length} Einrichtungen geladen
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ListView;
