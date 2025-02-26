import { Input } from "@/components/ui/input";
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
}

const GeolocationSearch: FC<GeolocationSearchProps> = ({
	helperText = "Enter an address",
	map,
	onLocationSelect,
	flyToOptions = { zoom: 14, duration: 2000 },
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

	// Refs
	const listRef = useRef<HTMLUListElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const displayResultError = () => {
		setResultErrorMessage(
			"Es konnte keine Adresse unter der Suchangabe gefunden werden.",
		);
	};

	useEffect(() => {
		console.log("[GeolocationSearch] results::", results);
	}, [results]);
	useEffect(() => {
		console.log("[GeolocationSearch] query::", query);
	}, [query]);

	const searchAddress = async (searchQuery: string) => {
		if (!searchQuery) {
			setResults([]);
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(
				`/api/geocode?searchQuery=${encodeURIComponent(searchQuery)}`,
			);
			const data = await res.json();

			if (data.features.length === 0) {
				displayResultError();
			}

			setResults(data.features || []);
		} catch {
			setResults([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setResultErrorMessage(null);
		setQuery(value);

		if (debounceTimeout) clearTimeout(debounceTimeout);

		const timeout = setTimeout(() => {
			searchAddress(value);
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
		inputRef.current?.focus();
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
				break;
			default:
				break;
		}
	};

	return (
		<div
			className="GeolocationSearch-root absolute top-4 left-10 z-10 w-64"
			role="search"
			aria-label="Adressuche auf der Karte"
		>
			<Input
				ref={inputRef}
				placeholder={helperText}
				value={query}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				aria-expanded={results.length > 0}
				aria-controls="search-results"
				aria-label="Sucheeingabefeld"
				aria-activedescendant={
					activeIndex >= 0 ? `result-${results[activeIndex]?.id}` : undefined
				}
				aria-busy={isLoading}
				className="w-full bg-white"
			/>

			{results.length > 0 && (
				<ul
					id="search-results"
					ref={listRef}
					role="listbox"
					className="absolute w-full mt-2 bg-white rounded-md shadow-lg max-h-100 overflow-y-auto"
					aria-label="Search results"
				>
					{results.map((result, index) => (
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
                    ${!isKeyboardNav ? "hover:bg-gray-100" : ""}
                `}
						>
							{result.place_name}
						</li>
					))}
				</ul>
			)}
			{resultErrorMessage && (
				<ul
					role="listbox"
					className="absolute w-full mt-2 bg-white rounded-md shadow-lg max-h-100 overflow-y-auto"
					aria-label="Search results"
				>
					<li className="p-3 text-sm text-red-500">{resultErrorMessage}</li>
				</ul>
			)}

			{isLoading && (
				<div className="absolute right-3 top-3" aria-hidden="true">
					<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
				</div>
			)}
		</div>
	);
};

export default GeolocationSearch;
