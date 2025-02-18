import { Input } from "@/components/ui/input";
import maplibregl from "maplibre-gl";
import { FC, useState } from "react";

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
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GeoFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const searchAddress = async (searchQuery: string) => {
		if (!searchQuery) {
			setResults([]);
			return;
		}
		setIsLoading(true);
		try {
			const bbox = process.env.NEXT_PUBLIC_MAP_BOUNDING_BOX;
			const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
			const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
				searchQuery,
			)}.json?key=${apiKey}${bbox ? `&bbox=${bbox}` : ""}`;

			const res = await fetch(url);
			const data = await res.json();
			setResults(data.features || []);
		} catch (error) {
			console.error("Geocoding error:", error);
			setResults([]);
			setIsLoading(false);
		} finally {
			setIsLoading(false);
		}
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
		setQuery(result.place_name);
		setResults([]);
		setQuery("");
	};

	return (
		<div className="GeolocationSearch-root absolute top-4 left-10 z-10 w-64">
			<Input
				placeholder={helperText}
				value={query}
				onChange={(e) => {
					const value = e.target.value;
					setQuery(value);
					searchAddress(value);
				}}
				className="w-full bg-white"
			/>

			{results.length > 0 && (
				<ul className="absolute w-full mt-2 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
					{results.map((result) => (
						<li
							key={result.id}
							onClick={() => handleResultClick(result)}
							className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 text-sm"
						>
							{result.place_name}
						</li>
					))}
				</ul>
			)}

			{isLoading && (
				<div className="absolute right-3 top-3">
					<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
				</div>
			)}
		</div>
	);
};

export default GeolocationSearch;
