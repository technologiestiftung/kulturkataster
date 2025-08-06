"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useVenueStore } from "@/lib/store/venueStore";
import { CategoryType } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FC, useState } from "react";

const DISTRICTS = [
	"Charlottenburg-Wilmersdorf",
	"Friedrichshain-Kreuzberg",
	"Lichtenberg",
	"Marzahn-Hellersdorf",
	"Mitte",
	"Neukölln",
	"Pankow",
	"Reinickendorf",
	"Spandau",
	"Steglitz-Zehlendorf",
	"Tempelhof-Schöneberg",
	"Treptow-Köpenick",
];

const CATEGORY_GROUPS = [
	{
		name: "Ateliers",
		categories: [CategoryType.WORKSHOPS],
		subcategories: [
			"Atelierhäuser, Arbeitsraumprogramm",
			"Atelierhäuser, frei",
			"Atelierwohnungen",
		],
	},
	{
		name: "Ausbildungsorte",
		categories: [CategoryType.EDUCATION_PLACES],
		subcategories: [
			"Volkshochschulen",
			"Kunsthochschulen",
			"Jugendkunstschulen",
			"Private Kunstschulen",
			"Tanz",
			"Öffentliche Musikschulen",
			"Private Musikschulen",
			"Schauspiel/Theater",
			"Eurythmie/Bewegungskunst",
			"Zeitgenössischer Zirkus",
			"Ariel Arts",
			"Performance",
		],
	},
	{
		name: "Bibliotheken",
		categories: [CategoryType.LIBRARIES],
	},
	{
		name: "Buchhandlungen",
		categories: [CategoryType.BOOKSTORES],
	},
	{
		name: "Clubs und Musikspielstätten",
		categories: [CategoryType.MUSIC_VENUES],
	},
	{
		name: "Galerien",
		categories: [CategoryType.GALLERIES],
	},
	{
		name: "Kinos",
		categories: [CategoryType.CINEMAS],
	},
	{
		name: "Literaturorte",
		categories: [CategoryType.LITERATURE_PLACES],
	},
	{
		name: "Museen",
		categories: [CategoryType.MUSEUMS],
	},
	{
		name: "Orte der kulturellen Stadtentwicklung",
		categories: [CategoryType.URBAN_DEVELOPMENT],
	},
	{
		name: "Potenzialorte",
		categories: [CategoryType.POTENTIAL_SPACES],
	},
	{
		name: "Proberäume",
		categories: [CategoryType.REHEARSAL_ROOMS],
	},
	{
		name: "Projekträume und -initiativen",
		categories: [CategoryType.PROJECT_SPACES],
	},
	{
		name: "Soziokulturelle Zentren",
		categories: [CategoryType.SOCIOCULTURAL_CENTERS],
	},
	{
		name: "Spielstätten Tanz und Darstellende Künste",
		categories: [CategoryType.PERFORMING_ARTS],
	},
	{
		name: "Street-Art-Flächen",
		categories: [],
	},
];

const Filter: FC = () => {
	const setFilters = useVenueStore((state) => state.setFilters);
	const filters = useVenueStore((state) => state.filters);
  const applyFilters = useVenueStore((state) => state.applyFilters);
  const initializeVenues = useVenueStore((state) => state.initializeVenues);

	const [openSections, setOpenSections] = useState<string[]>([
		"districts",
		"categories",
	]);

	const toggleSection = (section: string) => {
		setOpenSections((prev) =>
			prev.includes(section)
				? prev.filter((s) => s !== section)
				: [...prev, section],
		);
	};

	const handleDistrictChange = (district: string, checked: boolean) => {
		console.log("[Filter] district, checked::", district, checked);

		if (!filters) return;

		const updatedDistricts = checked
			? [...filters.districts, district]
			: filters.districts.filter((d) => d !== district);

		const newFilters = { ...filters, districts: updatedDistricts };
		setFilters(newFilters);
		applyFilters();
	};

	// const handleCategoryChange = (category: CategoryType, checked: boolean) => {
	// 	console.log("[Filter] category, checked::", category, checked);

	// 	if (!filters) return;

	// 	const updatedCategories = checked
	// 		? [...filters.categories, category]
	// 		: filters.categories.filter((c) => c !== category);

	// 	const newFilters = { ...filters, categories: updatedCategories };
	// 	setFilters(newFilters);
	// 	applyFilters();
	// };

	const resetFilters = () => {
		setFilters({
			districts: [],
			categories: [],
		});
		initializeVenues();
	};

	return (
		<div className="Filter-root p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
			<div className="mb-6">
				<h2 className="text-lg font-semibold mb-2">
					Angezeigte Kulturorte in Berlin
				</h2>
				<div className="space-y-2 text-sm text-purple-600">
					<div className="flex items-center gap-2">
						<span>👁</span>
						<span>Geschlossene Orte ausblenden</span>
					</div>
					<div className="flex items-center gap-2">
						<span>→</span>
						<span>Alle 23 Orte in einer Liste anzeigen</span>
					</div>
				</div>
			</div>

			{/* Districts Section */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Bezirke</h3>
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Filter zurücksetzen
					</Button>
				</div>

				<div className="flex flex-wrap gap-2 mb-4">
					{DISTRICTS.map((district) => {
						const isSelected = filters?.districts.includes(district);
						return (
							<Button
								key={district}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								className={`text-xs ${isSelected ? "bg-gray-600 text-white" : ""}`}
								onClick={() => handleDistrictChange(district, !isSelected)}
							>
								{district}
								{isSelected && <span className="ml-1">×</span>}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Categories Section */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Kulturortkategorien</h3>
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Filter zurücksetzen
					</Button>
				</div>

				<div className="space-y-2">
					{CATEGORY_GROUPS.map((group) => (
						<Collapsible
							key={group.name}
							open={openSections.includes(group.name)}
							onOpenChange={() => toggleSection(group.name)}
						>
							<CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
								<div className="flex items-center gap-2">
									{openSections.includes(group.name) ? (
										<ChevronDown size={16} />
									) : (
										<ChevronUp size={16} />
									)}
									<span className="text-sm font-medium">{group.name}</span>
									<span className="text-xs text-gray-500">(164)</span>
								</div>
								{/* <Checkbox
									checked={group.categories.some((cat) =>
										filters?.categories.includes(cat),
									)}
									onCheckedChange={(checked) => {
										group.categories.forEach((cat) => {
											handleCategoryChange(cat, Boolean(checked));
										});
									}}
								/> */}
							</CollapsibleTrigger>

							<CollapsibleContent className="pl-6 space-y-1">
								{group.subcategories?.map((sub) => (
									<div
										key={sub}
										className="flex items-center justify-between py-1"
									>
										<span className="text-sm text-gray-600">{sub}</span>
										<Checkbox />
									</div>
								))}
							</CollapsibleContent>
						</Collapsible>
					))}
				</div>
			</div>
		</div>
	);
};

export default Filter;
