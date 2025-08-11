"use client";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { searchLocations } from "@/lib/serverActions/searchLocations";
import { useMapStore } from "@/lib/store/mapStore";
import { sanitizeAddressInput } from "@/lib/utils/sanitizerUtils";
import { boundingExtent } from "ol/extent";
import { fromLonLat } from "ol/proj";
import { ChangeEvent, useRef } from "react";
import Search from "@/icons/search.svg";
import { SearchResults } from "./SearchResults";
import { SearchMessages } from "./SearchMessages";
import { GeoFeature, Institution, SearchResult } from "@/types/institution";
import { useVenueStore } from "@/lib/store/venueStore";

export const isGeoFeature = (result: SearchResult): result is GeoFeature => {
	return "place_name" in result && "center" in result;
};

const ANIMATION_DURATION = 1000;
const DEFAULT_ZOOM = 5;

export function LocationSearch() {
	const { t } = useTranslation("common");
	const inputRef = useRef<HTMLInputElement>(null);
	const { map } = useMapStore();
	const setSelectedVenueId = useVenueStore((state) => state.setSelectedVenueId);

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
		handleKeyDown,
		listRef,
		getItemProps,
		reset: resetNavigation,
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

	const extractCoordinates = (result: Institution): [number, number] | null => {
		if (result.case) {
			const match = result.case.match(/\\(([^,]+),([^)]+)\\)/);
			if (match) {
				const x = parseFloat(match[1]);
				const y = parseFloat(match[2]);
				if (!isNaN(x) && !isNaN(y)) {
					return [x, y];
				}
			}
		}

		if (result.st_asgeojson) {
			try {
				const geoJson = JSON.parse(result.st_asgeojson);
				if (geoJson.coordinates && Array.isArray(geoJson.coordinates)) {
					return [geoJson.coordinates[0], geoJson.coordinates[1]];
				}
			} catch (error) {
				console.warn("Failed to parse st_asgeojson:", error);
			}
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
			map.getView().animate({
				center: transformedCoords,
				duration: ANIMATION_DURATION,
				zoom: DEFAULT_ZOOM,
			});
		}

		if (statusRef.current) {
			statusRef.current.textContent = `${result.place_name} ausgewählt.`;
		}
	};

	const handleInstitutionClick = (result: Institution) => {
		const coordinates = extractCoordinates(result);

		if (coordinates && map) {
			map.getView().animate({
				center: coordinates,
				duration: ANIMATION_DURATION,
				zoom: DEFAULT_ZOOM,
			});
		}

		setSelectedVenueId(result.id as unknown as string);

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

		const escapedQuery = searchQuery.replace(
			/[.*+?^${}()|[\\]\\\\]/g,
			"\\\\$&",
		);
		const regex = new RegExp(`(${escapedQuery})`, "gi");
		const parts = text.split(regex);

		return parts.map((part, index) =>
			regex.test(part) ? <strong key={index}>{part}</strong> : part,
		);
	};

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="flex-shrink-0 mb-8">
				<div className="relative">
					<Input
						ref={inputRef}
						placeholder={t("search.hint")}
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						className="w-full bg-white"
						icon={<Search className="w-5 h-5 text-foreground" />}
						iconPosition="left"
						aria-invalid={!!resultErrorMessage}
					/>
					{isLoading && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
			/>

			<SearchMessages
				hasError={resultErrorMessage}
				hasResults={searchResults.length > 0}
				isLoading={isLoading}
				query={query}
			/>
		</div>
	);
}
