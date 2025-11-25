"use client";

import { Input } from "@/components/ui/input";
import Search from "@/icons/search.svg";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { searchLocations } from "@/lib/serverActions/searchLocations";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { sanitizeAddressInput } from "@/lib/utils/sanitizerUtils";
import {
	parseSearchLatLongCoordinates,
	parseCaseCoordinates,
	parseGeoJsonCoordinates,
	animateMapToCoordinates,
	ANIMATION_DURATION,
} from "@/lib/utils/mapUtils";
import { GeoFeature, Institution, SearchResult } from "@/types/institution";
import { boundingExtent } from "ol/extent";
import { fromLonLat } from "ol/proj";
import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SearchMessages } from "./SearchMessages";
import { SearchResults } from "./SearchResults";

export const isGeoFeature = (result: SearchResult): result is GeoFeature => {
	return "place_name" in result && "center" in result;
};

export function LocationSearch() {
	const { t } = useTranslation("common");
	const inputRef = useRef<HTMLInputElement>(null);
	const { map } = useMapStore();
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);

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
			const result = await searchLocations(currQuery);
			return result.allResults;
		},
	});

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

		setQuery(sanitizedValue);
		resetNavigation();
	};

	const clearResults = () => {
		setSearchResults([]);
	};

	const extractCoordinates = (
		result: Institution & { case?: string; st_asgeojson?: string },
	): [number, number] | null => {
		if (result.latlong) {
			const coords = parseSearchLatLongCoordinates(result.latlong as string);
			return coords;
		}

		if (result.case) {
			return parseCaseCoordinates(result.case);
		}

		if (result.st_asgeojson) {
			return parseGeoJsonCoordinates(result.st_asgeojson);
		}
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
			animateMapToCoordinates(map, coordinates);
		}

		setSelectedInstitutionId(result.id as unknown as string);

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
		setQuery("");
		clearResults();
		resetNavigation();
	};

	const formatAddress = (institution: Institution) => {
		const street = [institution.street, institution.street_number]
			.filter(Boolean)
			.join(" ");
		const city = [institution.zip_code, institution.city?.name]
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

	return (
		<div className="h-full flex flex-col overflow-visible">
			<SearchMessages
				hasError={resultErrorMessage}
				hasResults={searchResults.length > 0}
				isLoading={isLoading}
				query={query}
				className="order-last"
			/>
			<div className="flex-shrink-0 mb-8">
				<div className="relative">
					<Input
						ref={inputRef}
						placeholder={t("search.hint")}
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						className="w-full bg-background"
						icon={<Search className="w-5 h-5 text-foreground" />}
						iconPosition="left"
						aria-invalid={!!resultErrorMessage}
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={searchResults.length > 0}
						aria-controls={searchResults.length > 0 ? listId : undefined}
						aria-activedescendant={
							searchResults.length > 0 ? activeDescendantId : undefined
						}
					/>
					{isLoading && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div className="w-4 h-4 border-2 border-neutral-20 border-t-accent rounded-full animate-spin" />
						</div>
					)}
				</div>
				<div ref={statusRef} className="sr-only" aria-live="polite"></div>
			</div>

			<SearchResults
				results={searchResults}
				query={query}
				activeIndex={activeIndex}
				listRef={listRef}
				getItemProps={getItemProps}
				onResultClick={handleResultClick}
				highlightMatch={highlightMatch}
				formatAddress={formatAddress}
				listId={listId}
			/>
		</div>
	);
}
