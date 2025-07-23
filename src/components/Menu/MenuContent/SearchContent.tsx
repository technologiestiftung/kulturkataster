"use client";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { searchInstitutions } from "@/lib/supabase/api";
import { useMapStore } from "@/lib/store/mapStore";
import { ChangeEvent, useRef } from "react";
import Search from "@/icons/search.svg";

interface Institution {
	id: number;
	name: string;
	street: string;
	street_number: string;
	zip_code: string;
	city?: { name: string };
	district?: { name: string };
	neighbourhood?: { name: string };
	case?: string; // EPSG:3857 coordinates as string "(x,y)"
	st_asgeojson?: string; // GeoJSON string with EPSG:3857 coordinates
}

export function SearchContent() {
	const { t } = useTranslation("common");
	const inputRef = useRef<HTMLInputElement>(null);
	const { map } = useMapStore();

	// Setup the search hook for institutions
	const {
		query,
		results,
		isLoading,
		resultErrorMessage,
		statusRef,
		setResults,
		setQuery,
	} = useSearch<Institution>({
		timeoutDuration: 500,
		searchFunction: searchInstitutions,
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
		const value = e.target.value;
		setQuery(value);
		resetNavigation();
	};

	// Helper function to extract EPSG:3857 coordinates from institution result
	const extractCoordinates = (result: Institution): [number, number] | null => {
		// Try to parse coordinates from the 'case' field: "(x,y)"
		if (result.case) {
			const match = result.case.match(/\(([^,]+),([^)]+)\)/);
			if (match) {
				const x = parseFloat(match[1]);
				const y = parseFloat(match[2]);
				if (!isNaN(x) && !isNaN(y)) {
					return [x, y];
				}
			}
		}

		// If no coordinates from 'case', try to parse from st_asgeojson
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

	const handleResultClick = (result: Institution) => {
		// Extract EPSG:3857 coordinates from the result
		const coordinates = extractCoordinates(result);

		// Zoom to the institution location if coordinates are available
		if (coordinates && map) {
			map.getView().animate({
				center: coordinates,
				duration: 2000,
				zoom: 15,
			});
		}

		setQuery("");
		setResults([]);
		resetNavigation();

		if (statusRef.current) {
			statusRef.current.textContent = `${result.name} ausgewählt.`;
		}
	};

	const handleBlur = (e: React.FocusEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setTimeout(() => {
				setResults([]);
			}, 100);
		}
	};

	const formatAddress = (institution: Institution) => {
		const parts = [
			institution.street,
			institution.street_number,
			institution.zip_code,
			institution.city?.name,
		].filter(Boolean);
		return parts.join(" ");
	};

	return (
		<div className="h-full overflow-hidden flex flex-col p-6 space-y-4">
			{/* Institution Search */}
			<div
				className="InstitutionSearch-root"
				role="search"
				aria-label="Institution search"
				onBlur={handleBlur}
			>
				<div className="relative">
					<Input
						ref={inputRef}
						placeholder={t("search.hint")}
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						aria-expanded={results.length > 0}
						aria-controls="institution-results"
						aria-label="Search institutions"
						aria-activedescendant={
							activeIndex >= 0 ? `institution-item-${activeIndex}` : undefined
						}
						aria-describedby="institution-search-status"
						className="w-full bg-white"
						icon={<Search className="w-5 h-5 text-foreground" />}
						iconPosition="left"
					/>

					{isLoading && (
						<div
							className="absolute right-3 top-1/2 transform -translate-y-1/2"
							aria-hidden="true"
						>
							<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
						</div>
					)}

					<div
						ref={statusRef}
						id="institution-search-status"
						className="sr-only"
						role="status"
						aria-live="polite"
					></div>
				</div>
			</div>
			{(results.length > 0 || resultErrorMessage) && (
				<div className="overflow-hidden h-full">
					<span className="body1 font-bold text-neutral-60">
						{t("search.suggestions")}
					</span>
					<ul
						id="institution-results"
						ref={listRef}
						role="listbox"
						className="max-h-196 h-auto overflow-y-auto"
						aria-label="Institution search results"
					>
						{results.length > 0 &&
							results.map((result, index) => (
								<li
									key={result.id}
									{...getItemProps(index)}
									id={`institution-item-${index}`}
									tabIndex={0}
									onClick={() => handleResultClick(result)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleResultClick(result);
										}
									}}
									onMouseDown={(e) => e.preventDefault()}
									className={`py-3 cursor-pointer border-b last:border-b-0 text-sm 
										${isKeyboardNav && index === activeIndex ? "bg-gray-100" : ""}
										${!isKeyboardNav && index === activeIndex ? "bg-gray-50" : ""}
										hover:bg-gray-100
									`}
									role="option"
									aria-selected={index === activeIndex}
									aria-label={`${result.name}, ${formatAddress(result)}`}
								>
									<div className="font-medium">{result.name}</div>
									<div className="text-gray-500 text-xs">
										{formatAddress(result)}
									</div>
								</li>
							))}
						{resultErrorMessage && (
							<li className="py-3 text-sm text-red-500">
								{resultErrorMessage}
							</li>
						)}
					</ul>
				</div>
			)}
			{results.length === 0 && (
				<div className="">
					<p className="body2">{t("search.description")}</p>
				</div>
			)}
		</div>
	);
}
