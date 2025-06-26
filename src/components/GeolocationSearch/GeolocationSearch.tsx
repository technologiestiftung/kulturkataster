import { Input } from "@/components/ui/input";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { useMapStore } from "@/lib/store/mapStore";
import { sanitizeAddressInput } from "@/lib/utils/sanitizerUtils";
import { ChangeEvent, FC, useRef } from "react";
// Import OpenLayers projection utilities
import { boundingExtent } from "ol/extent";
import { fromLonLat } from "ol/proj";

interface GeoFeature {
	id: string;
	place_name: string;
	center: [number, number];
	geometry: {
		coordinates: [number, number];
	};
	bbox?: [number, number, number, number];
}

interface GeolocationSearchProps {
	helperText?: string;
	onLocationSelect?: (location: {
		lat: number;
		lng: number;
		name: string;
	}) => void;
	flyToOptions?: {
		zoom?: number;
		duration?: number;
		padding?: number[];
	};
	strictSanitization?: boolean;
}

const GeolocationSearch: FC<GeolocationSearchProps> = ({
	helperText = "Enter an address",
	onLocationSelect,
	flyToOptions = { zoom: 15, duration: 2000, padding: [50, 50, 50, 50] },
	strictSanitization = false,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const { map } = useMapStore();

	// Setup the search hook
	const {
		query,
		results,
		isLoading,
		resultErrorMessage,
		statusRef,
		setResults,
		setQuery,
	} = useSearch<GeoFeature>({
		timeoutDuration: 400,
		searchFunction: async (searchQuery: string) => {
			const res = await fetch(
				`/api/geocode?searchQuery=${encodeURIComponent(searchQuery)}&_=${Date.now()}`,
				{ cache: "no-store" },
			);
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			const data = await res.json();
			return data.features || [];
		},
	});

	// Setup the keyboard navigation hook
	const {
		activeIndex,
		isKeyboardNav,
		handleKeyDown,
		listRef,
		getItemProps,
		reset: resetNavigation,
	} = useKeyboardNavigation({
		itemCount: results.length,
		onEnter: (index) => {
			handleResultClick(results[index]);
		},
		onEscape: () => {
			setResults([]);
			inputRef.current?.focus();
		},
	});

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;

		const sanitizedValue = sanitizeAddressInput(rawValue, strictSanitization);

		if (sanitizedValue !== rawValue) {
			e.target.value = sanitizedValue;
		}

		setQuery(sanitizedValue);
		resetNavigation();
	};

	const handleResultClick = (result: GeoFeature) => {
		const [lng, lat] = result.center;

		if (map) {
			if (result.bbox && result.bbox.length === 4) {
				// Transform bbox coordinates from EPSG:4326 to EPSG:3857
				const [minLng, minLat, maxLng, maxLat] = result.bbox;
				const bottomLeft = fromLonLat([minLng, minLat]);
				const topRight = fromLonLat([maxLng, maxLat]);
				const extent = boundingExtent([bottomLeft, topRight]);

				map.getView().fit(extent, {
					duration: flyToOptions.duration,
					padding: flyToOptions.padding,
				});
			} else {
				const transformedCoords = fromLonLat([lng, lat]);

				map.getView().animate({
					center: transformedCoords,
					duration: flyToOptions.duration,
					zoom: flyToOptions.zoom || 10,
				});
			}
		}

		if (onLocationSelect) {
			onLocationSelect({
				lat,
				lng,
				name: result.place_name,
			});
		}
		setQuery("");
		setResults([]);
		resetNavigation();

		if (statusRef.current) {
			statusRef.current.textContent = `${result.place_name} ausgewählt.`;
		}
	};

	const handleBlur = (e: React.FocusEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setTimeout(() => {
				setResults([]);
			}, 100);
		}
	};

	return (
		<div
			className="GeolocationSearch-root absolute top-4 left-10 z-10 w-64 sm:w-80 md:w-96"
			role="search"
			aria-label="Adressuche auf der Karte"
			onBlur={handleBlur}
		>
			<div className="relative">
				<Input
					ref={inputRef}
					placeholder={helperText}
					value={query}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					aria-expanded={results.length > 0}
					aria-controls="search-results"
					aria-label="Adresse suchen"
					aria-activedescendant={
						activeIndex >= 0 ? `keyboard-nav-item-${activeIndex}` : undefined
					}
					aria-describedby="search-status"
					className="w-full bg-white pr-10"
				/>

				{isLoading && (
					<div className="absolute right-3 top-3" aria-hidden="true">
						<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
					</div>
				)}

				<div
					ref={statusRef}
					id="search-status"
					className="sr-only"
					role="status"
					aria-live="polite"
				></div>
			</div>

			{(results.length > 0 || resultErrorMessage) && (
				<ul
					id="search-results"
					ref={listRef}
					role="listbox"
					className="absolute w-full mt-2 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto"
					aria-label="Suchergebnisse"
				>
					{results.length > 0 &&
						results.map((result, index) => (
							<li
								key={result.id + index}
								{...getItemProps(index)}
								tabIndex={0}
								onClick={() => handleResultClick(result)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleResultClick(result);
									}
								}}
								onMouseDown={(e) => e.preventDefault()}
								className={`p-3 cursor-pointer border-b last:border-b-0 text-sm 
                  ${isKeyboardNav && index === activeIndex ? "bg-gray-100" : ""}
                  ${!isKeyboardNav && index === activeIndex ? "bg-gray-50" : ""}
                  hover:bg-gray-100
                `}
								role="option"
								aria-selected={index === activeIndex}
								aria-label={result.place_name}
							>
								{result.place_name}
							</li>
						))}
					{resultErrorMessage && (
						<li className="p-3 text-sm text-red-500">{resultErrorMessage}</li>
					)}
				</ul>
			)}
		</div>
	);
};

export default GeolocationSearch;
