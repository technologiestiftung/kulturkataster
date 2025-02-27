import { Input } from "@/components/ui/input";
import { sanitizeAddressInput } from "@/lib/utils/sanitizerUtils";
import maplibregl from "maplibre-gl";
import {
	ChangeEvent,
	FC,
	KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";

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
	map?: maplibregl.Map | null;
	onLocationSelect?: (location: {
		lat: number;
		lng: number;
		name: string;
	}) => void;
	flyToOptions?: {
		zoom?: number;
		duration?: number;
	};
	strictSanitization?: boolean;
}

const GeolocationSearch: FC<GeolocationSearchProps> = ({
	helperText = "Enter an address",
	map,
	onLocationSelect,
	flyToOptions = { zoom: 14, duration: 2000 },
	strictSanitization = false,
}) => {
	// State
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GeoFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isKeyboardNav, setIsKeyboardNav] = useState(false);
	const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);
	const [resultErrorMessage, setResultErrorMessage] = useState<string | null>(
		null,
	);
	const [requestId, setRequestId] = useState<number>(0);

	// Refs
	const listRef = useRef<HTMLUListElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const statusRef = useRef<HTMLDivElement>(null);

	const displayResultError = () => {
		setResultErrorMessage(
			"Es konnte keine Adresse unter der Suchangabe gefunden werden.",
		);
	};

	useEffect(() => {
		return () => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
		};
	}, [debounceTimeout]);

	useEffect(() => {
		if (isKeyboardNav && activeIndex >= 0 && listRef.current) {
			const activeItem = listRef.current.children[activeIndex] as HTMLElement;
			if (activeItem) {
				activeItem.scrollIntoView({ block: "nearest" });
			}
		}
	}, [activeIndex, isKeyboardNav]);

	const searchAddress = async (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setResults([]);
			return;
		}

		setIsLoading(true);
		const currentRequestId = requestId + 1;
		setRequestId(currentRequestId);

		try {
			const res = await fetch(
				`/api/geocode?searchQuery=${encodeURIComponent(searchQuery)}&_=${Date.now()}`,
				{ cache: "no-store" },
			);

			if (currentRequestId === requestId + 1) {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}

				const data = await res.json();

				if (data.features && data.features.length === 0) {
					displayResultError();
				} else {
					setResultErrorMessage(null);
				}

				setResults(data.features || []);

				// Announce results to screen readers
				if (statusRef.current) {
					const resultCount = data.features ? data.features.length : 0;
					statusRef.current.textContent = `${resultCount} ${
						resultCount === 1 ? "Ergebnis" : "Ergebnisse"
					} gefunden.`;
				}
			}
		} catch (error) {
			if (currentRequestId === requestId + 1) {
				console.error("Error searching for address:", error);
				setResults([]);
				setResultErrorMessage(
					"Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
				);
			}
		} finally {
			if (currentRequestId === requestId + 1) {
				setIsLoading(false);
			}
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;

		const sanitizedValue = sanitizeAddressInput(rawValue, strictSanitization);

		if (sanitizedValue !== rawValue) {
			e.target.value = sanitizedValue;
		}

		setResultErrorMessage(null);
		setQuery(sanitizedValue);

		if (debounceTimeout) clearTimeout(debounceTimeout);

		if (!sanitizedValue.trim()) {
			setResults([]);
			setIsLoading(false);
			return;
		}

		const timeout = setTimeout(() => {
			searchAddress(sanitizedValue);
		}, 400);

		setDebounceTimeout(timeout);
		setActiveIndex(-1);
	};

	const handleResultClick = (result: GeoFeature) => {
		const [lng, lat] = result.center;

		if (map) {
			if (result.bbox) {
				map.fitBounds(
					[
						[result.bbox[0], result.bbox[1]],
						[result.bbox[2], result.bbox[3]],
					],
					{
						padding: 50,
						duration: flyToOptions.duration,
					},
				);
			} else {
				map.flyTo({
					center: [lng, lat],
					zoom: flyToOptions.zoom,
					duration: flyToOptions.duration,
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
		setActiveIndex(-1);

		if (statusRef.current) {
			statusRef.current.textContent = `${result.place_name} ausgewählt.`;
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (!results.length) return;

		setIsKeyboardNav(true);

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
				break;
			case "ArrowUp":
				e.preventDefault();
				setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (activeIndex >= 0) {
					handleResultClick(results[activeIndex]);
				}
				break;
			case "Escape":
				e.preventDefault();
				setResults([]);
				setActiveIndex(-1);
				inputRef.current?.focus();
				break;
			default:
				break;
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
						activeIndex >= 0 ? `result-${results[activeIndex]?.id}` : undefined
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
					{results.length > 0 ? (
						results.map((result, index) => (
							<li
								key={result.id}
								id={`result-${result.id}`}
								role="option"
								aria-selected={index === activeIndex}
								onClick={() => handleResultClick(result)}
								onMouseEnter={() => {
									setIsKeyboardNav(false);
									setActiveIndex(index);
								}}
								onMouseDown={(e) => e.preventDefault()}
								className={`p-3 cursor-pointer border-b last:border-b-0 text-sm 
                  ${isKeyboardNav && index === activeIndex ? "bg-gray-100" : ""}
                  ${!isKeyboardNav && index === activeIndex ? "bg-gray-50" : ""}
                  hover:bg-gray-100
                `}
							>
								{result.place_name}
							</li>
						))
					) : resultErrorMessage ? (
						<li className="p-3 text-sm text-red-500">{resultErrorMessage}</li>
					) : null}
				</ul>
			)}
		</div>
	);
};

export default GeolocationSearch;
