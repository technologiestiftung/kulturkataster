"use client";

import { SearchInput } from "@/components/ui/search-input";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { searchLocations } from "@/server/actions/searchLocations";
import { useMapStore } from "@/lib/store/mapStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { sanitizeAddressInput } from "@/lib/utils/sanitizerUtils";
import {
	animateMapToCoordinates,
	ANIMATION_DURATION,
} from "@/lib/utils/mapUtils";
import { GeoFeature, Institution, SearchResult } from "@/types/institution";
import { boundingExtent } from "ol/extent";
import { fromLonLat } from "ol/proj";
import { ChangeEvent, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getCoordinatesFromAddress } from "@/lib/utils/institutionUtils";
import { usePathname, useRouter } from "next/navigation";
import Close from "@/icons/close.svg";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { FilterButtonWithCount } from "@/components/Filter/FilterButtonWithCount";

export const isGeoFeature = (result: SearchResult): result is GeoFeature => {
	return "place_name" in result && "center" in result;
};

export function LocationSearch({
	onResultsChange,
	onFilterClick,
	onQueryChange,
	onLoadingChange,
	showResults = true,
	placeholder,
	searchFunction,
}: {
	onResultsChange?: (results: SearchResult[]) => void;
	onFilterClick?: () => void;
	onQueryChange?: (query: string) => void;
	onLoadingChange?: (isLoading: boolean) => void;
	showResults?: boolean;
	placeholder?: string;
	searchFunction?: (query: string) => Promise<SearchResult[]>;
}) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);
	const { map } = useMapStore();
	const resetFilters = useInstitutionStore((state) => state.resetFilters);

	const router = useRouter();
	const pathname = usePathname();

	const {
		query,
		results: searchResults,
		isLoading,
		resultErrorMessage,
		statusRef,
		setResults: setSearchResults,
		setQuery,
	} = useSearch<SearchResult>({
		timeoutDuration: 500,
		searchFunction: async (currQuery: string) => {
			if (searchFunction) {
				return searchFunction(currQuery);
			}
			const result = await searchLocations(currQuery);
			return result.allResults;
		},
	});

	useEffect(() => {
		onResultsChange?.(searchResults);
	}, [searchResults, onResultsChange]);

	useEffect(() => {
		onLoadingChange?.(isLoading);
	}, [isLoading, onLoadingChange]);

	const updateQuery = (nextQuery: string) => {
		setQuery(nextQuery);
		onQueryChange?.(nextQuery);
	};

	const {
		activeIndex,
		activeDescendantId,
		handleKeyDown,
		listRef,
		getItemProps,
		reset: resetNavigation,
		listId,
	} = useKeyboardNavigation({
		itemCount: searchResults.length,
		onEnter: (index) => {
			handleResultClick(searchResults[index]);
		},
		onEscape: () => {
			clearResults();
			inputRef.current?.focus();
		},
	});

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;
		const sanitizedValue = sanitizeAddressInput(rawValue, false);

		if (sanitizedValue !== rawValue) {
			e.target.value = sanitizedValue;
		}

		updateQuery(sanitizedValue);
		resetNavigation();
	};

	const clearResults = () => {
		setSearchResults([]);
	};

	const extractCoordinates = (result: Institution): [number, number] | null => {
		const addressCoordinates = getCoordinatesFromAddress(result.address);
		if (addressCoordinates) return addressCoordinates;
		return null;
	};
	const handleGeoFeatureClick = (result: GeoFeature) => {
		const [lng, lat] = result.center;

		if (!map) return;

		if (result.bbox && result.bbox.length === 4) {
			const [minLng, minLat, maxLng, maxLat] = result.bbox;
			const bottomLeft = fromLonLat([minLng, minLat]);
			const topRight = fromLonLat([maxLng, maxLat]);
			const extent = boundingExtent([bottomLeft, topRight]);

			map.getView().fit(extent, {
				duration: ANIMATION_DURATION,
				padding: [50, 50, 50, 50],
			});
		} else {
			const transformedCoords = fromLonLat([lng, lat]);
			animateMapToCoordinates(map, transformedCoords);
		}

		if (statusRef.current) {
			statusRef.current.textContent = `${result.place_name} ausgewählt.`;
		}
	};

	const handleInstitutionClick = (result: Institution) => {
		const coordinates = extractCoordinates(result);

		if (coordinates && map) {
			const transformedCoords = fromLonLat(coordinates);
			animateMapToCoordinates(map, transformedCoords);
		}

		const isListRoute = /\/list(\/|$)/.test(pathname ?? "");
		const baseRoute = isListRoute ? "/list" : "/map";
		router.push(`${baseRoute}/institution/${result.id}`);

		if (statusRef.current) {
			statusRef.current.textContent = `${result.name} ausgewählt.`;
		}
	};

	const handleResultClick = (result: SearchResult) => {
		if (isGeoFeature(result)) {
			handleGeoFeatureClick(result);
		} else {
			handleInstitutionClick(result);
		}
		updateQuery("");
		clearResults();
		resetNavigation();
	};

	const formatAddress = (institution: Institution) => {
		const street = [
			institution.address?.street,
			institution.address?.street_number,
		]
			.filter(Boolean)
			.join(" ");
		const city = [institution.address?.zipcode, institution.address?.city]
			.filter(Boolean)
			.join(" ");
		return [street, city].filter(Boolean).join(", ");
	};

	const highlightMatch = (text: string, searchQuery: string) => {
		if (!searchQuery.trim() || !text) return text;

		// Split search query into individual terms
		const searchTerms = searchQuery
			.trim()
			.split(/\s+/)
			.filter((term) => term.length > 0);

		// Escape each term for regex
		const escapedTerms = searchTerms.map((term) =>
			term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"),
		);

		// Create regex pattern that matches any of the terms
		const pattern = escapedTerms.join("|");
		const regex = new RegExp(`(${pattern})`, "gi");

		const parts = text.split(regex);

		return parts.map((part, index) =>
			regex.test(part) ? <strong key={index}>{part}</strong> : part,
		);
	};

	const resultOptions = useMemo(
		() =>
			searchResults.map((result) => {
				const value = isGeoFeature(result)
					? `address-${result.id}`
					: `institution-${result.id}`;
				if (isGeoFeature(result)) {
					return {
						value,
						label: highlightMatch(result.place_name, query),
					};
				}
				return {
					value,
					label: highlightMatch(result.name, query),
					description: highlightMatch(formatAddress(result), query),
				};
			}),
		[searchResults, query],
	);

	const resultByValue = useMemo(
		() =>
			new Map(
				searchResults.map((result) => {
					const value = isGeoFeature(result)
						? `address-${result.id}`
						: `institution-${result.id}`;
					return [value, result];
				}),
			),
		[searchResults],
	);

	return (
		<div className="h-full w-full flex flex-col overflow-visible">
			{/* <SearchMessages
        hasError={resultErrorMessage}
        hasResults={searchResults.length > 0}
        isLoading={isLoading}
        query={query}
        className="order-last"
        /> */}
			<div className="mb-8 flex w-full items-center gap-2 flex-row pointer-events-auto">
				<SearchInput
					ref={inputRef}
					placeholder={placeholder ?? t("common.search.hint")}
					value={query}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					aria-invalid={!!resultErrorMessage}
					role="combobox"
					containerClassName="flex-1"
					type="search"
					aria-autocomplete="list"
					aria-expanded={searchResults.length > 0}
					aria-controls={searchResults.length > 0 ? listId : undefined}
					aria-activedescendant={
						searchResults.length > 0 ? activeDescendantId : undefined
					}
					rightSlot={
						<div className="absolute right-14 md:right-5 top-1/2 transform -translate-y-1/2">
							{isLoading && (
								<div className="w-5 h-5 border-2 border-neutral-20 border-t-accent rounded-full motion-safe:animate-spin" />
							)}
							{!isLoading && searchResults.length > 0 && (
								<Close
									onClick={() => {
										updateQuery("");
										clearResults();
										inputRef.current?.focus();
									}}
									className="w-5 h-5"
								/>
							)}
						</div>
					}
				/>

				{onFilterClick && (
					<FilterButtonWithCount
						tooltip={t("common.filter.title", {
							defaultValue: "Kulturorte filtern",
						})}
						className="cursor-pointer relative right-16 md:right-0 bg-neutral-80 hover:bg-neutral-70 md:bg-accent md:bg-background md:text-foreground text-popover scale-90 md:scale-100 md:invert-0"
						onClick={onFilterClick}
					/>
				)}

				<div ref={statusRef} className="sr-only" aria-live="polite"></div>
			</div>

			{showResults && searchResults.length > 0 ? (
				<SelectableOptionsList
					options={resultOptions}
					selectedValues={[]}
					multiSelect={false}
					showCheckbox={true}
					variant="search"
					headingLabel={t("common.search.suggestions")}
					listId={listId}
					listRef={listRef as React.RefObject<HTMLDivElement | null>}
					activeIndex={activeIndex}
					getItemProps={getItemProps}
					onToggle={(value) => {
						const result = resultByValue.get(value);
						if (result) {
							resetFilters();
							handleResultClick(result);
						}
					}}
				/>
			) : null}
		</div>
	);
}
