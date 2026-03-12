"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import {
	FC,
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { InstitutionCard } from "./InstitutionCard";
import { AlphabetFilter } from "./AlphabetFilter";
import { Institution } from "@/types";
import { ModalFooter } from "../Modals/ModalFooter";
import { ListTopbar } from "./ListTopbar";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import ArrowNarrowUp from "@/icons/arrow-narrow-up.svg";
import TextWithLinks from "../Content/TextWithLinks";
import { FilterModalWrapper } from "@/components/Filter/FilterModalWrapper";
import { FilterPanel } from "@/components/Filter/FilterPanel";
import { ListViewSkeleton } from "./ListViewSkeleton";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

const LIST_ITEM_ESTIMATE_SIZE = 320;
const LIST_OVERSCAN = 8;
const LIST_SCROLL_STORAGE_KEY = "listView.scrollTop";

const readStoredListScrollOffset = (): number => {
	if (typeof window === "undefined") return 0;
	const raw = window.sessionStorage.getItem(LIST_SCROLL_STORAGE_KEY);
	if (!raw) return 0;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const writeStoredListScrollOffset = (offset: number) => {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(
		LIST_SCROLL_STORAGE_KEY,
		String(Math.max(0, Math.floor(offset))),
	);
};

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

	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [activeLetter, setActiveLetter] = useState<string | null>(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [listScrollMargin, setListScrollMargin] = useState(0);
	const lastSyncedSelectionRef = useRef<string | null>(null);
	const pendingTopScrollAfterDeselectRef = useRef(false);
	const previousSearchActiveRef = useRef(false);
	const listScrollOffsetRef = useRef(readStoredListScrollOffset());
	const hasRestoredListScrollRef = useRef(false);
	const rowElementMapRef = useRef(new Map<string, HTMLDivElement>());
	const listContainerRef = useRef<HTMLDivElement | null>(null);

	const sortedInstitutions = useMemo(() => {
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

	const searchableInstitutions = useMemo(
		() =>
			sortedInstitutions.map((institution) => {
				const address = institution.address;
				const searchableText = [
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
				return { institution, searchableText };
			}),
		[sortedInstitutions],
	);

	const normalizedDeferredQuery = useMemo(
		() => deferredSearchQuery.trim().toLowerCase(),
		[deferredSearchQuery],
	);

	const searchFilteredInstitutions = useMemo(() => {
		if (!normalizedDeferredQuery) {
			return sortedInstitutions;
		}
		return searchableInstitutions
			.filter((entry) => entry.searchableText.includes(normalizedDeferredQuery))
			.map((entry) => entry.institution);
	}, [normalizedDeferredQuery, searchableInstitutions, sortedInstitutions]);

	const enabledLetters = useMemo(() => {
		const letters = new Set<string>();
		searchFilteredInstitutions.forEach((institution) => {
			const firstCharacter = institution.name?.trim().charAt(0).toUpperCase();
			if (firstCharacter && firstCharacter >= "A" && firstCharacter <= "Z") {
				letters.add(firstCharacter);
			}
		});
		return letters;
	}, [searchFilteredInstitutions]);

	const institutionsList = useMemo(() => {
		const byLetter = activeLetter
			? searchFilteredInstitutions.filter(
					(institution) =>
						institution.name?.trim().charAt(0).toUpperCase() === activeLetter,
				)
			: searchFilteredInstitutions;
		return byLetter;
	}, [searchFilteredInstitutions, activeLetter]);

	const selectedInstitutionId = useMemo(() => {
		const normalizedPath = pathname?.replace(/\/$/, "") ?? "";
		const match = normalizedPath.match(/\/list\/institution\/(\d+)(?:\/.*)?$/);
		return match?.[1] ?? null;
	}, [pathname]);

	const rowVirtualizer = useWindowVirtualizer({
		count: institutionsList.length,
		estimateSize: () => LIST_ITEM_ESTIMATE_SIZE,
		overscan: LIST_OVERSCAN,
		getItemKey: (index) => institutionsList[index]?.id ?? index,
		scrollMargin: listScrollMargin,
	});
	const rowVirtualizerRef = useRef(rowVirtualizer);
	rowVirtualizerRef.current = rowVirtualizer;

	const handleInstitutionClick = useCallback(
		(institution: Institution) => {
			const institutionId = String(institution.id);
			if (selectedInstitutionId === institutionId) {
				router.push(toLocalePath("/list"));
				return;
			}
			router.push(toLocalePath(`/list/institution/${institutionId}`));
		},
		[router, selectedInstitutionId, toLocalePath],
	);

	useEffect(() => {
		rowVirtualizerRef.current.measure();
	}, [institutionsList, selectedInstitutionId]);

	useEffect(() => {
		const updateListScrollMargin = () => {
			const listElement = listContainerRef.current;
			if (!listElement) return;
			const nextScrollMargin =
				listElement.getBoundingClientRect().top + window.scrollY;
			setListScrollMargin((current) =>
				Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin,
			);
		};

		updateListScrollMargin();
		window.addEventListener("resize", updateListScrollMargin);

		return () => window.removeEventListener("resize", updateListScrollMargin);
	}, [institutionsList.length]);

	useEffect(() => {
		if (!selectedInstitutionId) return;

		const selectedRowElement =
			rowElementMapRef.current.get(selectedInstitutionId) ?? null;
		if (!selectedRowElement || typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.height <= 0) continue;
				rowVirtualizerRef.current.measure();
			}
		});

		observer.observe(selectedRowElement);

		return () => observer.disconnect();
	}, [selectedInstitutionId]);

	useEffect(() => {
		if (activeLetter && !enabledLetters.has(activeLetter)) {
			setActiveLetter(null);
		}
	}, [activeLetter, enabledLetters]);

	useEffect(() => {
		if (categories === null) {
			initializeCategories();
		}
		if (districts.length === 0) {
			initializeDistricts();
		}
	}, [categories, districts.length, initializeCategories, initializeDistricts]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		const handleScroll = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const scrollTop =
					window.pageYOffset || document.documentElement.scrollTop;
				listScrollOffsetRef.current = scrollTop;
				setShowScrollToTop(scrollTop > 400);
				writeStoredListScrollOffset(scrollTop);
			}, 100);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
			clearTimeout(timeoutId);
		};
	}, [selectedInstitutionId]);

	useEffect(() => {
		if (!selectedInstitutionId) {
			lastSyncedSelectionRef.current = null;
			return;
		}

		const syncKey = selectedInstitutionId;
		if (lastSyncedSelectionRef.current === syncKey) return;

		const selectedIndex = institutionsList.findIndex(
			(institution) => String(institution.id) === selectedInstitutionId,
		);

		if (selectedIndex < 0) return;

		lastSyncedSelectionRef.current = syncKey;

		rowVirtualizerRef.current.scrollToIndex(selectedIndex, {
			align: "center",
			behavior: "auto",
		});

		let attempts = 0;
		let rafId = 0;
		const focusWhenReady = () => {
			attempts += 1;
			rafId = requestAnimationFrame(() => {
				const selectedCard = document.querySelector(
					`[data-institution-card-id="${selectedInstitutionId}"]`,
				) as HTMLElement | null;
				if (!selectedCard) {
					if (attempts < 10) {
						focusWhenReady();
					}
					return;
				}
				selectedCard.focus({ preventScroll: true });
			});
		};
		focusWhenReady();

		return () => cancelAnimationFrame(rafId);
	}, [selectedInstitutionId, institutionsList]);

	useEffect(() => {
		if (selectedInstitutionId !== null) return;
		if (!pendingTopScrollAfterDeselectRef.current) return;

		pendingTopScrollAfterDeselectRef.current = false;
		lastSyncedSelectionRef.current = null;
		hasRestoredListScrollRef.current = true;
		listScrollOffsetRef.current = 0;
		writeStoredListScrollOffset(0);
		setShowScrollToTop(false);

		rowVirtualizerRef.current.scrollToOffset(0, { behavior: "auto" });
		window.scrollTo({ top: 0, behavior: "auto" });
		requestAnimationFrame(() => {
			rowVirtualizerRef.current.scrollToOffset(0, { behavior: "auto" });
			window.scrollTo({ top: 0, behavior: "auto" });
		});
	}, [selectedInstitutionId]);

	useEffect(() => {
		if (selectedInstitutionId !== null) {
			hasRestoredListScrollRef.current = false;
			return;
		}
		if (pendingTopScrollAfterDeselectRef.current) return;
		if (hasRestoredListScrollRef.current) return;

		const offset = readStoredListScrollOffset();
		if (offset <= 0) {
			hasRestoredListScrollRef.current = true;
			return;
		}

		hasRestoredListScrollRef.current = true;
		rowVirtualizerRef.current.scrollToOffset(offset, { behavior: "auto" });
		requestAnimationFrame(() => {
			window.scrollTo({ top: offset, behavior: "auto" });
		});
	}, [selectedInstitutionId, institutionsList.length]);

	useEffect(() => {
		const isSearching = normalizedDeferredQuery.length > 0;
		if (isSearching && !previousSearchActiveRef.current) {
			if (selectedInstitutionId) {
				router.replace(toLocalePath("/list"), { scroll: false });
			}
			resetFilters();
		}
		previousSearchActiveRef.current = isSearching;
	}, [
		normalizedDeferredQuery,
		selectedInstitutionId,
		router,
		toLocalePath,
		resetFilters,
	]);

	const scrollToTop = () => {
		if (selectedInstitutionId) {
			writeStoredListScrollOffset(0);
			listScrollOffsetRef.current = 0;
			pendingTopScrollAfterDeselectRef.current = true;
			hasRestoredListScrollRef.current = false;
			router.replace(toLocalePath("/list"), { scroll: false });
			return;
		}

		rowVirtualizerRef.current.scrollToOffset(0, { behavior: "auto" });
		window.scrollTo({ top: 0, behavior: "auto" });
		writeStoredListScrollOffset(0);
		listScrollOffsetRef.current = 0;
		setShowScrollToTop(false);
	};

	if (!institutions) {
		return <ListViewSkeleton />;
	}

	const loadingFilters = categories === null || districts.length === 0;
	const handleFilterRetry = () => {
		initializeCategories();
		initializeDistricts();
	};

	return (
		<div className="ListView-root w-full h-full flex flex-col items-center bg-neutral-10">
			<div className="h-full w-full max-w-5xl ">
				<div className="p-4 mt-20">
					<div className="space-y-6 flex flex-col">
						<div className="space-y-2">
							<h1>{tContent("listView.title")}</h1>
							<h2 className="font-bold">{tContent("listView.subtitle")}</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<span className="body1">{tContent("listView.description")}</span>
						</div>

						<div className="space-y-2">
							<div className="flex items-end justify-between gap-4 md:flex-row flex-col">
								<strong className="body2 text-nowrap">
									{tContent("listView.countLabel", {
										count: institutionsList.length,
									})}
								</strong>
								<ListTopbar
									query={searchQuery}
									onQueryChange={(value) => setSearchQuery(value ?? "")}
									onOpenFilter={() => setIsFilterOpen(true)}
								/>
							</div>
							<AlphabetFilter
								activeLetter={activeLetter}
								onSelectLetter={setActiveLetter}
								enabledLetters={enabledLetters}
							/>
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
								className=""
								aria-label={t("listView.institutionsListLabel")}
								ref={listContainerRef}
							>
								{(() => {
									const virtualRows = rowVirtualizer.getVirtualItems();
									const totalSize = rowVirtualizer.getTotalSize();

									return (
										<div
											aria-hidden={institutionsList.length === 0}
											className="relative"
											style={{ height: totalSize }}
										>
											{virtualRows.map((virtualRow) => {
												const institution = institutionsList[virtualRow.index];
												if (!institution) return null;
												const institutionId = String(institution.id);
												return (
													<div
														key={institution.id}
														data-index={virtualRow.index}
														data-institution-id={institutionId}
														ref={(element) => {
															rowVirtualizer.measureElement(element);
															if (element) {
																rowElementMapRef.current.set(
																	institutionId,
																	element,
																);
																return;
															}
															rowElementMapRef.current.delete(institutionId);
														}}
														className="absolute left-0 top-0 w-full py-1"
														style={{
															transform: `translateY(${virtualRow.start - listScrollMargin}px)`,
														}}
													>
														<InstitutionCard
															institutionData={institution}
															onClick={handleInstitutionClick}
															isCompact={true}
															isSelected={
																selectedInstitutionId === institutionId
															}
															openDetails={
																selectedInstitutionId === institutionId
															}
														/>
													</div>
												);
											})}
										</div>
									);
								})()}
							</div>
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
								radius="full"
								variant="surface"
								iconSize="lg"
								data-testid="list-scroll-top"
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
