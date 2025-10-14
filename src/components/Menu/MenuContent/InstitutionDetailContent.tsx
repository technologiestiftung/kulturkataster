"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Address,
	Contact,
	OrganizationInfo,
	FundingInfo,
	FacilityInfo,
	StatusInfo,
	ToggleButton,
} from "@/components/Institution";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { getMatchingSubcategories } from "@/lib/utils/categoryUtils";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import {
	parseLatLongCoordinates,
	animateMapToCoordinates,
} from "@/lib/utils/mapUtils";
import { fromLonLat } from "ol/proj";
import { Category, Institution } from "@/types";
import { Feature, Geometry, GeoJsonProperties } from "geojson";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Header component
function InstitutionHeader({
	institutionData,
	onCenterMap,
}: {
	institutionData: Institution;
	onCenterMap?: () => void;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const isInUse = institutionData.utilization_status === "in_use";

	return (
		<CardHeader
			className={`relative p-0 ${isInUse ? "bg-brand-default" : "bg-neutral-20"} ${
				onCenterMap ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
			}`}
			onClick={onCenterMap}
		>
			<p className="body2 p-4 pb-0">
				{institutionData.parent_organizations?.[0]?.name || ""}
			</p>
			<CardTitle className="px-4 max-w-full overflow-hidden">
				<h1 id="institution-title" className="h1 wrap-anywhere">
					{institutionData.name}
				</h1>
			</CardTitle>

			{institutionData.categories?.length > 0 && (
				<section className="px-4">
					{institutionData.categories.map((category: Category) => {
						const IconComponent = getCategoryIconComponent(category.key);
						const matchingSubcategories = getMatchingSubcategories(
							category,
							institutionData.subcategories || [],
						);

						return (
							<div key={category.id} className="mb-2">
								<div className="flex items-center gap-2 h-6">
									<div className="w-6 h-6">
										<IconComponent />
									</div>
									<p className="body2 font-bold">
										{tEnum(`category.${category.key}`)}
									</p>
								</div>
								{matchingSubcategories.length > 0 && (
									<div className="body2 pl-8">
										{matchingSubcategories.map((subcategory, index) => (
											<span key={subcategory.id}>
												{index > 0 && ", "}
												{tEnum(`subcategory.${subcategory.key}`)}
											</span>
										))}
									</div>
								)}
							</div>
						);
					})}
				</section>
			)}

			<div
				className={`${isInUse ? "bg-brand-light" : "bg-alert"} p-4 flex gap-2`}
			>
				<span className="body2 font-bold">
					{t("institution.utilizationStatus")}:{" "}
				</span>

				{institutionData.utilization_status ? (
					<span className="body2">
						{tEnum(`utilization_status.${institutionData.utilization_status}`)}
					</span>
				) : (
					<span className="body2">{t("unknown")}</span>
				)}
			</div>
		</CardHeader>
	);
}

function InstitutionCard({
	institutionData,
	onCenterMap,
}: {
	institutionData: Institution;
	onCenterMap?: () => void;
}) {
	const [showMore, setShowMore] = useState(false);

	return (
		<Card className="w-full rounded-lg overflow-hidden border-none">
			<InstitutionHeader
				institutionData={institutionData}
				onCenterMap={onCenterMap}
			/>

			<CardContent className="p-4 space-y-4">
				<div className="space-y-4 flex flex-col">
					<Address institutionData={institutionData} />
					<Contact institutionData={institutionData} />
				</div>

				{showMore && (
					<div className="space-y-4">
						<OrganizationInfo institutionData={institutionData} />
						<FundingInfo institutionData={institutionData} />
						<FacilityInfo institutionData={institutionData} />
						<StatusInfo institutionData={institutionData} />
					</div>
				)}

				<ToggleButton
					showMore={showMore}
					onClick={() => setShowMore(!showMore)}
					hasInfo={true}
				/>
			</CardContent>
		</Card>
	);
}

export function InstitutionDetailContent() {
	const { t } = useTranslation("common");
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);
	const map = useMapStore((state) => state.map);

	const [institutionData, setInstitutionData] = useState<Institution | null>(
		null,
	);
	const [loading, setLoading] = useState(false);

	const findInstitutionFeature = (id: number) => {
		return institutions?.features.find(
			(feature) => feature.properties?.id === id,
		);
	};

	const extractCoordinatesFromInstitution = (
		institution: Feature<Geometry, GeoJsonProperties>,
	): [number, number] | null => {
		if (
			institution.geometry?.type === "Point" &&
			institution.geometry.coordinates
		) {
			const [lng, lat] = institution.geometry.coordinates;
			return [lng, lat];
		}

		if (institution.properties?.latlong) {
			return parseLatLongCoordinates(institution.properties.latlong);
		}

		return null;
	};

	const centerMapToInstitution = () => {
		if (!institutionData || !map) {
			return;
		}

		const institution = findInstitutionFeature(institutionData.id);
		if (!institution) return;

		const coordinates = extractCoordinatesFromInstitution(institution);
		if (coordinates) {
			const transformedCoords = fromLonLat(coordinates);
			animateMapToCoordinates(map, transformedCoords);
		}
	};

	useEffect(() => {
		if (!selectedInstitutionId) {
			setInstitutionData(null);
			return;
		}

		const fetchInstitutionData = async () => {
			try {
				setLoading(true);
				const institution = institutions?.features.find(
					(feature) => feature.properties?.id === selectedInstitutionId,
				);
				setInstitutionData((institution?.properties as Institution) || null);
			} catch (error) {
				console.error("Failed to fetch institution data:", error);
				setInstitutionData(null);
			} finally {
				setLoading(false);
			}
		};

		fetchInstitutionData();
	}, [selectedInstitutionId, institutions]);

	const handleClose = () => setSelectedInstitutionId(null);

	if (!selectedInstitutionId) return null;

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
					<div className="h-3 bg-gray-200 rounded w-2/3"></div>
				</div>
			</div>
		);
	}

	if (!institutionData) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">{t("institution.notFound")}</p>
				<Button
					onClick={handleClose}
					variant="link"
					className="mt-4 text-primary-dark hover:underline p-0 h-auto"
				>
					{t("institution.backToMap")}
				</Button>
			</div>
		);
	}

	return (
		<section
			className="p-2 h-full w-full"
			role="region"
			aria-labelledby="institution-title"
			aria-live="polite"
			tabIndex={0}
			autoFocus
		>
			<InstitutionCard
				institutionData={institutionData}
				onCenterMap={centerMapToInstitution}
			/>
		</section>
	);
}
